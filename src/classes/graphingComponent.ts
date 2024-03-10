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
    protected disableGraph(): void {
        //Change background colour
        let datasets: Chart.ChartDataSets[] = this.graph.data.datasets as Chart.ChartDataSets[];

        for (let i = 0; i < datasets.length; i++) {
            datasets[i].backgroundColor = 'rgba(192, 192, 192, 0.2)';
            datasets[i].borderColor = 'rgba(192, 192, 192, 0.2)';
        }
        this.graph.data.datasets = datasets;
        this.graph.update();
    }
}