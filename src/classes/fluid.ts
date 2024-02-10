class Fluid {
    //#region Private variables
    private width: number;
    private height: number;
    private numCells: number;
    private density: number;
    private inVelocity: number;
    private freeStreamVelocity: number;
    private timescale: number;
    private discreteVelocities: number;
    private latticeIndices: number[];
    private latticeXs: number[];
    private latticeYs: number[];
    private oppositeIndices: number[];
    private latticeWeights: number[];
    private distribution: number[][];
    private equilibriumDistribution: number[][];
    private localDensity: number[];
    private localVelocity: Vector[];
    private localPressure: number[];

    private solid: boolean[];

    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private image: ImageData;
    private colourMap: ColourMap;
    private pxPerNode: number;

    private airfoilGridPoints!: Vector[];
    private running: boolean;


    private showTracers: boolean;
    private tracers: Tracer[];
    private showStreamlines: boolean;
    private streamlines: StreamLine[];


    //#endregion

    constructor(width: number, height: number, density: number, inVelocity: number, timescale: number, canvas: HTMLCanvasElement) {
        //#region Basic variables
        this.width = width;
        this.height = height;
        this.numCells = this.width * this.height;
        this.density = density;
        this.inVelocity = inVelocity;
        this.freeStreamVelocity = inVelocity;
        this.timescale = timescale;
        //#endregion

        //#region Lattice variables
        this.discreteVelocities = 9;
        this.latticeIndices = Array.from(
            { length: this.discreteVelocities },
            (_, index) => index,
        );

        this.latticeXs = [0, 0, 1, 1, 1, 0, -1, -1, -1];
        this.latticeYs = [0, 1, 1, 0, -1, -1, -1, 0, 1];
        this.oppositeIndices = [0, 5, 6, 7, 8, 1, 2, 3, 4];
        this.latticeWeights = [
            4 / 9,
            1 / 9,
            1 / 36,
            1 / 9,
            1 / 36,
            1 / 9,
            1 / 36,
            1 / 9,
            1 / 36,
        ];
        //#endregion

        //#region Distribution function
        this.distribution = create2DArrayFill(
            this.numCells,
            this.discreteVelocities,
            1,
        );
        this.equilibriumDistribution = create2DArrayFill(
            this.numCells,
            this.discreteVelocities,
            1,
        );
        //#endregion

        //#region Local properties
        this.localDensity = new Array(this.numCells).fill(this.density);
        this.localVelocity = new Array(this.numCells).fill({ x: 0, y: 0 });
        this.localPressure = new Array(this.numCells).fill(0);

        //Solidity marker
        this.solid = new Array(this.numCells).fill(false);
        //#endregion

        //#region Image setup
        this.canvas = canvas;
        this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
        this.image = this.context.createImageData(this.canvas.width, this.canvas.height);

        this.colourMap = new ColourMap();
        //console.log(this.colourMap.Map)
        this.pxPerNode = 2;
        //#endregion

        //#region Airfoil setup
        this.running = true;
        this.airfoilGridPoints = [];

        //#endregion

        //#region Tracers and streamlines
        this.showTracers = false;
        this.showStreamlines = false;

        this.tracers = [];
        this.streamlines = [];
        this.initTracers();
        //#endregion
    }

    private index(i: number, j: number): number {
        return i * this.height + j;
    }

    public initFluid(): void {
        let velocityVector: Vector = { x: this.inVelocity, y: 0 };
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                for (let i = 0; i < this.discreteVelocities; i++) {

                    /*
                    if (i === 3) {
                        this.distribution[this.index(x, y)][i] = this.inVelocity;//this.getEquilibrium(this.latticeWeights[3], this.density, velocityVector, 3);
                    } else {
                        this.distribution[this.index(x, y)][i] = 1//this.getEquilibrium(this.latticeWeights[i], this.density, velocityVector, parseInt(i));
                    }
                    this.equilibriumDistribution[this.index(x, y)][i] = 1;
                    */
                    this.distribution[this.index(x, y)][i] = this.getEquilibrium(this.latticeWeights[i], this.density, velocityVector, i);

                }

                //this.distribution[this.index(x, y)][2] = this.inVelocity;//this.getEquilibrium(this.latticeWeights[2], this.density, velocityVector, 2);
                //this.distribution[this.index(x, y)][3] = this.inVelocity;//this.getEquilibrium(this.latticeWeights[3], this.density, velocityVector, 3);
                //this.distribution[this.index(x, y)][4] = this.inVelocity//this.getEquilibrium(this.latticeWeights[4], this.density, [this.inVelocity, 0], 4);
            }
        }
        //this.computeEquilibrium();
        //this.showDebug();
    }

    public showDebug(): void {
        console.log("Distribution")
        console.log(this.distribution)
        console.log("Equilibrium Distribution")
        console.log(this.equilibriumDistribution)
    }

    public runMainLoop(): void {
        if (this.running) {

            //for (let steps = 0; steps < 3; steps++) {
            this.computeMoments();
            this.applyBoundaryConditions();
            this.computeEquilibrium();
            this.collideLocally();


            this.stream();

            this.moveTracers();

            //this.setInflow();

            //this.showDebug();
            //console.log(steps)
            //}
            if (this.showTracers) this.moveTracers();
        }
    }

    //#region Setters
    set ShowTracers(value: boolean) {
        this.showTracers = value;
        console.log(`Show Tracers: ${this.showTracers}`)
    }
    set ShowStreamlines(value: boolean) {
        this.showStreamlines = value;
        console.log(`Show Streamlines: ${this.showStreamlines}`)
    }

    set FreeStreamVelocity(value: number) {
        //Set the free stream velocity
        this.freeStreamVelocity = value;
        //console.log(this.freeStreamVelocity);
        /*
        this.inVelocity = value;
        this.initFluid();
        */
    }
    //#endregion

    //#region Main loop functions

    private computeMoments(): void {
        for (let nodeIndex = 0; nodeIndex < this.numCells; nodeIndex++) {
            //Functions
            const summation = (arr: number[]) => arr.reduce((acc, val) => acc + val, 0);
            const mapToLat = (arr: number[], lat: number[]) => arr.map((val, i) => val * lat[i]);

            let tempDistribution = this.distribution[nodeIndex];
            let tempDensity = summation(tempDistribution);

            //Velocity
            this.localVelocity[nodeIndex] = {
                x: summation(mapToLat(tempDistribution, this.latticeXs)) / tempDensity,
                y: summation(mapToLat(tempDistribution, this.latticeYs)) / tempDensity
            }

            //Density
            this.localDensity[nodeIndex] = tempDensity;

            //Pressure

            //console.log(`Density: ${tempDensity}`);
            //console.log(`UX: ${this.#localUXs[this.index(x, y)]}`);
            //console.log(`UY: ${this.#localUYs[this.index(x, y)]}`);
        }
    }

    private applyBoundaryConditions(): void {
        for (let x = 0; x < this.width - 2; x++) {
            for (let y = 0; y < this.height - 2; y++) {
                if (this.solid[this.index(x, y)]) {
                    //Reflect fluid distribution
                    this.distribution[this.index(x, y)] = this.oppositeIndices.map(
                        (index) => this.distribution[this.index(x, y)][index],
                    );

                    //Set velocity to 0
                    this.localVelocity[this.index(x, y)] = { x: 0, y: 0 };
                }
            }
        }
    }


    private getEquilibrium(weight: number, rho: number, velocityVector: Vector, latticeIndex: number): number {
        let latticeVector: Vector = { x: this.latticeXs[latticeIndex], y: this.latticeYs[latticeIndex] };
        let latticeDotU = dotVectors(latticeVector, velocityVector);
        let uDotU = dotVectors(velocityVector, velocityVector);

        return weight * rho * (1 + 3 * latticeDotU +
            (9 / 2) * latticeDotU ** 2 -
            (3 / 2) * uDotU);
    }

    private computeEquilibrium(): void {
        for (let nodeIndex = 0; nodeIndex < this.numCells; nodeIndex++) {
            for (let i in this.latticeIndices) {
                let localDensity = this.localDensity[nodeIndex];
                let localVelocity: Vector = this.localVelocity[nodeIndex];
                let weight = this.latticeWeights[i];
                let latticeVector: Vector = { x: this.latticeXs[i], y: this.latticeYs[i] };
                let latticeDotU = dotVectors(localVelocity, latticeVector) //Pre-calculations
                let uDotU = dotVectors(localVelocity, localVelocity);

                this.equilibriumDistribution[nodeIndex][i] =
                    weight * localDensity *
                    (1 +
                        3 * latticeDotU +
                        (9 / 2) * latticeDotU ** 2 -
                        (3 / 2) * uDotU);

                //this.equilibriumDistribution[this.index(x, y)][i] = this.getEquilibrium(weight, localDensity, [localUX, localUY], parseInt(i));
            }
        }
    }

    private collideLocally(): void {
        for (let nodeIndex = 0; nodeIndex < this.numCells; nodeIndex++) {
            for (let i in this.latticeIndices) {
                this.distribution[nodeIndex][i] =
                    this.distribution[nodeIndex][i] -
                    (1 / this.timescale) *
                    (this.distribution[nodeIndex][i] -
                        this.equilibriumDistribution[nodeIndex][i]);
            }
        }
    }

    private stream(): void {
        //North west and north - 8 and 1
        for (let y = this.height - 2; y > 0; y--) {
            for (let x = 1; x < this.width - 1; x++) {
                //nw
                this.distribution[this.index(x, y)][8] =
                    this.distribution[this.index(x + 1, y - 1)][8];
                //n
                this.distribution[this.index(x, y)][1] =
                    this.distribution[this.index(x, y - 1)][1];
            }
        }

        //north east and east - 2 and 3
        for (let y = this.height - 2; y > 0; y--) {
            for (let x = this.width - 2; x > 0; x--) {
                //ne
                this.distribution[this.index(x, y)][2] =
                    this.distribution[this.index(x - 1, y - 1)][2];
                //e
                this.distribution[this.index(x, y)][3] =
                    this.distribution[this.index(x - 1, y)][3];
            }
        }

        //south east and south - 4 and 5
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = this.width - 2; x > 0; x--) {
                //se
                this.distribution[this.index(x, y)][4] =
                    this.distribution[this.index(x - 1, y + 1)][4];
                //s
                this.distribution[this.index(x, y)][5] =
                    this.distribution[this.index(x, y + 1)][5];
            }
        }

        //south west and west
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                //sw
                this.distribution[this.index(x, y)][6] =
                    this.distribution[this.index(x + 1, y + 1)][6];
                //w
                this.distribution[this.index(x, y)][7] =
                    this.distribution[this.index(x + 1, y)][7];
            }
        }
    }
    //#endregion

    //#region Tracers and streamlines
    private initTracers(): void {
        //let numTracers = 200;
        let rows = 10;
        let columns = 10;
        let xOffset = Math.round(this.width / columns);
        let yOffset = Math.round(this.height / rows);
        let bounds: Bound = { lower: 0, upper: this.width };

        for (let x = 0; x < columns; x++) {
            for (let y = 0; y < rows; y++) {
                let position: Vector = { x: x * xOffset + xOffset / 2, y: y * yOffset + yOffset / 2 };
                this.tracers.push(new Tracer(position, bounds));
            }
        }
    }

    private clearTracers(): void {
        while (this.tracers.length) {
            this.tracers.pop();
        }
    }

    private moveTracers(): void {
        for (let tracer of this.tracers) {
            let testPosition = roundVector(tracer.Position);
            if (testPosition.x >= this.width || this.solid[this.index(testPosition.x, testPosition.y)]) {
                tracer.resetPosition();
                testPosition.x = 1;
            }
            //console.log(`${position.x},${position.y}`);
            let positionIndex = this.index(testPosition.x, testPosition.y);

            let velocity: Vector = this.localVelocity[positionIndex];

            //console.log(`${position.x},${position.y} => NEW VELOCITY ${velocity.x},${velocity.y}`)
            tracer.Velocity = velocity;
            tracer.move();
        }
    }

    //#endregion


    //#region Drawing functions
    private gridPosToImagePos(gridPosition: Vector): Vector {
        return { x: gridPosition.x, y: this.height - gridPosition.y - 1 }
    }

    public drawFluid(simulationMode: SimulationMode) {
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                let colour: Colour = { red: 255, green: 255, blue: 255, alpha: 255 };
                let colourIndex = 0;
                let contrast = Math.pow(1.2, 1);

                if (this.solid[this.index(x, y)]) {
                    //Solid
                    colour = { red: 98, green: 114, blue: 164, alpha: 255 };
                } else {
                    //Different colouring modes and different graphing modes
                    let mode = simulationMode;
                    switch (mode) {
                        case 'velocity':
                            let velocityMagnitude = absoluteVector(this.localVelocity[this.index(x, y)]);
                            colourIndex = Math.round(this.colourMap.NumColours * (velocityMagnitude * 4 * contrast));
                            break;
                        case 'density':
                            let density = this.localDensity[this.index(x, y)];
                            colourIndex = Math.round(this.colourMap.NumColours * ((density - 1) * 6 * contrast + 0.5));
                            break;
                        default:
                            console.log("something has gone wrong");
                            break;
                    }

                    //Stop any out of bounds errors
                    colourIndex = Math.max(0, Math.min(colourIndex, this.colourMap.NumColours - 1));
                    //colour = { red: this.colourMap.RedList[colourIndex], green: this.colourMap.GreenList[colourIndex], blue: this.colourMap.BlueList[colourIndex], alpha: 255 };
                    //console.log(colourIndex);
                    colour = this.colourMap.Map[colourIndex];

                }
                let position = { x: x, y: y };

                this.colourPixel(position, colour);
            }
        }
        if (this.showTracers) this.drawTracers();

        this.context.putImageData(this.image, 0, 0);


    }

    private drawTracers(): void {
        for (let tracer of this.tracers) {
            let colour: Colour = { red: 40, green: 42, blue: 54, alpha: 255 };
            let position = roundVector(tracer.Position);
            this.colourPixel(position, colour);
        }
    }

    private colourPixel(position: Vector, colour: Colour) {
        let pxPerNd = this.pxPerNode;
        let imagePosition = this.gridPosToImagePos(position);
        let x = imagePosition.x;
        let y = imagePosition.y;

        for (let pixelY = y * pxPerNd; pixelY < (y + 1) * pxPerNd; pixelY++) {
            for (let pixelX = x * pxPerNd; pixelX < (x + 1) * pxPerNd; pixelX++) {
                let imageIndex = (pixelX + pixelY * this.image.width) * 4;
                this.image.data[imageIndex] = colour.red;
                this.image.data[imageIndex + 1] = colour.green;
                this.image.data[imageIndex + 2] = colour.blue;
                this.image.data[imageIndex + 3] = colour.alpha;
            }
        }
    }



    //#endregion

    //#region Airfoil functions
    /*
    public setupDefaultObstacle(): void {
        let radiusSqr = 10 ** 2;
        let obstacleX = this.width / 3;
        let obstacleY = this.height / 2;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.distanceBetweenSqr(obstacleX, obstacleY, x, y) < radiusSqr) {
                    this.solid[this.index(x, y)] = true;
                } else {
                    this.solid[this.index(x, y)] = false;
                }
            }
        }
    }
    */

    private setupObstacle(): void {
        //Reset solid
        this.solid = new Array(this.numCells).fill(false);
        let originX = Math.round(this.width / 3 + this.width / 9);
        let originY = Math.round(this.height / 2);

        for (let i = 0; i < this.airfoilGridPoints.length; i++) {
            let point = this.airfoilGridPoints[i];
            let index = this.index(originX + point.x, originY + point.y);
            this.solid[index] = true;
        }

        this.initFluid();
    }

    public updateAirfoil(newGridPoints: Vector[]): void {
        this.airfoilGridPoints = newGridPoints;
        this.clearTracers();
        this.initTracers();

        this.setupObstacle();
    }

    //#endregion
}

