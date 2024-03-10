class AirfoilDesigner extends GraphingComponent {
    //#region Private variables
    private shape!: Shape;
    private parameterCache!: Record<string, number>
    private parameterInputContainer: HTMLDivElement;
    private parameterInputIDs!: Record<string, HTMLInputElement>;
    private airfoilSelector: HTMLSelectElement;
    private airfoilProfileNumText: HTMLParagraphElement;
    //#endregion

    constructor(canvas: HTMLCanvasElement, typeSelector: HTMLSelectElement, parameterInputContainer: HTMLDivElement, airfoilProfileNumText: HTMLParagraphElement) {
        super(canvas);
        this.airfoilSelector = typeSelector;
        this.parameterInputContainer = parameterInputContainer
        this.airfoilProfileNumText = airfoilProfileNumText;
        this.changeAirfoil();
    }

    //#region Getters
    get ShapeOutline(): TaggedPosition[] {
        return this.shape.Outline;
    }
    get ShapeArea(): number {
        return this.shape.getArea();
    }
    get ShapeType(): ShapeType {
        return this.shape.getType();
    }
    //#endregion 

    //#region Mapping
    /**
     * Maps a parameter to a HTML element
     * @param parameterName The name of the parameter
     * @param parameterInfo The information of the parameter required for setup
     * @returns The HTML element created
     */
    private mapParameter(parameterName: string, parameterInfo: ParameterInfo): HTMLInputElement {
        let parameterElement = document.createElement("input");
        parameterElement.type = "number";
        parameterElement.name = parameterName;
        parameterElement.id = parameterName;
        parameterElement.value = parameterInfo.defaultValue.toString();
        parameterElement.min = parameterInfo.bounds.lower.toString();
        parameterElement.max = parameterInfo.bounds.upper.toString();
        parameterElement.step = "0.01";
        parameterElement.onchange = updateAirfoilParameters;
        return parameterElement;
    }
    //#endregion

    //#region Graphs
    /**
     * Sets up the graph
     */
    override setupGraph(): void {
        let datasets = this.shape.GraphDatasets;

        this.graph = new Chart(this.context, {
            type: 'scatter',
            data: {
                datasets: mapDatasets(datasets),
            },
            options: {
                responsive: false,
                maintainAspectRatio: true,
                scales: {
                    xAxes: [{
                        gridLines: {
                            color: '#f8f8f2',
                            zeroLineColor: '#f8f8f2',
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
                            zeroLineColor: '#f8f8f2',
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
                        //Stops the default of getting the dataset
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
    }

    /**
     * Updates the graph, with a new graph dataset
     */
    override updateGraph(): void {
        this.datasets = this.shape.GraphDatasets;
        this.graph.data.datasets = mapDatasets(this.datasets);
        this.graph.update();
    }
    //#endregion

    //#region Airfoil functions
    /**
     * Takes any update to the airfoil parameters and updates the shape.
     * It then publishes any corrected parameter inputs and if necessary, adds a profile number
     */
    public updateAirfoil(): void {
        let airfoilType = this.shape.getType() as ShapeType;
        let currentParameters = this.getParametersFromInput();

        switch (airfoilType) {
            case "airfoil":
                this.shape.updateParameters(currentParameters);
                this.updateGraph();
                break;
            case "ellipse":
            case "rectangle":
            case "line":
                this.shape.updateParameters(currentParameters);
                break;
            default:
                console.log("Error");
                break;
        }

        this.publishParameters(this.shape.Parameters);
        this.updateProfileNumber(this.shape.Parameters);
    }

    /**
     * Resets all parameters to their default values
     */
    public resetAirfoil(): void {
        let parameters: Record<string, number> = {};
        //Obtain default parameters
        for (let [ID, _reference] of Object.entries(this.parameterInputIDs)) {
            parameters[ID] = this.shape.ParameterInfo[ID].defaultValue;
        }

        this.shape.updateParameters(parameters);

        let airfoilType = this.shape.getType() as ShapeType;
        if (airfoilType === "airfoil") {
            this.updateGraph();
        }

        this.publishParameters(parameters);
        this.updateProfileNumber(parameters);
    }

    /**
     * Changes the airfoil type and if necessary, disables the graph
     */
    public changeAirfoil(): void {
        if (this.shape === undefined) {
            //Default to airfoil
            this.shape = new Airfoil();
            this.setupParameterInputs();
            this.setupGraph();

            let currentParameters = this.getParametersFromInput();
            this.updateProfileNumber(currentParameters);

        } else {
            let targetShape = this.airfoilSelector.value as ShapeType;
            let currentShape = this.shape.getType() as ShapeType;

            if (currentShape === targetShape) {
                console.log("Same type");
            } else {
                //Change types
                this.switchAirfoil(targetShape);

                //Reset parameters and create new inputs for parameters
                this.setupParameterInputs();

                //Disable the graph if necessary
                if (targetShape === "airfoil") {
                    this.updateGraph();
                } else {
                    //Disable the graph - changing colours
                    this.disableGraph();
                }

                this.updateProfileNumber(this.shape.Parameters);
            }
        }
    }

    /**
     * Switches the airfoil type
     * @param newType The type to be switched to
     */
    private switchAirfoil(newType: ShapeType): void {
        switch (newType) {
            case "airfoil":
                this.shape = new Airfoil();
                break;
            case "rectangle":
                this.shape = new Rectangle();
                break;
            case "ellipse":
                this.shape = new Ellipse();
                break;
            case "line":
                this.shape = new Line();
                break;
            default:
                console.log("Error");
                break;
        }
    }

    /**
     * Updates the profile number
     * @param currentParameters The parameters of the shape, used to generate the profile number
     */
    private updateProfileNumber(currentParameters: Record<string, number>): void {
        let shapeType = this.shape.getType();
        let numString = "";

        //While I could use an if statement since there is only one different case
        //I am using a switch, keeping in mind that I ~could~ add different specifications of airfoils
        switch (shapeType) {
            case "airfoil":
                let m = Math.floor(currentParameters.m).toString();
                let p = Math.floor(currentParameters.p).toString()[0];
                let t = Math.floor(currentParameters.t).toString();
                t = currentParameters.t < 10 ? "0" + t : t;
                numString = "Profile Number: " + m + p + t;
                break;
            case "ellipse":
            case "rectangle":
            case "line":
                numString = "";
                break;
            default:
                console.log("Error");
                break;
        }

        this.airfoilProfileNumText.innerHTML = numString;
    }
    //#endregion

    //#region Parameter setup and handling functions
    /**
     * Takes the list of HTMLInputElements and gets the current values
     * @returns A record of the parameters with their input values
     */
    private getParametersFromInput(): Record<string, number> {
        let parameters: Record<string, number> = {};
        for (const [ID, reference] of Object.entries(this.parameterInputIDs)) {
            let referenceValue = parseFloat(reference.value);
            //Checking input is valid
            if (isNaN(referenceValue)) {
                referenceValue = this.parameterCache[ID];
            }

            parameters[ID] = enforceBounds(referenceValue, this.shape.ParameterInfo[ID].bounds);
        }
        return parameters;
    }

    /**
     * Publishes the correct parameter values to the HTMLInputElements
     * @param currentParameters The set of corrected values
     */
    private publishParameters(currentParameters: Record<string, number>): void {
        for (const [ID, reference] of Object.entries(this.parameterInputIDs)) {
            reference.value = currentParameters[ID].toString();
        }
        this.parameterCache = currentParameters;
    }

    /**
     * Dynamically generates HTMLInputElements for a shape's parameters with labels
     * Credit: https://stackoverflow.com/questions/14853779/dynamically-creating-a-specific-number-of-input-form-elements
     */
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
            this.parameterInputIDs[parameterName.toString()] = element;
            this.parameterCache[parameterName.toString()] = parseFloat(element.value);
        }
    }
    //#endregion
}