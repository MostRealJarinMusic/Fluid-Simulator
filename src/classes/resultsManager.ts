class ResultsManager {
    //#region Private variables
    private graphingMode: GraphingMode;
    private graph!: Chart;
    private datasets!: GraphDataset[];
    private canvas!: HTMLCanvasElement;
    private context!: CanvasRenderingContext2D;

    private values: Record<string, number>;

    private airfoilDesigner!: AirfoilDesigner;
    private fluidManager!: FluidManager;
    private origin!: Vector;
    private fluidWidth!: number;

    private valuesDisplayContainer: HTMLDivElement;
    private graphingModeSelector: HTMLSelectElement;
    //#endregion


    constructor(canvas: HTMLCanvasElement, graphingModeSelector: HTMLSelectElement, valueDisplay: HTMLDivElement) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d') as CanvasRenderingContext2D;

        this.values = { lift: 0, drag: 0, LTDRatio: 0, liftCoefficient: 0, dragCoefficient: 0 };



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
                            /*
                            min: -0.4,
                            max: 0.4,
                            */
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
        //console.log(this.fluidManager.TaggedOutline);
        let taggedOutline = this.fluidManager.TaggedOutline;
        let field: number[] = [];

        switch (this.graphingMode) {
            case 'surfacePressure':
                field = this.fluidManager.PressureField;
                //console.log(field);
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
        let airfoilType = this.airfoilDesigner.ShapeType as AirfoilType;

        if (airfoilType === 'airfoil') {
            //graph!!!
            this.getDataForGraph();

            this.graph.data.datasets = mapDatasets(this.datasets);
            this.graph.update();
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

        console.log(this.graphingMode);
    }

    private resetGraph(): void {

    }

    //#endregion


    //#region Calculations

    public calculateResults(): void {
        this.calculateForce();
        this.calculateLiftCoefficient();
        this.calculateDragCoefficient();
        this.calculateLDRatio();
    }

    //pressureGradient: Vector[], surfaceNormals: SurfaceNormal[], origin: Vector, fluidWidth: number
    private calculateForce(): void {
        let pressureGradient = this.fluidManager.PressureGradient;
        let surfaceNormals = this.fluidManager.SurfaceNormals;

        //Iterate through each point at the surface normal
        this.values.lift = 0
        this.values.drag = 0;
        for (let pair of surfaceNormals) {
            let testPosition = roundVector(addVectors(pair.position, this.origin));
            let pressureAtPoint = pressureGradient[getIndex(testPosition.x, testPosition.y, this.fluidWidth)];
            let force = dotVectors(pressureAtPoint, pair.normal);
            this.values.lift += force * pair.normal.y;
            this.values.drag += force * pair.normal.x;
        }

        //I have the force by the airfoil on the fluid
        //I want the force on the airfoil by the fluid - therefore by Newton's third law, flip the force
        this.values.lift *= -1;
        this.values.drag *= -1;
    }

    public displayValues(): void {
        let liftText = document.getElementById("liftValue") as HTMLParagraphElement;
        let dragText = document.getElementById("dragValue") as HTMLParagraphElement;

        liftText.innerHTML = `Lift: ${this.values.lift.toFixed(3)}`;
        dragText.innerHTML = `Drag ${this.values.drag.toFixed(3)}`;
    }

    private calculateLDRatio() {

    }

    private calculateLiftCoefficient() {

    }

    private calculateDragCoefficient() {

    }
    //#endregion
}