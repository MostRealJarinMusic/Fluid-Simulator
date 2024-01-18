class AirfoilDesigner {
    //#region Private variables
    private graph!: Chart;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private shape!: Shape;
    private parameterCache!: Record<string, number>
    private parameterInputContainer: HTMLDivElement;
    private parameterInputIDs!: Record<string, HTMLInputElement>;
    private airfoilSelector: HTMLSelectElement;
    private airfoilProfileNumText: HTMLParagraphElement;
    //#endregion

    constructor(canvas: HTMLCanvasElement, typeSelector: HTMLSelectElement, parameterInputContainer: HTMLDivElement, airfoilProfileNumText: HTMLParagraphElement) {
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.airfoilSelector = typeSelector;
        this.parameterInputContainer = parameterInputContainer
        this.airfoilProfileNumText = airfoilProfileNumText;

        this.changeAirfoil();
    }

    get ShapeGridPoints(): Vector[] {
        return this.shape.GridPoints;
    }

    //#region Mapping

    private mapDatasets(datasets: GraphDataset[]): Chart.ChartDataSets[] {
        return datasets.map(dataset => ({
            label: dataset.label,
            data: dataset.plotPoints,
            pointRadius: 0.5,
            hoverRadius: 0.5,
            showLine: false,
            backgroundColor: dataset.colour,
            borderColor: dataset.colour,
            borderWidth: 2,
            pointStyle: 'circle',
        }));
    }

    private mapParameter(parameterName: string, parameterInfo: ShapeParameterInfo): HTMLInputElement {
        let parameterElement = document.createElement("input");
        parameterElement.type = "number";
        parameterElement.name = parameterName;
        parameterElement.id = parameterName;
        parameterElement.value = parameterInfo.defaultValue.toString();
        parameterElement.min = parameterInfo.bounds[0].toString();
        parameterElement.max = parameterInfo.bounds[1].toString();
        parameterElement.step = "0.1";
        parameterElement.onchange = updateAirfoilParameters;
        return parameterElement;
    }

    //#endregion

    //#region Graphs

    private setupGraph(): void {
        let datasets = this.shape.GraphDatasets;

        this.graph = new Chart(this.context, {
            type: 'scatter',
            data: {
                datasets: this.mapDatasets(datasets),
            },
            options: {
                responsive: false,
                maintainAspectRatio: true,
                scales: {
                    xAxes: [{
                        gridLines: {
                            color: '#f8f8f2',
                        },
                        ticks: {
                            min: -0.2,
                            max: 1.2,
                            stepSize: 0.1,
                            fontFamily: "'REM', sans-serif",
                            fontSize: 8,
                            fontColor: '#f8f8f2',
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'X',
                            fontFamily: "'REM', sans-serif",
                            fontSize: 10,
                            fontColor: '#f8f8f2',
                        }
                    }],
                    yAxes: [{
                        gridLines: {
                            color: '#f8f8f2',
                        },
                        ticks: {
                            min: -0.4,
                            max: 0.4,
                            fontFamily: "'REM', sans-serif",
                            fontSize: 8,
                            fontColor: '#f8f8f2',
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Y',
                            fontFamily: "'REM', sans-serif",
                            fontSize: 10,
                            fontColor: '#f8f8f2',
                        }
                    }],
                },
                tooltips: {
                    enabled: false
                },
                legend: {
                    onClick: function (_event: any, _legendItem: any) {
                        //Stops the default of getting hiding the dataset
                    },
                    labels: {
                        fontColor: '#f8f8f2',
                        fontFamily: "'REM', sans-serif",
                        fontSize: 8,
                    },
                    position: 'bottom',
                },
            }
        });

        //console.log(this.graph.options.scales?.xAxes);
    }

    private updateGraph(): void {
        let datasets = this.shape.GraphDatasets;
        this.graph.data.datasets = this.mapDatasets(datasets);
        this.graph.update();
    }

    private disableGraph(): void {
        //Change background colour
        let datasets: Chart.ChartDataSets[] = this.graph.data.datasets || [];

        for (let i = 0; i < datasets.length; i++) {
            datasets[i].backgroundColor = 'rgba(192, 192, 192, 0.2)';
            datasets[i].borderColor = 'rgba(192, 192, 192, 0.2)';
        }

        this.graph.update();
    }

    //#endregion

    //#region Airfoil functions
    public updateAirfoil(): void {
        //Euler's number is allowed as it is considered a number - BUG

        let airfoilType = this.shape.constructor.name;
        let currentParameters = this.getParametersFromInput();
        //console.log(currentParameters)

        switch (airfoilType) {
            case "Airfoil":
                this.shape.updateParameters(currentParameters);
                this.updateGraph();
                break;
            case "Circle":
            case "Ellipse":
            case "Rectangle":
            case "Line":
                this.shape.updateParameters(currentParameters);
                break;
            default:
                console.log("Something has gone terribly wrong...");
                break;
        }

        this.publishParameters(this.shape.Parameters);
        this.updateProfileNumber(this.shape.Parameters);
    }

    public resetAirfoil(): void {
        let parameters: Record<string, number> = {};
        //Obtain default parameters
        for (const [ID, _reference] of Object.entries(this.parameterInputIDs)) {
            parameters[ID] = this.shape.ParameterInfo[ID].defaultValue;
        }

        this.shape.updateParameters(parameters);

        let airfoilType = this.shape.constructor.name;
        if (airfoilType === "Airfoil") {
            this.updateGraph();
        }

        this.publishParameters(parameters);
        this.updateProfileNumber(parameters);
    }

    //Disable displaying the chart unless the selected preset is Airfoil
    public changeAirfoil(): void {
        if (this.shape === undefined) {
            this.shape = new Airfoil();
            this.setupParameterInputs();
            this.setupGraph();

            let currentParameters = this.getParametersFromInput();
            this.updateProfileNumber(currentParameters);

        } else {
            let targetShape = this.airfoilSelector.value;
            let currentShape = this.shape.constructor.name;

            if (currentShape === targetShape) {
                console.log("Same type");
            } else {
                //Change types
                this.switchAirfoil(targetShape);

                //Reset parameters and create new inputs for parameters
                this.setupParameterInputs();

                //Disable the graph if necessary
                if (targetShape === "Airfoil") {
                    this.updateGraph();
                } else {
                    //Disable the graph - changing colours
                    //console.log("Disabling the graph");
                    this.disableGraph();
                }

                this.updateProfileNumber(this.shape.Parameters);
            }
        }
    }

    private switchAirfoil(newType: string): void {
        switch (newType) {
            case "Airfoil":
                this.shape = new Airfoil();
                break;
            case "Rectangle":
                this.shape = new Rectangle();
                break;
            case "Ellipse":
                this.shape = new Ellipse();
                break;
            case "Line":
                this.shape = new Line();
                break;
            default:
                console.log("Either someone has gone horribly wrong or the class hasn't been implemented yet.");
                break;
        }
    }

    private updateProfileNumber(currentParameters: Record<string, number>): void {
        let shapeType = this.shape.constructor.name;
        let numString = "";

        //While I could use an if statement since there is only one different case
        //I am using a switch, keeping in mind that I could add different specifications of airfoils
        switch (shapeType) {
            case "Airfoil":
                let m = Math.floor(currentParameters.m).toString();
                let p = Math.floor(currentParameters.p).toString()[0];
                let t = Math.floor(currentParameters.t).toString();
                if (currentParameters.t < 10) {
                    t = "0" + t
                }

                numString = "Profile Number: " + m + p + t;
                break;
            case "Circle":
            case "Ellipse":
            case "Rectangle":
            case "Line":
                numString = "";
                break;
            default:
                console.log("Something has gone terribly wrong...");
                break;
        }

        this.airfoilProfileNumText.innerHTML = numString;
    }
    //#endregion

    //#region Parameter setup and handling functions
    private getParametersFromInput(): Record<string, number> {
        let parameters: Record<string, number> = {};
        for (const [ID, reference] of Object.entries(this.parameterInputIDs)) {
            let referenceValue = parseInt(reference.value);
            if (isNaN(referenceValue)) {
                referenceValue = this.parameterCache[ID];
            }

            parameters[ID] = enforceBounds(referenceValue, this.shape.ParameterInfo[ID].bounds);
        }
        return parameters;
    }

    private publishParameters(currentParameters: Record<string, number>): void {
        for (const [ID, reference] of Object.entries(this.parameterInputIDs)) {
            reference.value = currentParameters[ID].toString();
        }
        this.parameterCache = currentParameters;

        //console.log(this.parameterCache);
    }

    //Dynamically generate parameter inputs for each shape with labels
    //Credit: https://stackoverflow.com/questions/14853779/dynamically-creating-a-specific-number-of-input-form-elements
    private setupParameterInputs(): void {
        let shape = this.shape;
        let container = this.parameterInputContainer;

        //Clears the container of any parameters
        while (container.hasChildNodes()) {
            container.removeChild(container.lastChild as Node);
        }

        //Clear current parameters
        this.parameterInputIDs = {};
        this.parameterCache = {};

        for (const [parameterName, parameterInfo] of Object.entries(shape.ParameterInfo)) {
            let parameterInputLabel = document.createElement("label");
            parameterInputLabel.setAttribute("for", parameterName);
            parameterInputLabel.innerHTML = parameterInfo.labelText + ": ";
            let parameterInput = this.mapParameter(parameterName, parameterInfo);

            container.appendChild(parameterInputLabel);
            container.appendChild(parameterInput);
            container.appendChild(document.createElement("br"));

            let element = document.getElementById(parameterName) as HTMLInputElement;
            this.parameterInputIDs[`${parameterName}`] = element;
            this.parameterCache[`${parameterName}`] = parseInt(element.value);

            //console.log(this.parameterCache)
        }
    }
    //#endregion
}