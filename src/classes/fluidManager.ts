class FluidManager {
    //#region Private variables
    private fluidCanvas: HTMLCanvasElement;
    private fluid: Fluid;
    private simulationMode: SimulationMode;

    private airfoilGridPoints!: Vector[];
    private airfoilOutline!: Vector[];
    private airfoilSurfaceNormals!: SurfaceNormal[];

    private angleOfAttack!: number;
    private angleOfAttackInfo: ParameterInfo;
    private angleOfAttackInput: HTMLInputElement;
    private freeStreamVelocity!: number;
    private freeStreamVelocityInfo: ParameterInfo;
    private freeStreamVelocityInput: HTMLInputElement;

    private simulationModeSelector: HTMLSelectElement;
    //#endregion


    constructor(canvas: HTMLCanvasElement, simulationModeSelector: HTMLSelectElement, angleOfAttackInput: HTMLInputElement, fSVelocityInput: HTMLInputElement) {
        this.fluidCanvas = canvas;
        //timestep is 0.53
        this.fluid = new Fluid(160, 90, 1, 0.1, 0.01, this.fluidCanvas);
        this.simulationMode = 'velocity';

        this.simulationModeSelector = simulationModeSelector;

        this.angleOfAttackInput = angleOfAttackInput;
        this.angleOfAttackInfo = { name: "AOA", labelText: "n/a", defaultValue: 0, bounds: { lower: -0.35, upper: 0.35 } };
        this.angleOfAttack = this.angleOfAttackInfo.defaultValue;

        this.freeStreamVelocityInput = fSVelocityInput;
        this.freeStreamVelocityInfo = { name: "FSV", labelText: "N/A", defaultValue: 0.1, bounds: { lower: 0.05, upper: 0.14 } };
        this.freeStreamVelocity = this.freeStreamVelocityInfo.defaultValue;
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

    //#region Getters
    get SurfaceNormals(): SurfaceNormal[] {
        return this.airfoilSurfaceNormals;
    }
    get PressureGradient(): Vector[] {
        return this.fluid.PressureGradient;
    }
    get Origin(): Vector {
        return this.fluid.origin;
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

    public updateAirfoil(outline: Vector[]): void {
        this.airfoilOutline = outline;
        this.rotateAirfoil();
        this.fluid.updateAirfoil(this.airfoilGridPoints);
    }
    //#endregion

    private rotateAirfoil() {
        let centroid: Vector = getCentroid(roundAll(this.airfoilOutline));
        let tempRotated = removeDuplicateVectors(
            this.airfoilOutline.map((vector) => roundVector(rotateVectorAroundPoint(vector, this.angleOfAttack, centroid)))
        );

        //let test = getSurfaceNormal(this.airfoilOutline[0], this.airfoilOutline);
        /*
        for (let i = 0; i < this.airfoilOutline.length; i++) {
            let test = getSurfaceNormal(this.airfoilOutline[i], this.airfoilOutline);
            console.log(`${this.airfoilOutline[i].x},${this.airfoilOutline[i].y} -> NORMAL: ${test.x},${test.y}`)
        }
        */
        this.airfoilSurfaceNormals = getAllSurfaceNormals(tempRotated);
        this.airfoilGridPoints = (tempRotated);
    }

    //#region Angle of Attack and Free Stream Velocity
    public updateAngleOfAttack(): void {
        this.angleOfAttack = -parseFloat(this.angleOfAttackInput.value);
        this.rotateAirfoil();
        this.fluid.updateAirfoil(this.airfoilGridPoints);

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
        console.log(this.freeStreamVelocity);
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
            console.log("Error");
        }
    }
    //#endregion
}