class Tracer {
    private position: Vector;
    private velocity: Vector;
    private xBounds: Bound;

    constructor(startPosition: Vector, xBounds: Bound) {
        this.position = startPosition;
        this.velocity = { x: 0, y: 0 };
        this.xBounds = xBounds;
    }

    set Velocity(newVelocity: Vector) {
        this.velocity = newVelocity;
    }

    get Position(): Vector {
        return this.position;
    }

    public resetPosition(): void {
        this.position.x = 1;
    }

    move() {
        this.position = addVectors(this.position, this.velocity);

        if (Math.round(this.position.x) >= this.xBounds.upper - 1) {
            //Tracer has gone outside the map
            this.resetPosition();
        }
    }

}

class StreamLine {
    private startPosition: Vector;
    private stepSize: number;
    private maxSteps: number;
    private linePoints: Vector[];

    constructor(startPosition: Vector, stepSize: number) {
        this.startPosition = startPosition;
        this.stepSize = stepSize;
        this.maxSteps = 5;
        this.linePoints = [this.startPosition];
    }

    calculateLinePoints() {
        let tempPosition: Vector = this.startPosition;
        for (let n = 0; n < this.maxSteps; n++) {
            /*
            let velocity = //some sampling function here
            tempPosition.x += velocity.x * this.stepSize;
            tempPosition.y += velocity.y * this.stepSize;

            this.linePoints.push(tempPosition)
            */
        }
    }

    get LinePoints(): Vector[] {
        return this.linePoints;
    }
}