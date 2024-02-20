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

    private dCentre!: number[];
    private dNorth!: number[];
    private dNorthEast!: number[];
    private dEast!: number[];
    private dSouthEast!: number[];
    private dSouth!: number[];
    private dSouthWest!: number[];
    private dWest!: number[];
    private dNorthWest!: number[];

    private equilibriumDistribution: number[][];
    private localDensity: number[];
    private localVelocity: Vector[];
    private localPressure: number[];
    private localCurl: number[];
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

        this.dCentre = new Array(this.numCells);
        this.dNorth = new Array(this.numCells);
        this.dNorthEast = new Array(this.numCells);
        this.dEast = new Array(this.numCells);
        this.dSouthEast = new Array(this.numCells);
        this.dSouth = new Array(this.numCells);
        this.dSouthWest = new Array(this.numCells);
        this.dWest = new Array(this.numCells);
        this.dNorthWest = new Array(this.numCells);

        //#endregion

        //#region Local properties
        this.localDensity = new Array(this.numCells).fill(this.density);
        this.localVelocity = new Array(this.numCells).fill({ x: 0, y: 0 });
        this.localPressure = new Array(this.numCells).fill(0);
        this.localCurl = new Array(this.numCells).fill(0);

        //Solidity marker
        this.solid = new Array(this.numCells).fill(false);
        //#endregion

        //#region Image setup
        this.canvas = canvas;
        this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
        this.image = this.context.createImageData(this.canvas.width, this.canvas.height);

        this.colourMap = new ColourMap();
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
        this.initStreamlines();
        //#endregion
    }

    private index(i: number, j: number): number {
        return i * this.height + j;
    }

    public initFluid(): void {
        let velocityVector: Vector = { x: this.inVelocity, y: 0 };
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {

                //for (let i = 0; i < this.discreteVelocities; i++) {

                /*
                if (i === 3) {
                    this.distribution[this.index(x, y)][i] = this.inVelocity;//this.getEquilibrium(this.latticeWeights[3], this.density, velocityVector, 3);
                } else {
                    this.distribution[this.index(x, y)][i] = 1//this.getEquilibrium(this.latticeWeights[i], this.density, velocityVector, parseInt(i));
                }
                this.equilibriumDistribution[this.index(x, y)][i] = 1;
                */
                //this.distribution[this.index(x, y)][i] = this.getEquilibrium(this.latticeWeights[i], this.density, velocityVector, i);
                //}

                /*
                for (let i = 0; i < this.discreteVelocities; i++) {
                    this.distribution[this.index(x, y)][i] = this.getEquilibrium(this.latticeWeights[i], this.density, velocityVector, i);
                }
                */


                this.dCentre[this.index(x, y)] = this.getEquilibrium(this.latticeWeights[0], this.density, velocityVector, 0);
                this.dNorth[this.index(x, y)] = this.getEquilibrium(this.latticeWeights[1], this.density, velocityVector, 1);
                this.dNorthEast[this.index(x, y)] = this.getEquilibrium(this.latticeWeights[2], this.density, velocityVector, 2);
                this.dEast[this.index(x, y)] = this.getEquilibrium(this.latticeWeights[3], this.density, velocityVector, 3);
                this.dSouthEast[this.index(x, y)] = this.getEquilibrium(this.latticeWeights[4], this.density, velocityVector, 4);
                this.dSouth[this.index(x, y)] = this.getEquilibrium(this.latticeWeights[5], this.density, velocityVector, 5);
                this.dSouthWest[this.index(x, y)] = this.getEquilibrium(this.latticeWeights[6], this.density, velocityVector, 6);
                this.dWest[this.index(x, y)] = this.getEquilibrium(this.latticeWeights[7], this.density, velocityVector, 7);
                this.dNorthWest[this.index(x, y)] = this.getEquilibrium(this.latticeWeights[8], this.density, velocityVector, 8);

            }
        }
    }

    public showDebug(): void {
        console.log("Distribution")
        console.log(this.distribution)
        console.log("Equilibrium Distribution")
        console.log(this.equilibriumDistribution)
    }

    public runMainLoop(): void {
        //if (this.running) {

        //for (let steps = 0; steps < 3; steps++) {
        //this.computeMoments();
        //this.applyBoundaryConditions();
        //this.computeEquilibrium();
        //this.collideLocally();
        //this.stream();

        this.newComputeMoments();
        this.newCollide();
        this.newStream();

        if (this.showTracers) this.moveTracers();
        //}
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

    private newCollide(): void {
        let viscosity = 0.01;
        let omega = 1 / (3 * viscosity + 0.5);

        //for (let y = 1; y < this.height - 1; y++) {
        //for (let x = 1; x < this.width - 1; x++) {
        for (let nodeIndex = 0; nodeIndex < this.numCells; nodeIndex++) {
            //let nodeIndex = this.index(x, y);
            let nodeDensity = this.localDensity[nodeIndex];
            let nodeVelocity = this.localVelocity[nodeIndex];

            this.dCentre[nodeIndex] += omega * (this.getEquilibrium(this.latticeWeights[0], nodeDensity, nodeVelocity, 0) - this.dCentre[nodeIndex]);
            this.dNorth[nodeIndex] += omega * (this.getEquilibrium(this.latticeWeights[1], nodeDensity, nodeVelocity, 1) - this.dNorth[nodeIndex]);
            this.dNorthEast[nodeIndex] += omega * (this.getEquilibrium(this.latticeWeights[2], nodeDensity, nodeVelocity, 2) - this.dNorthEast[nodeIndex]);
            this.dEast[nodeIndex] += omega * (this.getEquilibrium(this.latticeWeights[3], nodeDensity, nodeVelocity, 3) - this.dEast[nodeIndex]);
            this.dSouthEast[nodeIndex] += omega * (this.getEquilibrium(this.latticeWeights[4], nodeDensity, nodeVelocity, 4) - this.dSouthEast[nodeIndex]);
            this.dSouth[nodeIndex] += omega * (this.getEquilibrium(this.latticeWeights[5], nodeDensity, nodeVelocity, 5) - this.dSouth[nodeIndex]);
            this.dSouthWest[nodeIndex] += omega * (this.getEquilibrium(this.latticeWeights[6], nodeDensity, nodeVelocity, 6) - this.dSouthWest[nodeIndex]);
            this.dWest[nodeIndex] += omega * (this.getEquilibrium(this.latticeWeights[7], nodeDensity, nodeVelocity, 7) - this.dWest[nodeIndex]);
            this.dNorthWest[nodeIndex] += omega * (this.getEquilibrium(this.latticeWeights[8], nodeDensity, nodeVelocity, 8) - this.dNorthWest[nodeIndex]);
        }
        //}
    }

    private newStream(): void {
        //North west and north - 8 and 1
        for (let y = this.height - 2; y > 0; y--) {
            for (let x = 1; x < this.width - 1; x++) {
                //nw
                this.dNorthWest[this.index(x, y)] = this.dNorthWest[this.index(x + 1, y - 1)]
                //n
                this.dNorth[this.index(x, y)] = this.dNorth[this.index(x, y - 1)]
            }
        }

        //north east and east - 2 and 3
        for (let y = this.height - 2; y > 0; y--) {
            for (let x = this.width - 2; x > 0; x--) {
                //ne
                this.dNorthEast[this.index(x, y)] = this.dNorthEast[this.index(x - 1, y - 1)]
                //e
                this.dEast[this.index(x, y)] = this.dEast[this.index(x - 1, y)];
            }
        }

        //south east and south - 4 and 5
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = this.width - 2; x > 0; x--) {
                //se
                this.dSouthEast[this.index(x, y)] = this.dSouthEast[this.index(x - 1, y + 1)];

                //s
                this.dSouth[this.index(x, y)] = this.dSouth[this.index(x, y + 1)];

            }
        }

        //south west and west
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                //sw
                this.dSouthWest[this.index(x, y)] = this.dSouthWest[this.index(x + 1, y + 1)];

                //w
                this.dWest[this.index(x, y)] = this.dWest[this.index(x + 1, y)];
            }
        }
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                let nodeIndex = this.index(x, y);
                if (this.solid[nodeIndex]) {
                    this.dNorth[this.index(x, y + 1)] = this.dSouth[nodeIndex];
                    this.dNorthEast[this.index(x + 1, y + 1)] = this.dSouthWest[nodeIndex];
                    this.dEast[this.index(x + 1, y)] = this.dWest[nodeIndex];
                    this.dSouthEast[this.index(x + 1, y - 1)] = this.dNorthWest[nodeIndex];
                    this.dSouth[this.index(x, y - 1)] = this.dNorth[nodeIndex];
                    this.dSouthWest[this.index(x - 1, y - 1)] = this.dNorthEast[nodeIndex];
                    this.dWest[this.index(x - 1, y)] = this.dEast[nodeIndex];
                    this.dNorthWest[this.index(x - 1, y + 1)] = this.dSouthEast[nodeIndex];

                    this.localVelocity[nodeIndex] = { x: 0, y: 0 };
                }
            }
        }
    }

    private newComputeMoments(): void {
        for (let i = 0; i < this.numCells; i++) {
            let nodeDensity =
                this.dCentre[i] + this.dNorth[i] + this.dNorthEast[i] +
                this.dEast[i] + this.dSouthEast[i] + this.dSouth[i] +
                this.dSouthWest[i] + this.dWest[i] + this.dNorthWest[i];

            this.localVelocity[i] = {
                x: (this.dNorthEast[i] + this.dEast[i] + this.dSouthEast[i] -
                    this.dSouthWest[i] - this.dWest[i] - this.dNorthWest[i]) / nodeDensity,
                y: (this.dNorth[i] + this.dNorthEast[i] + this.dNorthWest[i] -
                    this.dSouthEast[i] - this.dSouth[i] - this.dSouthWest[i]) / nodeDensity
            }

            this.localDensity[i] = nodeDensity;
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

    private computeCurl(): void {
        //Finite differences method
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                let dYVelocityOverDx: number = this.localVelocity[this.index(x + 1, y)].y - this.localVelocity[this.index(x - 1, y)].y
                let dXVelocityOverDy: number = this.localVelocity[this.index(x, y + 1)].x - this.localVelocity[this.index(x, y - 1)].x;

                this.localCurl[this.index(x, y)] = dYVelocityOverDx - dXVelocityOverDy;
            }
        }
    }

    private computeMoments(): void {
        for (let nodeIndex = 0; nodeIndex < this.numCells; nodeIndex++) {
            //Functions
            const summation = (arr: number[]) => arr.reduce((acc, val) => acc + val, 0);
            const mapToLat = (arr: number[], lat: number[]) => arr.map((val, i) => val * lat[i]);

            let nodeDist = this.distribution[nodeIndex];
            let nodeDensity = nodeDist[0] + nodeDist[1] + nodeDist[2] + nodeDist[3]
                + nodeDist[4] + nodeDist[5] + nodeDist[6] + nodeDist[7]
                + nodeDist[8];
            //summation(nodeDist);

            //Velocity
            /*
            this.localVelocity[nodeIndex] = {
                x: summation(mapToLat(nodeDist, this.latticeXs)) / nodeDensity,
                y: summation(mapToLat(nodeDist, this.latticeYs)) / nodeDensity
            }
            */

            this.localVelocity[nodeIndex] = {
                x: (nodeDist[2] + nodeDist[3] + nodeDist[4] - nodeDist[6]
                    - nodeDist[7] - nodeDist[8]) / nodeDensity,
                y: (nodeDist[1] + nodeDist[2] + nodeDist[8] - nodeDist[4]
                    - nodeDist[5] - nodeDist[6]) / nodeDensity
            }

            //Density
            this.localDensity[nodeIndex] = nodeDensity;

            //Pressure????
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


                //this.dNorthWest[this.index(x, y)] = this.dNorthWest[this.index(x + 1, y - 1)]
                //n
                this.distribution[this.index(x, y)][1] =
                    this.distribution[this.index(x, y - 1)][1];

                //this.dNorth[this.index(x, y)] = this.dNorth[this.index(x, y - 1)]
            }
        }

        //north east and east - 2 and 3
        for (let y = this.height - 2; y > 0; y--) {
            for (let x = this.width - 2; x > 0; x--) {
                //ne
                this.distribution[this.index(x, y)][2] =
                    this.distribution[this.index(x - 1, y - 1)][2];

                //this.dNorthEast[this.index(x, y)] = this.dNorthEast[this.index(x - 1, y - 1)]
                //e
                this.distribution[this.index(x, y)][3] =
                    this.distribution[this.index(x - 1, y)][3];

                //this.dEast[this.index(x, y)] = this.dEast[this.index(x - 1, y)];
            }
        }

        //south east and south - 4 and 5
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = this.width - 2; x > 0; x--) {
                //se
                this.distribution[this.index(x, y)][4] =
                    this.distribution[this.index(x - 1, y + 1)][4];

                //this.dSouthEast[this.index(x, y)] = this.dSouthEast[this.index(x - 1, y + 1)];

                //s
                this.distribution[this.index(x, y)][5] =
                    this.distribution[this.index(x, y + 1)][5];

                //this.dSouth[this.index(x, y)] = this.dSouth[this.index(x, y + 1)];

            }
        }

        //south west and west
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                //sw
                this.distribution[this.index(x, y)][6] =
                    this.distribution[this.index(x + 1, y + 1)][6];

                //this.dSouthWest[this.index(x, y)] = this.dSouthWest[this.index(x + 1, y + 1)];

                //w
                this.distribution[this.index(x, y)][7] =
                    this.distribution[this.index(x + 1, y)][7];

                //this.dWest[this.index(x, y)] = this.dWest[this.index(x + 1, y)];
            }
        }
    }
    //#endregion

    //#region Tracers and streamlines
    private initTracers(): void {
        let rows = 8;
        let columns = 8;
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

    private initStreamlines(): void {
        let rows = 10;
        let columns = 6;
        let xOffset = this.width / columns;
        let yOffset = this.height / rows;

        for (let x = 0; x < columns - 1; x++) {
            for (let y = 0; y < rows; y++) {
                let position: Vector = { x: x * xOffset + xOffset / 2, y: y * yOffset + yOffset / 2 };
                this.streamlines.push(new StreamLine(position, 0.01));
            }
        }
    }

    private clearTracers(): void {
        while (this.tracers.length) {
            this.tracers.pop();
        }
    }

    private clearStreamlines(): void {
        while (this.streamlines.length) {
            this.streamlines.pop();
        }
    }

    private moveTracers(): void {
        for (let tracer of this.tracers) {
            let testPosition = tracer.Position;
            let roundedPos = roundVector(testPosition)
            if (testPosition.x >= this.width || this.solid[this.index(roundedPos.x, roundedPos.y)]) {
                tracer.resetPosition();
                testPosition.x = 1;
            }
            //console.log(`${position.x},${position.y}`);
            //let positionIndex = this.index(testPosition.x, testPosition.y);

            let velocity: Vector = this.sampleVelocity(testPosition);//this.localVelocity[positionIndex];

            //console.log(`${position.x},${position.y} => NEW VELOCITY ${velocity.x},${velocity.y}`)
            tracer.Velocity = velocity;
            tracer.move();
        }
    }

    private sampleVelocity(samplePosition: Vector): Vector {
        //Bilinear interpolation
        let x = samplePosition.x;
        let y = samplePosition.y;

        //Find the 4 surrounding points
        let x1 = Math.floor(x);
        let x2 = Math.ceil(x);
        let y1 = Math.floor(y);
        let y2 = Math.ceil(y);

        //Avoid divide by 0 errors when x and y are integers
        if (x1 === x2) x2++;
        if (y1 === y2) y2++;

        //Get fractional distances
        let dx = (x - x1) / (x2 - x1);
        let dy = (y - y1) / (y2 - y1);

        //Get Velocities
        let topLeft = this.localVelocity[this.index(x1, y1)];
        let topRight = this.localVelocity[this.index(x2, y1)];
        let bottomLeft = this.localVelocity[this.index(x1, y2)];
        let bottomRight = this.localVelocity[this.index(x2, y2)];

        //Interpolate
        let xVelocity =
            ((1 - dx) * (1 - dy) * topLeft.x) +
            (dx * (1 - dy) * topRight.x) +
            ((1 - dx) * dy * bottomLeft.x) +
            (dx * dy * bottomRight.x);

        let yVelocity =
            ((1 - dx) * (1 - dy) * topLeft.y) +
            (dx * (1 - dy) * topRight.y) +
            ((1 - dx) * dy * bottomLeft.y) +
            (dx * dy * bottomRight.y);

        return { x: xVelocity, y: yVelocity };
    }
    //#endregion

    //#region Drawing functions
    private gridPosToImagePos(gridPosition: Vector): Vector {
        return { x: gridPosition.x, y: this.height - gridPosition.y - 1 }
    }

    public drawFluid(simulationMode: SimulationMode) {
        if (simulationMode === 'curl') this.computeCurl();

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                let index = this.index(x, y);
                let colour: Colour = { red: 255, green: 255, blue: 255, alpha: 255 };
                let colourIndex = 0;
                let contrast = Math.pow(1.2, 1);

                if (this.solid[index]) {
                    //Solid
                    colour = { red: 98, green: 114, blue: 164, alpha: 255 };
                } else {
                    //Different colouring modes and different graphing modes
                    let mode = simulationMode;
                    switch (mode) {
                        case 'velocity':
                            let velocityMagnitude = absoluteVector(this.localVelocity[index]);
                            colourIndex = Math.round(this.colourMap.NumColours * (velocityMagnitude * 4 * contrast));
                            break;
                        case 'density':
                            let density = this.localDensity[index];
                            colourIndex = Math.round(this.colourMap.NumColours * ((density - 1) * 6 * contrast + 0.5));
                            break;
                        case 'curl':
                            let curl = this.localCurl[index];
                            colourIndex = Math.round(this.colourMap.NumColours * (curl * 5 * contrast + 0.5));
                            break;
                        default:
                            console.log("something has gone wrong");
                            break;
                    }

                    //Stop any out of bounds errors
                    colourIndex = Math.max(0, Math.min(colourIndex, this.colourMap.NumColours - 1));
                    colour = this.colourMap.Map[colourIndex];

                }
                let position = { x: x, y: y };

                this.colourPixel(position, colour);
            }
        }

        //Drawing order


        this.context.putImageData(this.image, 0, 0);
        if (this.showTracers) this.drawTracers();
        if (this.showStreamlines) this.drawStreamlines();
    }

    private drawStreamlines(): void {
        let velocityScale = 30;
        let simulationScale = 2;
        this.context.strokeStyle = "#000000";
        this.context.lineWidth = 1;

        for (let streamline of this.streamlines) {
            this.context.beginPath();

            let currentPosition = streamline.position;
            let imagePosition = this.gridPosToImagePos(currentPosition);

            this.context.moveTo(simulationScale * imagePosition.x, simulationScale * imagePosition.y);

            for (let n = 0; n < streamline.maxSteps; n++) {
                let velocityVector = scaleVector(this.sampleVelocity(currentPosition), velocityScale);
                currentPosition = addVectors(currentPosition, velocityVector);

                imagePosition = this.gridPosToImagePos(currentPosition);

                if (imagePosition.x >= this.width - 1 || imagePosition.x <= 0 || imagePosition.y >= this.height || imagePosition.y <= 0) break;

                this.context.lineTo(simulationScale * imagePosition.x, simulationScale * imagePosition.y);
            }

            this.context.stroke();
            this.context.closePath();
        }
    }

    private drawTracers(): void {
        let simulationScale = 2;
        this.context.fillStyle = "rgb(40,42,54)";
        for (let tracer of this.tracers) {
            let position = this.gridPosToImagePos(tracer.Position);
            this.context.fillRect(simulationScale * position.x, simulationScale * position.y, this.pxPerNode, this.pxPerNode);
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
        let originX = Math.round(this.width / 3);
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

        this.clearStreamlines();
        this.initStreamlines();

        this.setupObstacle();
    }
    //#endregion
}

//#region Tracer and Streamline
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
    public readonly position: Vector;
    public readonly stepSize: number;
    public readonly maxSteps: number;

    constructor(startPosition: Vector, stepSize: number) {
        this.position = startPosition;
        this.stepSize = stepSize;
        this.maxSteps = 10;
    }
}
//#endregion