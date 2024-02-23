class FluidProperties {
    public localDensity: number[];
    public localVelocity: Vector[];
    public localPressure: number[];
    public pressureGradient: Vector[];
    public localCurl: number[];
    public solid: boolean[];

    constructor(numCells: number, density: number) {
        this.localDensity = new Array(numCells).fill(density);
        this.localVelocity = new Array(numCells).fill({ x: 0, y: 0 });
        this.localPressure = new Array(numCells).fill(0);
        this.localCurl = new Array(numCells).fill(0);
        this.pressureGradient = new Array(numCells).fill({ x: 0, y: 0 });
        this.solid = new Array(numCells).fill(false);
    }
}