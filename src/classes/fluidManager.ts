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
    //#endregion


    constructor(canvas: HTMLCanvasElement, parameterInputContainer: HTMLDivElement, simulationModeSelector: HTMLSelectElement) {
        this.fluidCanvas = canvas;
        //timestep is 0.53
        this.fluid = new Fluid(160, 120, 1, 0.12, 0.53, this.fluidCanvas);
        this.simulationMode = { mode: 'velocity' };

        this.parameterInputContainer = parameterInputContainer;
        this.simulationModeSelector = simulationModeSelector;
    }

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

    private applyRotationToAirfoil(): void {
        let tempTheta = - Math.PI / 4;
        this.airfoilGridPoints = getFullShape(this.airfoilGridPoints.map((vector) => roundVector(rotateVector(vector, tempTheta))));
    }

    //#region Fluid simulation settings

    public updateSimulationMode(): void {
        let currentMode = this.simulationMode.mode;
        let newMode = this.simulationModeSelector.value;

        if (currentMode !== newMode) {
            this.simulationMode.mode = newMode;
        } else {
            console.log("tee hee.")
        }
    }


    //#endregion


}