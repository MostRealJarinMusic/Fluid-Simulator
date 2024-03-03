class ResultsManager extends GraphingComponent {
    //#region Private variables
    private values: Record<string, number>;
    private queues: Record<string, CustomQueue<number>>

    private airfoilDesigner!: AirfoilDesigner;
    private fluidManager!: FluidManager;
    private origin!: Vector;
    private fluidWidth!: number;
    private elements: Record<string, LabelledElement>
    //#endregion

    constructor(canvas: HTMLCanvasElement, elements: Record<string, LabelledElement>) {
        super(canvas);
        this.values = { lift: 0, drag: 0, LTDRatio: 0, liftCoefficient: 0, dragCoefficient: 0 };
        this.elements = elements;

        this.queues = {
            liftQueue: new CustomQueue<number>(500),
            dragQueue: new CustomQueue<number>(500)
        }
    }

    //#region Setup functions
    public assignFluidManager(fluidManager: FluidManager) {
        this.fluidManager = fluidManager;
        this.origin = this.fluidManager.fluid.origin;
        this.fluidWidth = this.fluidManager.fluid.Dimensions.x;
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
                            min: 0,
                            max: 0.002,
                            fontFamily: "'REM', sans-serif",
                            fontSize: 8,
                            fontColor: '#f8f8f2',
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Pressure Gradient, PG/Pa m^-1',
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
        return pressureSample / discreteVelocities;
    }

    private getDataForGraph(): void {
        let data: TaggedPosition[] = [];
        let taggedOutline = this.fluidManager.TaggedOutline;
        let field: number[] = this.fluidManager.fluid.PressureGradient.map((value) => absoluteVector(value));
        let outline = untagPositions(taggedOutline);
        let minX = filterVectors(outline, "x", "least");

        for (let taggedPosition of taggedOutline) {
            let position = roundVector(addVectors(taggedPosition.position, this.origin));
            let graphPoint: TaggedPosition = {
                position: {
                    x: (taggedPosition.position.x - minX),
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
        this.adjustGraphBounds();
        this.graph.update();
    }

    //Credit for nearest power of 10: https://stackoverflow.com/questions/19870067/round-up-to-nearest-power-of-10
    private adjustGraphBounds(): void {
        //Bound the x-axis depending on the graph
        let outline = untagPositions(this.fluidManager.TaggedOutline);
        let minX = filterVectors(outline, "x", "least");
        let maxX = filterVectors(outline, "x", "most");
        let xRange = maxX - minX === 0 ? 0.01 : maxX - minX;

        let steps = Math.pow(10, Math.ceil(Math.log10(xRange / 10)))

        //Typescript considers the possibility that the min and max properties are undefined
        //They are, so I'm telling Typescript to ignore its concerns
        //@ts-expect-error
        this.graph.options.scales.xAxes[0].ticks.min = -xRange * 0.1;
        //@ts-expect-error
        this.graph.options.scales.xAxes[0].ticks.max = maxX - minX + (xRange * 0.1);

        //@ts-expect-error
        this.graph.options.scales.xAxes[0].ticks.stepSize = steps;
    }
    //#endregion

    //#region Calculations
    public calculateResults(): void {
        this.calculateInstantForce();
        this.calculateAverageForce();
        this.calculateLiftCoefficient();
        this.calculateDragCoefficient();
        this.calculateLDRatio();
    }

    private calculateInstantForce(): void {
        let pressureGradient = this.fluidManager.fluid.PressureGradient;
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
        this.queues.liftQueue.enqueue(forceVector.y);
        this.queues.dragQueue.enqueue(forceVector.x);
    }

    private calculateAverageForce(): void {
        this.values.lift = this.queues.liftQueue.items().reduce((acc, val) => acc + val) / this.queues.liftQueue.size();
        this.values.drag = this.queues.dragQueue.items().reduce((acc, val) => acc + val) / this.queues.dragQueue.size();
    }

    private calculateLDRatio(): void {
        this.values.LTDRatio = this.values.liftCoefficient / this.values.dragCoefficient;
    }

    private calculateLiftCoefficient(): void {
        let airfoilArea = this.airfoilDesigner.ShapeArea;
        let dynamicPressure = this.getDynamicPressure();
        this.values.liftCoefficient = parseFloat((this.values.lift / (1000 * airfoilArea * dynamicPressure)).toFixed(4));
    }

    private calculateDragCoefficient(): void {
        let airfoilArea = this.airfoilDesigner.ShapeArea;
        let dynamicPressure = this.getDynamicPressure();
        this.values.dragCoefficient = parseFloat((this.values.drag / (1000 * airfoilArea * dynamicPressure)).toFixed(4));
    }

    private getDynamicPressure(): number {
        return (1 / 2) * (this.fluidManager.fluid.Density) * (this.fluidManager.fluid.FreeStreamVelocity ** 2)
    }

    public displayValues(): void {
        for (let [name, labelledElement] of Object.entries(this.elements)) {
            let value = this.values[name.toString()].toFixed(3);
            writeToElement(labelledElement, value);
        }
    }
    //#endregion
}