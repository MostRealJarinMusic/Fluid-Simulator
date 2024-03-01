class ResultsManager {
    //#region Private variables
    private graphingMode: GraphingMode;
    private graph!: Chart;
    private datasets!: GraphDataset[];
    //private canvas!: HTMLCanvasElement;
    private context!: CanvasRenderingContext2D;

    private values: Record<string, number>;
    private totals: Record<string, number>;

    private startTime: number;

    private airfoilDesigner!: AirfoilDesigner;
    private fluidManager!: FluidManager;
    private origin!: Vector;
    private fluidWidth!: number;

    private valuesDisplayContainer: HTMLDivElement;
    private elements!: Record<string, HTMLParagraphElement>;
    private graphingModeSelector: HTMLSelectElement;
    //#endregion


    constructor(canvas: HTMLCanvasElement, graphingModeSelector: HTMLSelectElement, valueDisplay: HTMLDivElement) {
        //this.canvas = canvas;
        this.context = canvas.getContext('2d') as CanvasRenderingContext2D;

        this.values = { lift: 0, drag: 0, LTDRatio: 0, liftCoefficient: 0, dragCoefficient: 0 };
        this.totals = { liftTotal: 0, dragTotal: 0 };

        this.startTime = Date.now();

        this.valuesDisplayContainer = valueDisplay;
        this.graphingMode = 'surfacePressure';
        this.graphingModeSelector = graphingModeSelector;
    }

    public assignFluidManager(fluidManager: FluidManager) {
        this.fluidManager = fluidManager;
        this.origin = this.fluidManager.Origin;
        this.fluidWidth = this.fluidManager.FluidWidth;
        this.setupGraph();
    }
    public assignAirfoilDesigner(airfoilDesigner: AirfoilDesigner) {
        this.airfoilDesigner = airfoilDesigner;
    }

    //#region Graphs
    private setupGraph(): void {
        //Bar graph for lift and drag
        //Scatter graph for against surface positions
        this.getDataForGraph();

        this.graph = new Chart(this.context, {
            type: 'scatter',
            data: {
                datasets: mapDatasets(this.datasets),
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
                            min: 0.404,
                            max: 0.4045,
                            fontFamily: "'REM', sans-serif",
                            fontSize: 8,
                            fontColor: '#f8f8f2',
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Surface Pressure',
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
    }

    private getDataForGraph(): void {
        let upperPoints: Vector[] = [];
        let lowerPoints: Vector[] = [];
        let taggedOutline = this.fluidManager.TaggedOutline;
        let field: number[] = [];

        switch (this.graphingMode) {
            case 'surfacePressure':
                field = this.fluidManager.PressureField;
                break;
            case 'velocity':
                field = this.fluidManager.VelocityField.map((value) => absoluteVector(value));
                break;
            default:
                console.log("Error");
                break;
        }

        for (let taggedPosition of taggedOutline) {
            let position = roundVector(addVectors(taggedPosition.position, this.origin));
            //console.log(taggedPosition.tag);
            //console.log(taggedPosition.position);
            //console.log(position);

            let graphPoint: Vector = {
                x: (taggedPosition.position.x + Math.round(nodesPerMeter / 2)) * nodeDistance,
                y: field[getIndex(position.x, position.y, this.fluidWidth)]
            };

            //console.log(graphPoint);

            if (taggedPosition.tag === 'lowerSurface') {
                lowerPoints.push(graphPoint);
            } else {
                upperPoints.push(graphPoint);
            }
        }

        let upperDataset: GraphDataset = { label: "Upper Airfoil Surface", points: upperPoints, colour: 'rgba(139,233,253,1)' }
        let lowerDataset: GraphDataset = { label: "Lower Airfoil Surface", points: lowerPoints, colour: 'rgba(241,250,140,1)' }
        this.datasets = [upperDataset, lowerDataset];
    }


    public updateGraph(): void {

        let airfoilType = this.airfoilDesigner.ShapeType as ShapeType;

        if (airfoilType === 'airfoil') {
            //graph!!!
            this.getDataForGraph();

            this.graph.data.datasets = mapDatasets(this.datasets);
            this.graph.update();
        } else {
            //Disable graph???
        }
    }

    public updateGraphingMode(): void {
        let currentMode: GraphingMode = this.graphingMode;
        let newMode = this.graphingModeSelector.value;

        if (currentMode !== newMode && isGraphingMode(newMode)) {
            this.graphingMode = newMode;
        } else {
            throw new Error("Error");
        }
    }

    private resetGraph(): void {

    }

    //#endregion


    //#region Calculations
    public resetTimer(): void {
        this.startTime = Date.now();
        this.totals.liftTotal = 0;
        this.totals.dragTotal = 0;
    }

    public calculateResults(): void {
        this.calculateInstantForce();
        this.calculateAverageForce();
        this.calculateLiftCoefficient();
        this.calculateDragCoefficient();
        this.calculateLDRatio();
    }

    private calculateInstantForce(): void {
        let pressureGradient = this.fluidManager.PressureGradient;
        let surfaceNormals = this.fluidManager.SurfaceNormals;

        //Iterate through each point at the surface normal
        //x component is drag, y component is lift
        let forceVector: Vector = { x: 0, y: 0 };
        for (let pair of surfaceNormals) {
            let testPosition = roundVector(addVectors(pair.position, this.origin));
            let pressureAtPoint = pressureGradient[getIndex(testPosition.x, testPosition.y, this.fluidWidth)];
            let force = dotVectors(pressureAtPoint, pair.normal);
            forceVector = addVectors(forceVector, scaleVector(pair.normal, force))
        }

        //I have the force by the airfoil on the fluid
        //I want the force on the airfoil by the fluid - therefore by Newton's third law, flip the force
        forceVector = scaleVector(forceVector, -1);
        this.totals.liftTotal += forceVector.y;
        this.totals.dragTotal += forceVector.x;
    }

    private calculateAverageForce(): void {
        let currentTime = Date.now();
        let elapsedTime = (currentTime - this.startTime) / 1000;
        this.values.lift = this.totals.liftTotal / elapsedTime;
        this.values.drag = this.totals.dragTotal / elapsedTime;
    }

    public displayValues(): void {
        let liftText = document.getElementById("liftValue") as HTMLParagraphElement;
        let dragText = document.getElementById("dragValue") as HTMLParagraphElement;
        let LTDText = document.getElementById("LTDValue") as HTMLParagraphElement;
        let liftCoefficientText = document.getElementById("liftCoefficientValue") as HTMLParagraphElement;
        let dragCoefficientText = document.getElementById("dragCoefficientValue") as HTMLParagraphElement;

        liftText.innerHTML = `Lift: ${this.values.lift.toFixed(3)}`;
        dragText.innerHTML = `Drag: ${this.values.drag.toFixed(3)}`;
        LTDText.innerHTML = `L/D Ratio: ${this.values.LTDRatio.toFixed(3)}`;
        liftCoefficientText.innerHTML = `Lift Coefficient: ${this.values.liftCoefficient.toFixed(2)}`;
        dragCoefficientText.innerHTML = `Drag Coefficient: ${this.values.dragCoefficient.toFixed(2)}`;
    }

    private calculateLDRatio() {
        this.values.LTDRatio = this.values.liftCoefficient / this.values.dragCoefficient;
    }

    private calculateLiftCoefficient() {
        let airfoilArea = this.airfoilDesigner.ShapeArea;
        let dynamicPressure = this.fluidManager.DynamicPressure;
        this.values.liftCoefficient = parseFloat(this.values.lift.toFixed(2)) / (10000 * airfoilArea * dynamicPressure);
    }

    private calculateDragCoefficient() {
        let airfoilArea = this.airfoilDesigner.ShapeArea;
        let dynamicPressure = this.fluidManager.DynamicPressure;
        this.values.dragCoefficient = parseFloat(this.values.drag.toFixed(2)) / (10000 * airfoilArea * dynamicPressure);
    }
    //#endregion
}