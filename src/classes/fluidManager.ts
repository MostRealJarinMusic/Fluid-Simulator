class FluidManager {
    //#region Private variables
    private fluidCanvas: HTMLCanvasElement;
    private fluid: Fluid;
    private simulationMode: SimulationMode;

    private airfoilTaggedOutline!: TaggedPosition[];
    private airfoilTaggedRotatedOutline!: TaggedPosition[];
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
        this.fluid = new Fluid(160, 90, 1.225, 0.1, 0.01, this.fluidCanvas);
        this.simulationMode = 'velocity';

        this.simulationModeSelector = simulationModeSelector;

        this.angleOfAttackInput = angleOfAttackInput;
        this.angleOfAttackInfo = { name: "AOA", labelText: "n/a", defaultValue: 0, bounds: { lower: -0.35, upper: 0.35 } };
        this.angleOfAttack = this.angleOfAttackInfo.defaultValue;

        this.freeStreamVelocityInput = fSVelocityInput;
        this.freeStreamVelocityInfo = { name: "FSV", labelText: "N/A", defaultValue: 0.1, bounds: { lower: 0.05, upper: 0.13 } };
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
    get FluidWidth(): number {
        return this.fluid.Width;
    }
    get PressureField(): number[] {
        return this.fluid.PressureField;
    }
    get VelocityField(): Vector[] {
        return this.fluid.VelocityField;
    }
    get TaggedOutline(): TaggedPosition[] {
        return this.airfoilTaggedRotatedOutline;
    }
    get DynamicPressure(): number {
        return (1 / 2) * (this.fluid.Density) * (this.fluid.FreeStreamVelocity ** 2);
    }
    get Solid(): boolean[] {
        return this.fluid.Solid;
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

    public updateAirfoil(taggedOutline: TaggedPosition[]): void {
        //this.airfoilOutline = outline;
        this.airfoilTaggedOutline = taggedOutline;
        this.rotateAirfoil();
        this.fluid.updateAirfoil(this.airfoilGridPoints);
    }
    //#endregion

    private removeDuplicateVectors(taggedPositions: TaggedPosition[]): TaggedPosition[] {
        let finalTaggedPositions: TaggedPosition[] = [];
        let finalVectors: Vector[] = [];;
        for (let taggedPosition of taggedPositions) {
            if (!checkInVectorList(finalVectors, taggedPosition.position)) {
                finalVectors.push(taggedPosition.position);
                finalTaggedPositions.push(taggedPosition);
            }
        }
        return finalTaggedPositions;
    }

    private rotateAirfoil() {
        const untagPositions = (taggedPositions: TaggedPosition[]) => taggedPositions.map((value) => value.position);

        this.airfoilOutline = untagPositions(this.airfoilTaggedOutline);

        let centroid: Vector = getCentroid(roundAll(this.airfoilOutline));
        this.airfoilTaggedRotatedOutline = this.removeDuplicateVectors(
            this.airfoilTaggedOutline.map((taggedPosition) => {
                return {
                    position: roundVector(rotateVectorAroundPoint(taggedPosition.position, this.angleOfAttack, centroid)),
                    tag: taggedPosition.tag
                }
            })
        );

        let tempRotated = untagPositions(this.airfoilTaggedRotatedOutline);
        this.airfoilSurfaceNormals = getAllSurfaceNormals(tempRotated);
        this.airfoilGridPoints = getFullShape(tempRotated);
        this.fluid.SurfaceNormals = this.airfoilSurfaceNormals;
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