class FluidManager {
    //#region Private variables
    private fluidCanvas: HTMLCanvasElement;
    public readonly fluid: Fluid;
    private simulationMode: SimulationMode;

    private airfoilTaggedOutline!: TaggedPosition[];
    private airfoilTaggedRotatedOutline!: TaggedPosition[];
    private airfoilGridPoints!: Vector[];
    private airfoilOutline!: Vector[];
    private airfoilSurfaceNormals!: SurfaceNormal[];

    private angleOfAttack!: number;
    private angleOfAttackInfo: ParameterInfo;
    private freeStreamVelocity!: number;
    private freeStreamVelocityInfo: ParameterInfo;

    private simulationModeSelector: HTMLSelectElement;

    private labelElements: Record<string, LabelledElement>;
    public readonly inputElements: Record<string, HTMLInputElement>;
    //#endregion

    constructor(canvas: HTMLCanvasElement, modeSelector: HTMLSelectElement, inputElements: Record<string, HTMLInputElement>, labelElements: Record<string, LabelledElement>) {
        this.fluidCanvas = canvas;
        this.fluid = new Fluid(160, 90, 1.225, 0.1, 0.01, this.fluidCanvas);
        this.simulationMode = 'velocity';

        this.inputElements = inputElements;
        this.labelElements = labelElements;

        this.simulationModeSelector = modeSelector;

        this.angleOfAttackInfo = { name: "AOA", labelText: "n/a", defaultValue: 0, bounds: { lower: -0.35, upper: 0.35 } };
        this.angleOfAttack = this.angleOfAttackInfo.defaultValue;
        this.freeStreamVelocityInfo = { name: "FSV", labelText: "N/A", defaultValue: 0.1, bounds: { lower: 0.05, upper: 0.13 } };
        this.freeStreamVelocity = this.freeStreamVelocityInfo.defaultValue;
        this.publishParameters();
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
    get TaggedOutline(): TaggedPosition[] {
        return this.airfoilTaggedRotatedOutline;
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
        this.airfoilTaggedOutline = taggedOutline;
        this.rotateAirfoil();
        this.fluid.updateAirfoil(this.airfoilGridPoints);
    }
    //#endregion

    /**
    * Takes an outline as a set of position vectors and returns the full shape as a set of position vectors
    * @param outline - The vector array of outline positions, as integer coordinates
    */
    private getFullShape(outline: Vector[]): Vector[] {
        let fullShape: Vector[] = [];
        let xMin = filterVectors(outline, 'x', 'least');
        let xMax = filterVectors(outline, 'x', 'most');

        for (let testX = xMin; testX <= xMax; testX++) {
            let vectorSubset = outline.filter((vector) => vector.x === testX);
            if (vectorSubset.length > 0) {
                let yMin = filterVectors(vectorSubset, 'y', 'least');
                let yMax = filterVectors(vectorSubset, 'y', 'most')

                for (let testY = yMin; testY <= yMax; testY++) {
                    let testVector: Vector = { x: testX, y: testY };
                    if (!checkInVectorList(fullShape, testVector)) {    //Slightly redundant
                        fullShape.push(testVector);
                    }
                }
            }
        }

        return fullShape;
    }

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

    private sortClosestToVector(vector: Vector, outline: Vector[]): Vector[] {
        outline = outline.filter((value) => {
            return value != vector
        });
        outline = outline.map((value) => subVectors(value, vector));
        let sorted = outline.sort((a, b) => absoluteVector(a) - absoluteVector(b));
        sorted = sorted.map((value) => addVectors(value, vector));
        return sorted;
    }


    private getAllSurfaceNormals(outline: Vector[]): SurfaceNormal[] {
        let fullShape = this.getFullShape(outline);
        let pairs: SurfaceNormal[] = [];
        for (let i = 0; i < outline.length; i++) {
            let currentVector = outline[i]
            let normal = this.getSurfaceNormal(currentVector, outline);
            let testPoint = roundVector(addVectors(currentVector, normal));
            if (checkInVectorList(fullShape, testPoint)) {
                //normal is facing inwards
                normal = scaleVector(normal, -1);
            }

            pairs.push({ position: currentVector, normal: normal });
        }
        return pairs;
    }


    private getSurfaceNormal(vector: Vector, outline: Vector[]): Vector {
        if (checkInVectorList(outline, vector)) {
            let sortedOutline = this.sortClosestToVector(vector, outline);
            let vector1 = sortedOutline[0];
            let vector2 = sortedOutline[1];

            let tangent = { x: vector1.x - vector2.x, y: vector1.y - vector2.y };
            //More accurate then rotate function, which introduces some rounding errors
            return normaliseVector({ x: -tangent.y, y: tangent.x });;
        }

        console.log("Error");
        return { x: 0, y: 0 };
    }

    private getCentroid(fullShape: Vector[]): Vector {
        let summation = fullShape.reduce((acc, { x, y }) => ({ x: acc.x + x, y: acc.y + y }), { x: 0, y: 0 });
        return scaleVector(summation, 1 / fullShape.length);
    }

    private roundAll(vectorSet: Vector[]): Vector[] {
        return vectorSet.map((vector) => roundVector(vector));
    }

    private rotateAirfoil() {
        this.airfoilOutline = untagPositions(this.airfoilTaggedOutline);

        let centroid: Vector = this.getCentroid(this.roundAll(this.airfoilOutline));
        this.airfoilTaggedRotatedOutline = this.removeDuplicateVectors(
            this.airfoilTaggedOutline.map((taggedPosition) => {
                return {
                    position: roundVector(rotateVectorAroundPoint(taggedPosition.position, this.angleOfAttack, centroid)),
                    tag: taggedPosition.tag
                }
            })
        );

        let tempRotated = untagPositions(this.airfoilTaggedRotatedOutline);
        this.airfoilSurfaceNormals = this.getAllSurfaceNormals(tempRotated);
        this.airfoilGridPoints = this.getFullShape(tempRotated);
    }

    //#region Angle of Attack and Free Stream Velocity
    public updateAngleOfAttack(): void {
        this.angleOfAttack = -parseFloat(this.inputElements.AOAInput.value);
        this.rotateAirfoil();
        this.fluid.updateAirfoil(this.airfoilGridPoints);

        this.publishParameters();
    }

    private radToDeg(angleRadians: number): number {
        let angleDegrees = -Math.round(angleRadians * (180 / Math.PI));
        return angleDegrees;
    }

    public resetParameters(): void {
        this.angleOfAttack = this.angleOfAttackInfo.defaultValue;

        this.freeStreamVelocity = this.freeStreamVelocityInfo.defaultValue;
        this.fluid.FreeStreamVelocity = this.freeStreamVelocity;
        this.publishParameters();
    }

    private publishParameters(): void {
        this.inputElements.AOAInput.value = (-this.angleOfAttack).toString();
        writeToElement(this.labelElements.AOA, this.radToDeg(this.angleOfAttack));
        this.inputElements.FSVInput.value = this.freeStreamVelocity.toString();
        writeToElement(this.labelElements.FSV, this.freeStreamVelocity);
    }

    public updateFreeStreamVelocity(): void {
        this.freeStreamVelocity = parseFloat(this.inputElements.FSVInput.value);
        this.fluid.FreeStreamVelocity = this.freeStreamVelocity;
        this.publishParameters();
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