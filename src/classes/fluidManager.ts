class FluidManager {
    //#region Private variables
    private fluidCanvas: HTMLCanvasElement;
    private fluid: Fluid;
    private simulationMode: SimulationMode;

    private airfoilGridPoints!: Vector[];

    private angleOfAttack!: number;
    private angleOfAttackInfo: ParameterInfo;
    private angleOfAttackInput: HTMLInputElement;
    private freeStreamVelocity!: number;
    private freeStreamVelocityInfo: ParameterInfo;
    private freeStreamVelocityInput: HTMLInputElement;
    private simulationModeSelector: HTMLSelectElement;

    //private showTracers: boolean;
    //private showStreamlines: boolean;
    //#endregion


    constructor(canvas: HTMLCanvasElement, simulationModeSelector: HTMLSelectElement, angleOfAttackInput: HTMLInputElement, fSVelocityInput: HTMLInputElement) {
        this.fluidCanvas = canvas;
        //timestep is 0.53
        this.fluid = new Fluid(160, 90, 1, 0.1, 0.53, this.fluidCanvas);
        this.simulationMode = 'velocity';

        this.simulationModeSelector = simulationModeSelector;

        this.angleOfAttackInput = angleOfAttackInput;
        this.angleOfAttackInfo = { name: "AOA", labelText: "n/a", defaultValue: 0, bounds: { lower: 0, upper: 0.7 } };
        this.angleOfAttack = this.angleOfAttackInfo.defaultValue;

        this.freeStreamVelocityInput = fSVelocityInput;
        this.freeStreamVelocityInfo = { name: "FSV", labelText: "N/A", defaultValue: 0.1, bounds: { lower: 0.1, upper: 0.8 } };
        this.freeStreamVelocity = this.freeStreamVelocityInfo.defaultValue;

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
        let rotatedAirfoil = this.rotateAirfoil();
        //this.applyRotationToAirfoil();
        this.fluid.updateAirfoil(rotatedAirfoil);
    }
    //#endregion

    private rotateAirfoil(): Vector[] {
        return getFullShape(this.airfoilGridPoints.map((vector) => roundVector(rotateVector(vector, this.angleOfAttack))));
    }

    //#region Angle of Attack and Free Stream Velocity
    public updateAngleOfAttack(): void {
        this.angleOfAttack = -parseFloat(this.angleOfAttackInput.value);
        //console.log(this.angleOfAttack)
        let rotatedAirfoil = this.rotateAirfoil();
        this.fluid.updateAirfoil(rotatedAirfoil);

    }
    public resetParameters(): void {
        this.angleOfAttack = this.angleOfAttackInfo.defaultValue;

        this.freeStreamVelocity = this.freeStreamVelocityInfo.defaultValue;
        this.fluid.FreeStreamVelocity = this.freeStreamVelocity;
        this.publishParameters();
    }

    private publishParameters(): void {
        this.angleOfAttackInput.value = this.angleOfAttack.toString();
        this.freeStreamVelocityInput.value = this.freeStreamVelocity.toString();
    }

    public updateFreeStreamVelocity(): void {
        this.freeStreamVelocity = parseFloat(this.freeStreamVelocityInput.value);
        this.fluid.FreeStreamVelocity = this.freeStreamVelocity;
    }

    //#endregion

    //#region Fluid simulation settings

    public updateSimulationMode(): void {
        let currentMode = this.simulationMode;
        let newMode = this.simulationModeSelector.value;

        if (currentMode !== newMode && isSimulationMode(newMode)) {
            this.simulationMode = newMode;
        } else {
            console.log("Error")
        }
    }
    //#endregion
}