class FluidManager {
    //#region Private variables
    private fluidCanvas: HTMLCanvasElement;
    private fluid: Fluid;

    private airfoilGridPoints!: Vector[];

    private angleOfAttack!: number;
    private freeStreamVelocity!: number;
    private parameterInputContainer!: HTMLDivElement;
    //#endregion



    constructor(canvas: HTMLCanvasElement, parameterInputContainer: HTMLDivElement) {
        this.fluidCanvas = canvas;
        this.fluid = new Fluid(160, 80, 1, 2.5, 0.53, this.fluidCanvas);

        this.parameterInputContainer = parameterInputContainer;
    }

    //#region Exposing fluid functions
    public initFluid(): void {
        this.fluid.initFluid();
    }

    public runMainLoop(): void {
        this.fluid.runMainLoop();
    }

    public drawFluid(): void {
        this.fluid.drawFluid();
    }

    public updateAirfoil(newGridPoints: Vector[]): void {
        this.fluid.updateAirfoil(newGridPoints);
    }
    //#endregion




}