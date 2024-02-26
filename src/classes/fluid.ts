/*
    Fluid, tracer and streamline classes
*/

class Fluid {
    //#region Private variables
    private width: number;
    private height: number;
    private numCells: number;
    private density: number;
    private freeStreamVelocity: number;
    private viscosity: number;
    private timescale: number;

    private dCentre!: number[];
    private dNorth!: number[];
    private dNorthEast!: number[];
    private dEast!: number[];
    private dSouthEast!: number[];
    private dSouth!: number[];
    private dSouthWest!: number[];
    private dWest!: number[];
    private dNorthWest!: number[];

    private distribution: number[][];
    private equilibriumDistribution: number[][];

    private properties: FluidProperties;

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

    public readonly origin: Vector;
    //#endregion

    constructor(width: number, height: number, density: number, freeStreamVelocity: number, viscosity: number, canvas: HTMLCanvasElement) {
        //#region Basic variables
        this.width = width;
        this.height = height;
        this.numCells = this.width * this.height;
        this.density = density;
        this.freeStreamVelocity = freeStreamVelocity;
        this.viscosity = viscosity;
        this.timescale = (viscosity / (latticeSpeedOfSound ** 2)) + 0.5;
        //#endregion

        //#region Distribution function
        this.distribution = create2DArrayFill(
            this.numCells,
            discreteVelocities,
            1,
        );
        this.equilibriumDistribution = create2DArrayFill(
            this.numCells,
            discreteVelocities,
            1,
        );
        this.setupDistribution();
        //#endregion

        //#region Local properties
        this.properties = new FluidProperties(this.numCells, this.density);
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
        let originX = Math.round(this.width / 3 + this.width / 10);
        let originY = Math.round(this.height / 2);
        this.origin = { x: originX, y: originY };
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
        //return i * this.height + j;
        return (this.width * j) + i;
    }

    private setupDistribution(): void {
        for (let dir = 0; dir < Object.keys(Directions).length / 2; dir++) {
            let field = `d${Directions[dir]}` as DistributionDir;
            // @ts-expect-error
            this[field] = new Array(this.numCells);
        }
    }

