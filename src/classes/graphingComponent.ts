abstract class GraphingComponent {
    protected graph!: Chart;
    protected datasets!: GraphDataset[];
    protected canvas: HTMLCanvasElement;
    protected context: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d") as CanvasRenderingContext2D;
    }

    protected abstract setupGraph(): void;
    protected abstract updateGraph(): void;
    //public abstract resetGraph(): void;
}