class ResultsManager {
    //#region Private variables
    private graphingMode: GraphingMode;
    private graph!: Chart;
    private canvas!: HTMLCanvasElement;
    private context!: CanvasRenderingContext2D;

    private values: ResultsValues;

    private valuesDisplayContainer: HTMLDivElement;
    private graphingModeSelector: HTMLSelectElement;
    //#endregion


    constructor(canvas: HTMLCanvasElement, graphingModeSelector: HTMLSelectElement, valueDisplay: HTMLDivElement) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d') as CanvasRenderingContext2D;

        this.values = new ResultsValues();

        this.valuesDisplayContainer = valueDisplay;
        this.graphingMode = 'surfacePressure';
        this.graphingModeSelector = graphingModeSelector;
    }

    //#region Graphs

    private setupGraph(): void {

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
    }

    private resetGraph(): void {

    }

    //#endregion


    //#region Calculations
    public calculateForce(pressureGradient: Vector[], surfaceNormals: SurfaceNormal[], origin: Vector, fluidWidth: number): void {
        //Iterate through each point at the surface normal,
        //console.log(surfaceNormals);
        //let totalForce = 0;
        this.values.lift = 0
        this.values.drag = 0;
        for (let pair of surfaceNormals) {
            let testPosition = roundVector(addVectors(pair.position, origin));
            //console.log(testPosition);
            let pressureAtPoint = pressureGradient[globalIndex(testPosition.x, testPosition.y, fluidWidth)];
            //console.log(`At position: ${testPosition.x},${testPosition.y} -> pressureGrad: ${pressureAtPoint.x},${pressureAtPoint.y}`);
            let force = dotVectors(pressureAtPoint, pair.normal);
            //console.log(`Force at point ${force}`);
            //totalForce += force;
            this.values.lift += force * pair.normal.y;
            this.values.drag += force * pair.normal.x;
        }
        //console.log(`Lift ${lift}`);
        //console.log(`Drag ${drag}`);

        //console.log(`Total force ${totalForce}`);
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