    public initFluid(): void {
        let velocityVector: Vector = { x: this.freeStreamVelocity, y: 0 };
        for (let nodeIndex = 0; nodeIndex < this.numCells; nodeIndex++) {
            /*
            for (let i = 0; i < this.discreteVelocities; i++) {
                this.distribution[this.index(x, y)][i] = this.getEquilibrium(this.latticeWeights[i], this.density, velocityVector, i);
            }
            */

            for (let dir = 0; dir < Object.keys(Directions).length / 2; dir++) {
                let latticeWeight = latticeWeights[dir];
                let direction = Directions[dir]
                let field = `d${direction}` as DistributionDir;
                // @ts-expect-error
                this[field][nodeIndex] = this.getEquilibrium(latticeWeight, this.density, velocityVector, dir);
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
        if (this.running) {
            /*
            //this.computeMoments();
            //this.applyBoundaryConditions();
            //this.computeEquilibrium();
            //this.collideLocally();
            //this.stream();
            */
            this.newComputeMoments();
            this.newCollide();
            this.newStream();
            this.newApplyBoundaryConditions();
            this.computePressureGradient();

            if (this.showTracers) this.moveTracers();
        }
    }

    //#region Getters
    get PressureGradient(): Vector[] {
        return this.properties.pressureGradient;
    }
    //#endregion

    //#region Setters
    set ShowTracers(value: boolean) {
        this.showTracers = value;
        //console.log(`Show Tracers: ${this.showTracers}`)
    }
    set ShowStreamlines(value: boolean) {
        this.showStreamlines = value;
        //console.log(`Show Streamlines: ${this.showStreamlines}`)
    }

    set FreeStreamVelocity(value: number) {
        //Set the free stream velocity
        this.freeStreamVelocity = value;
        this.initFluid();
    }
    //#endregion

    //#region Main loop functions
    private newCollide(): void {
        //Reciprocal of timescale
        let tauRecip = 1 / this.timescale;

        for (let i = 0; i < this.numCells; i++) {
            let density = this.properties.localDensity[i];
            let velocity = this.properties.localVelocity[i];

            //#region Collision step
            this.dCentre[i] += tauRecip * (this.getEquilibrium(latticeWeights[0], density, velocity, 0) - this.dCentre[i]);
            this.dNorth[i] += tauRecip * (this.getEquilibrium(latticeWeights[1], density, velocity, 1) - this.dNorth[i]);
            this.dNorthEast[i] += tauRecip * (this.getEquilibrium(latticeWeights[2], density, velocity, 2) - this.dNorthEast[i]);
            this.dEast[i] += tauRecip * (this.getEquilibrium(latticeWeights[3], density, velocity, 3) - this.dEast[i]);
            this.dSouthEast[i] += tauRecip * (this.getEquilibrium(latticeWeights[4], density, velocity, 4) - this.dSouthEast[i]);
            this.dSouth[i] += tauRecip * (this.getEquilibrium(latticeWeights[5], density, velocity, 5) - this.dSouth[i]);
            this.dSouthWest[i] += tauRecip * (this.getEquilibrium(latticeWeights[6], density, velocity, 6) - this.dSouthWest[i]);
            this.dWest[i] += tauRecip * (this.getEquilibrium(latticeWeights[7], density, velocity, 7) - this.dWest[i]);
            this.dNorthWest[i] += tauRecip * (this.getEquilibrium(latticeWeights[8], density, velocity, 8) - this.dNorthWest[i]);
            //#endregion

            //Amazingly, this somehow slows down the simulation by a significant amount
            /*
            for (let dir = 0; dir < Object.keys(Directions).length / 2; dir++) {
                let latticeWeight = latticeWeights[dir];
                let direction = Directions[dir]
                let field = `d${direction}` as DistributionDir;
                // @ts-expect-error
                this[field][i] += tauRecip * (this.getEquilibrium(latticeWeight, density, velocity, dir) - this[field][i]);
            }
            */
        }
    }

    private streamInDirection(x: number, y: number, direction: Directions) {
        let offset: Vector = { x: -latticeXs[direction], y: -latticeYs[direction] };
        let field = `d${Directions[direction]}` as DistributionDir;
        //@ts-expect-error
        this[field][this.index(x, y)] = this[field][this.index(x + offset.x, y + offset.y)];
    }

    //Credit???
    private newStream(): void {
        //north west and north - 8 and 1
        for (let y = this.height - 2; y > 0; y--) {
            for (let x = 1; x < this.width - 1; x++) {
                //nw
                this.dNorthWest[this.index(x, y)] = this.dNorthWest[this.index(x + 1, y - 1)]
                //this.streamInDirection(x, y, Directions.NorthWest);

                //n
                this.dNorth[this.index(x, y)] = this.dNorth[this.index(x, y - 1)]
                //this.streamInDirection(x, y, Directions.North);
            }
        }

        //north east and east - 2 and 3
        for (let y = this.height - 2; y > 0; y--) {
            for (let x = this.width - 2; x > 0; x--) {
                //ne
                this.dNorthEast[this.index(x, y)] = this.dNorthEast[this.index(x - 1, y - 1)];
                //this.streamInDirection(x, y, Directions.NorthEast);
                //e
                this.dEast[this.index(x, y)] = this.dEast[this.index(x - 1, y)];
                //this.streamInDirection(x, y, Directions.East);
            }
        }

        //south east and south - 4 and 5
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = this.width - 2; x > 0; x--) {
                //se
                this.dSouthEast[this.index(x, y)] = this.dSouthEast[this.index(x - 1, y + 1)];
                //this.streamInDirection(x, y, Directions.SouthEast);
                //s
                this.dSouth[this.index(x, y)] = this.dSouth[this.index(x, y + 1)];
                //this.streamInDirection(x, y, Directions.South);

            }
        }

        //south west and west
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                //sw
                this.dSouthWest[this.index(x, y)] = this.dSouthWest[this.index(x + 1, y + 1)];
                //this.streamInDirection(x, y, Directions.SouthWest);
                //w
                this.dWest[this.index(x, y)] = this.dWest[this.index(x + 1, y)];
                //this.streamInDirection(x, y, Directions.West);
            }
        }
    }


    private reflect(x: number, y: number, direction: number) {
        let offset: Vector = { x: latticeXs[direction], y: latticeYs[direction] };
        let oppositeDirection: Directions = getOppositeDirection(direction);
        let field = `d${Directions[direction]}` as DistributionDir;
        let oppositeField = `d${Directions[oppositeDirection]}` as DistributionDir;
        //@ts-expect-error
        this[field][this.index(x + offset.x, y + offset.y)] = this[oppositeField][this.index(x, y)];
    }

    private newApplyBoundaryConditions() {
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                let i = this.index(x, y);
                if (this.properties.solid[i]) {
                    //Bounce back
                    /*
                    for (let dir = 1; dir < Object.keys(Directions).length / 2; dir++) {
                        this.reflect(x, y, dir);
                    }
                    */

                    this.dNorth[this.index(x, y + 1)] = this.dSouth[i];
                    this.dNorthEast[this.index(x + 1, y + 1)] = this.dSouthWest[i];
                    this.dEast[this.index(x + 1, y)] = this.dWest[i];
                    this.dSouthEast[this.index(x + 1, y - 1)] = this.dNorthWest[i];
                    this.dSouth[this.index(x, y - 1)] = this.dNorth[i];
                    this.dSouthWest[this.index(x - 1, y - 1)] = this.dNorthEast[i];
                    this.dWest[this.index(x - 1, y)] = this.dEast[i];
                    this.dNorthWest[this.index(x - 1, y + 1)] = this.dSouthEast[i];

                    this.properties.localVelocity[i] = { x: 0, y: 0 };
                }
            }
        }
    }

    private getDistribution(nodeIndex: number): number[] {
        const mapToDist = (arr: number[], index: number) => arr.map((value) => {
            let field = `d${Directions[value]}` as DistributionDir;
            //@ts-expect-error
            return this[field][index]
        });

        return mapToDist(latticeIndices, nodeIndex);
    }

    private newComputeMoments(): void {
        for (let i = 0; i < this.numCells; i++) {
            const summation = (arr: number[]) => arr.reduce((acc, val) => acc + val, 0);
            const mapToLat = (arr: number[], lat: number[]) => arr.map((val, i) => val * lat[i]);

            //let nodeDistribution = this.getDistribution(i);

            let nodeDensity = //summation(nodeDistribution);
                this.dCentre[i] + this.dNorth[i] + this.dNorthEast[i] +
                this.dEast[i] + this.dSouthEast[i] + this.dSouth[i] +
                this.dSouthWest[i] + this.dWest[i] + this.dNorthWest[i];

            //Velocity
            this.properties.localVelocity[i] = {
                x: (this.dNorthEast[i] + this.dEast[i] + this.dSouthEast[i] -
                    this.dSouthWest[i] - this.dWest[i] - this.dNorthWest[i]) / nodeDensity,
                y: (this.dNorth[i] + this.dNorthEast[i] + this.dNorthWest[i] -
                    this.dSouthEast[i] - this.dSouth[i] - this.dSouthWest[i]) / nodeDensity
            }

            //Density
            this.properties.localDensity[i] = nodeDensity;

            //Pressure
            this.properties.localPressure[i] = (latticeSpeedOfSound ** 2) * nodeDensity;
        }
    }

    private getEquilibrium(weight: number, rho: number, velocityVector: Vector, latticeIndex: number): number {
        let latticeVector: Vector = { x: latticeXs[latticeIndex], y: latticeYs[latticeIndex] };
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
                //Partial derivatives
                let dYVelocityOverDx: number = this.properties.localVelocity[this.index(x + 1, y)].y - this.properties.localVelocity[this.index(x - 1, y)].y
                let dXVelocityOverDy: number = this.properties.localVelocity[this.index(x, y + 1)].x - this.properties.localVelocity[this.index(x, y - 1)].x;

                this.properties.localCurl[this.index(x, y)] = dYVelocityOverDx - dXVelocityOverDy;
            }
        }
    }

    private computePressureGradient(): void {
        //Finite differences method - same as curl
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                //Partial derivatives
                let dPressureOverDx: number = this.properties.localPressure[this.index(x + 1, y)] - this.properties.localPressure[this.index(x - 1, y)]
                let dPressureOverDy: number = this.properties.localPressure[this.index(x, y + 1)] - this.properties.localPressure[this.index(x, y - 1)];

                this.properties.pressureGradient[this.index(x, y)] = { x: dPressureOverDx / 2, y: dPressureOverDy / 2 };
            }
        }
    }

    private computeMoments(): void {
        for (let i = 0; i < this.numCells; i++) {
            //Functions
            const summation = (arr: number[]) => arr.reduce((acc, val) => acc + val, 0);
            const mapToLat = (arr: number[], lat: number[]) => arr.map((val, i) => val * lat[i]);

            let nodeDist = this.distribution[i];
            let nodeDensity = nodeDist[0] + nodeDist[1] + nodeDist[2] + nodeDist[3]
                + nodeDist[4] + nodeDist[5] + nodeDist[6] + nodeDist[7]
                + nodeDist[8];
            //summation(nodeDist);

            //Velocity
            /*
            this.properties.localVelocity[i] = {
                x: summation(mapToLat(nodeDist, this.latticeXs)) / nodeDensity,
                y: summation(mapToLat(nodeDist, this.latticeYs)) / nodeDensity
            }
            */

            this.properties.localVelocity[i] = {
                x: (nodeDist[2] + nodeDist[3] + nodeDist[4] - nodeDist[6]
                    - nodeDist[7] - nodeDist[8]) / nodeDensity,
                y: (nodeDist[1] + nodeDist[2] + nodeDist[8] - nodeDist[4]
                    - nodeDist[5] - nodeDist[6]) / nodeDensity
            }

            //Density
            this.properties.localDensity[i] = nodeDensity;

            //Pressure????
        }
    }

    private applyBoundaryConditions(): void {
        for (let x = 0; x < this.width - 2; x++) {
            for (let y = 0; y < this.height - 2; y++) {
                if (this.properties.solid[this.index(x, y)]) {
                    //Reflect fluid distribution
                    this.distribution[this.index(x, y)] = oppositeIndices.map(
                        (index) => this.distribution[this.index(x, y)][index],
                    );

                    //Set velocity to 0
                    this.properties.localVelocity[this.index(x, y)] = { x: 0, y: 0 };
                }
            }
        }
    }

    private computeEquilibrium(): void {
        for (let nodeIndex = 0; nodeIndex < this.numCells; nodeIndex++) {
            for (let i in latticeIndices) {
                let localDensity = this.properties.localDensity[nodeIndex];
                let localVelocity: Vector = this.properties.localVelocity[nodeIndex];
                let weight = latticeWeights[i];
                let latticeVector: Vector = { x: latticeXs[i], y: latticeYs[i] };
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
        for (let index = 0; index < this.numCells; index++) {
            //Slows down computation???
            for (let i in latticeIndices) {
                this.distribution[index][i] =
                    this.distribution[index][i] -
                    (1 / this.timescale) *
                    (this.distribution[index][i] -
                        this.equilibriumDistribution[index][i]);
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
        let columns = 10;
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
            if (testPosition.x >= this.width || this.properties.solid[this.index(roundedPos.x, roundedPos.y)]) {
                tracer.resetPosition();
                testPosition.x = 1;
            }
            let velocity: Vector = this.sampleVelocity(testPosition);
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
        let topLeft = this.properties.localVelocity[this.index(x1, y1)];
        let topRight = this.properties.localVelocity[this.index(x2, y1)];
        let bottomLeft = this.properties.localVelocity[this.index(x1, y2)];
        let bottomRight = this.properties.localVelocity[this.index(x2, y2)];

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
        //if (simulationMode === 'pressureGradient') this.computePressureGradient();


        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                let index = this.index(x, y);
                let colour: Colour = { red: 255, green: 255, blue: 255, alpha: 255 };
                let colourIndex = 0;
                let contrast = Math.pow(1.2, 1);

                if (this.properties.solid[index]) {
                    //Solid
                    colour = { red: 98, green: 114, blue: 164, alpha: 255 };
                } else {
                    //Different colouring modes and different graphing modes
                    let mode = simulationMode;
                    switch (mode) {
                        case 'velocity':
                            let velocityMagnitude = absoluteVector(this.properties.localVelocity[index]);
                            colourIndex = Math.round(this.colourMap.NumColours * (velocityMagnitude * 4 * contrast));
                            break;
                        case 'density':
                            let density = this.properties.localDensity[index];
                            colourIndex = Math.round(this.colourMap.NumColours * ((density - 1) * 6 * contrast + 0.5));
                            break;
                        case 'curl':
                            let curl = this.properties.localCurl[index];
                            colourIndex = Math.round(this.colourMap.NumColours * (curl * 5 * contrast + 0.5));
                            break;
                        case 'pressure':
                            //Since pressure is directly proportional to density
                            let pressure = this.properties.localPressure[index];
                            colourIndex = Math.round(this.colourMap.NumColours * ((2.9 * pressure - 1) * 5 * contrast + 0.5));
                            break;
                        case 'pressureGradient':
                            let pressureGradient = absoluteVector(this.properties.pressureGradient[index]);
                            colourIndex = Math.round(this.colourMap.NumColours * ((10 * pressureGradient) * 3 * contrast + 0.35));
                            break;
                        default:
                            console.log("Error");
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
        //this.drawNormals();
    }

    private drawStreamlines(): void {
        let velocityScale = 10;
        let simulationScale = this.pxPerNode;
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

    private drawNormals(): void {
        this.context.strokeStyle = "#FFFFFF";
        this.context.lineWidth = 1;

        let originX = Math.round(this.width / 3 + this.width / 10);
        let originY = Math.round(this.height / 2);
        let origin: Vector = { x: originX, y: originY };

        let simulationScale = this.pxPerNode;
        for (let i = 0; i < this.airfoilGridPoints.length; i++) {
            let currentVector = addVectors(this.airfoilGridPoints[i], origin);
            let test = scaleVector(getSurfaceNormal(this.airfoilGridPoints[i], this.airfoilGridPoints), 12);

            let imageVector = this.gridPosToImagePos(currentVector);
            let imageTest = this.gridPosToImagePos(addVectors(test, currentVector));
            //console.log(`${this.airfoilGridPoints[i].x},${this.airfoilGridPoints[i].y} -> NORMAL: ${test.x},${test.y}`);
            //console.log(currentVector);
            //console.log(imageVector);

            this.context.beginPath();
            this.context.moveTo((imageVector.x) * simulationScale, (imageVector.y) * simulationScale);
            this.context.lineTo((imageTest.x) * simulationScale, (imageTest.y) * simulationScale);
            //this.context.lineTo(test.x * simulationScale, test.y * simulationScale);
            this.context.stroke();
            this.context.closePath();
        }
    }

    private drawTracers(): void {
        let simulationScale = this.pxPerNode;
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
                    this.properties.solid[this.index(x, y)] = true;
                } else {
                    this.properties.solid[this.index(x, y)] = false;
                }
            }
        }
    }
    */

    private setupObstacle(): void {
        //Reset solid
        this.properties.solid = new Array(this.numCells).fill(false);
        //let originX = Math.round(this.width / 3 + this.width / 10);
        //let originY = Math.round(this.height / 2);

        for (let i = 0; i < this.airfoilGridPoints.length; i++) {
            let point = this.airfoilGridPoints[i];
            let index = this.index(this.origin.x + point.x, this.origin.y + point.y);
            this.properties.solid[index] = true;
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