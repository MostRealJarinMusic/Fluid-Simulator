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
        //timestep is 0.53
        this.fluid = new Fluid(160, 120, 1, 2.5, 0.7, this.fluidCanvas);

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
        this.airfoilGridPoints = newGridPoints;
        //this.applyRotationToAirfoil();
        this.fluid.updateAirfoil(this.airfoilGridPoints);
    }
    //#endregion

    private applyRotationToAirfoil(): void {
        let tempTheta = - Math.PI / 4;
        this.airfoilGridPoints = getFullShape(this.airfoilGridPoints.map((vector) => roundVector(rotateVector(vector, tempTheta))));
    }



}