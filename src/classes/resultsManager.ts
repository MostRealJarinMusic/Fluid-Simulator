class ResultsManager {
    //#region Private variables
    private graphingMode!: GraphMode;
    private graph!: Chart;
    private canvas!: HTMLCanvasElement;
    private context!: CanvasRenderingContext2D;

    private valuesDisplayContainer!: HTMLDivElement;
    //#endregion


    constructor(canvas: HTMLCanvasElement, valueDisplay: HTMLDivElement) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d') as CanvasRenderingContext2D;
        this.valuesDisplayContainer = valueDisplay;
    }

    //#region Graphs

    private setupGraph(): void {

    }

    private updateGraph(): void {

    }

    private resetGraph(): void {

    }

    //#endregion


    //#region Calculations
    private calculateLift() {

    }

    private calculateDrag() {

    }

    private calculateLTDRatio() {

    }

    private calculateLiftCoefficient() {

    }

    private calculateDragCoefficient() {

    }

    //#endregion

}