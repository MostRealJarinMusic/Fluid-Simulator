class ResultsManager {
    //#region Private variables
    private graphingMode: GraphingMode;
    private graph!: Chart;
    private canvas!: HTMLCanvasElement;
    private context!: CanvasRenderingContext2D;

    private values: ResultsValues;
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

        this.setupGraph();
    }

    public assignFluidManager(fluidManager: FluidManager) {
        this.fluidManager = fluidManager;
        this.origin = this.fluidManager.Origin;
        this.fluidWidth = this.fluidManager.FluidWidth;
    }

    //#region Graphs

    private setupGraph(): void {
        //Bar graph for lift and drag
        //Scatter graph for against surface positions
        //Disable depending on type
    }

    private updateGraph(): void {

    }

    public updateGraphingMode(): void {
        let currentMode = this.graphingMode;
        let newMode = this.graphingModeSelector.value;

        if (currentMode !== newMode && isGraphingMode(newMode)) {
            this.graphingMode = newMode;
        } else {
            throw new Error("Something has gone wrong");
        }

        console.log(this.graphingMode);
    }

    private resetGraph(): void {

    }

    //#endregion


    //#region Calculations
    //pressureGradient: Vector[], surfaceNormals: SurfaceNormal[], origin: Vector, fluidWidth: number
    public calculateForce(): void {
        let pressureGradient = this.fluidManager.PressureGradient;
        let surfaceNormals = this.fluidManager.SurfaceNormals;

        //Iterate through each point at the surface normal
        this.values.lift = 0
        this.values.drag = 0;
        for (let pair of surfaceNormals) {
            let testPosition = roundVector(addVectors(pair.position, this.origin));
            let pressureAtPoint = pressureGradient[globalIndex(testPosition.x, testPosition.y, this.fluidWidth)];
            let force = dotVectors(pressureAtPoint, pair.normal);
            this.values.lift += force * pair.normal.y;
            this.values.drag += force * pair.normal.x;
        }

        //By Newton's third law - I have the force by the airfoil on the fluid
        //I want the force on the airfoil by the fluid - flip the force
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