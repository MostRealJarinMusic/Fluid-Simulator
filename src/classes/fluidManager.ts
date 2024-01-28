class FluidManager {
    //#region Private variables
    private fluidCanvas: HTMLCanvasElement;
    private fluid: Fluid;
    private simulationMode: SimulationMode;

    private airfoilGridPoints!: Vector[];

    private angleOfAttack!: number;
    private freeStreamVelocity!: number;
    private parameterInputContainer!: HTMLDivElement;
    private simulationModeSelector: HTMLSelectElement;

    //private showTracers: boolean;
    //private showStreamlines: boolean;
    //#endregion


    constructor(canvas: HTMLCanvasElement, parameterInputContainer: HTMLDivElement, simulationModeSelector: HTMLSelectElement) {
        this.fluidCanvas = canvas;
        //timestep is 0.53
        this.fluid = new Fluid(160, 90, 1, 0.1, 0.53, this.fluidCanvas);
        this.simulationMode = 'velocity';

        this.parameterInputContainer = parameterInputContainer;
        this.simulationModeSelector = simulationModeSelector;

        //this.showTracers = false;
        //this.showStreamlines = false;
    }


    //#region Setters
    set ShowTracers(value: boolean) {
        this.fluid.ShowTracers = value;
    }

    set ShowStreamlines(value: boolean) {
        this.fluid.ShowStreamlines = value;
    }

    set FreeStreamVelocity(value: number) {
        this.fluid.FreeStreamVelocity = value;
    }

    set AngleOfAttack(angle: number) {
        this.angleOfAttack = -angle;
        //this.applyRotationToAirfoil();
        let rotatedAirfoil = this.rotateAirfoil();
        this.fluid.updateAirfoil(rotatedAirfoil);
    }

    //#endregion

    //#region Exposing fluid functions
    public initFluid(): void {
        this.fluid.initFluid();
    }

    public runMainLoop(): void {
        this.fluid.runMainLoop();
    }

    public drawFluid(): void {
        this.fluid.drawFluid(this.simulationMode);
    }

    public updateAirfoil(newGridPoints: Vector[]): void {
        this.airfoilGridPoints = newGridPoints;
        //this.applyRotationToAirfoil();
        this.fluid.updateAirfoil(this.airfoilGridPoints);
    }
    //#endregion

    private rotateAirfoil(): Vector[] {
        return getFullShape(this.airfoilGridPoints.map((vector) => roundVector(rotateVector(vector, this.angleOfAttack))));
    }

    //#region Fluid simulation settings

    public updateSimulationMode(): void {
        let currentMode = this.simulationMode;
        let newMode = this.simulationModeSelector.value;

        if (currentMode !== newMode && isSimulationMode(newMode)) {
            this.simulationMode = newMode;
        } else {
            console.log("tee hee.")
        }
    }


    //#endregion


}