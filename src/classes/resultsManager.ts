class ResultsManager extends GraphingComponent {
    //#region Private variables
    private values: Record<string, number>;
    private totals: Record<string, number>;

    private startTime: number;

    private airfoilDesigner!: AirfoilDesigner;
    private fluidManager!: FluidManager;
    private origin!: Vector;
    private fluidWidth!: number;

    private valuesDisplayContainer: HTMLDivElement;
    private elements!: Record<string, HTMLParagraphElement>;
    //#endregion


    constructor(canvas: HTMLCanvasElement, valueDisplay: HTMLDivElement) {
        super(canvas);

        this.values = { lift: 0, drag: 0, LTDRatio: 0, liftCoefficient: 0, dragCoefficient: 0 };
        this.totals = { liftTotal: 0, dragTotal: 0 };

        this.startTime = Date.now();

        this.valuesDisplayContainer = valueDisplay;
    }

    //#region Setup functions
    public assignFluidManager(fluidManager: FluidManager) {
        this.fluidManager = fluidManager;
        this.origin = this.fluidManager.Origin;
        this.fluidWidth = this.fluidManager.FluidWidth;
        this.setupGraph();
    }
    public assignAirfoilDesigner(airfoilDesigner: AirfoilDesigner) {
        this.airfoilDesigner = airfoilDesigner;
    }
    //#endregion

    //#region Graphs
    override setupGraph(): void {
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
                            //min: 0.404,
                            //max: 0.4045,
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

    private samplePoint(position: Vector, field: number[]): number {
        //Get average value around a point
        let pressureSample: number = latticeIndices.map((value) => {
            let sampleIndex = getIndex(position.x + latticeXs[value], position.y + latticeYs[value], this.fluidWidth);
            return field[sampleIndex];
        }).reduce((acc, val) => acc + val);
        return pressureSample / latticeIndices.length;
    }

    private getDataForGraph(): void {
        let data: TaggedPosition[] = [];
        let taggedOutline = this.fluidManager.TaggedOutline;
        let field: number[] = this.fluidManager.PressureField; //this.getField(this.graphingMode);

        for (let taggedPosition of taggedOutline) {
            let position = roundVector(addVectors(taggedPosition.position, this.origin));

            let graphPoint: TaggedPosition = {
                position: {
                    x: (taggedPosition.position.x + Math.round(nodesPerMeter / 2)) * nodeDistance,
                    y: this.samplePoint(position, field)
                },
                tag: taggedPosition.tag
            };
            data.push(graphPoint);
        }

        this.datasets = this.convertDataToDatasets(data);
    }

    private convertDataToDatasets(data: TaggedPosition[]): GraphDataset[] {
        let upperPoints: Vector[] = [];
        let lowerPoints: Vector[] = [];
        let defaultPoints: Vector[] = [];

        for (let taggedGraphPoint of data) {
            switch (taggedGraphPoint.tag) {
                case 'upperSurface':
                    upperPoints.push(taggedGraphPoint.position);
                    break;
                case 'lowerSurface':
                    lowerPoints.push(taggedGraphPoint.position);
                    break;
                default:
                    defaultPoints.push(taggedGraphPoint.position);
            }
        }
        let upperDataset: GraphDataset = { label: "Upper Airfoil Surface", points: upperPoints, colour: 'rgba(139,233,253,1)' }
        let lowerDataset: GraphDataset = { label: "Lower Airfoil Surface", points: lowerPoints, colour: 'rgba(241,250,140,1)' }
        let defaultDataset: GraphDataset = { label: "Default Surface", points: defaultPoints, colour: 'rgba(255,85,85,1)' }

        return [upperDataset, lowerDataset, defaultDataset].filter((value) => value.points.length > 0);;
    }

    override updateGraph(): void {
        this.getDataForGraph();
        this.graph.data.datasets = mapDatasets(this.datasets);
        this.graph.update();
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