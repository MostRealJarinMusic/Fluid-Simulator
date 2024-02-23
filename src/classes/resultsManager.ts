class ResultsManager {
    //#region Private variables
    private graphingMode: GraphingMode;
    private graph!: Chart;
    private canvas!: HTMLCanvasElement;
    private context!: CanvasRenderingContext2D;

    private valuesDisplayContainer: HTMLDivElement;
    private graphingModeSelector: HTMLSelectElement;
    //#endregion


    constructor(canvas: HTMLCanvasElement, graphingModeSelector: HTMLSelectElement, valueDisplay: HTMLDivElement) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d') as CanvasRenderingContext2D;
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
    private calculateLift() {

    }

    private calculateDrag() {

    }

    private calculateLDRatio() {

    }

    private calculateLiftCoefficient() {

    }

    private calculateDragCoefficient() {

    }
    //#endregion
}