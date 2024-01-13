class Fluid {
    //#region Private variables
    private width: number;
    private height: number;
    private numCells: number;
    private density: number;
    private inVelocity: number;
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
    private localUXs: number[];
    private localUYs: number[];
    private solid: boolean[];

    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private image: ImageData;
    private colourMap: ColourMap;
    private pxPerNode: number;
    //#endregion

    constructor(width: number, height: number, density: number, inVelocity: number, timescale: number, canvas: HTMLCanvasElement) {
        //#region Basic variables
        this.width = width;
        this.height = height;
        this.numCells = this.width * this.height;
        this.density = density;
        this.inVelocity = inVelocity;
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
        this.localUXs = new Array(this.numCells).fill(0);
        this.localUYs = new Array(this.numCells).fill(0);

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
    }

    private index(i: number, j: number): number {
        return i * this.height + j;
    }

    public setupObstacle(): void {
        let radiusSqr = 5 ** 2;
        let obstacleX = this.width / 4;
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

    private distanceBetweenSqr(x1: number, y1: number, x2: number, y2: number): number {
        return (x2 - x1) ** 2 + (y2 - y1) ** 2;
    }

    public initFluid(): void {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                this.distribution[this.index(x, y)][3] = this.inVelocity; //INVELOCITY
            }
        }
        //console.log(this.distribution)

    }

    public runMainLoop(): void {
        this.stream();
        this.computeMoments();
        this.applyBoundaryConditions();
        this.computeEquilibrium();
        this.collideLocally();

        //console.log(this.distribution)
    }

    //#region Main loop functions
    private computeMoments(): void {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                //console.log(this.#distribution[this.index(x, y)]);

                //Functions
                const summation = (arr: number[]) => arr.reduce((acc, val) => acc + val, 0);
                const mapToLat = (arr: number[], lat: number[]) => arr.map((val, i) => val * lat[i]);

                let tempDistribution = this.distribution[this.index(x, y)];
                let tempDensity = summation(tempDistribution);

                this.localUXs[this.index(x, y)] =
                    summation(mapToLat(tempDistribution, this.latticeXs)) / tempDensity;

                this.localUYs[this.index(x, y)] =
                    summation(mapToLat(tempDistribution, this.latticeYs)) / tempDensity;

                this.localDensity[this.index(x, y)] = tempDensity;

                //console.log(`Density: ${tempDensity}`);
                //console.log(`UX: ${this.#localUXs[this.index(x, y)]}`);
                //console.log(`UY: ${this.#localUYs[this.index(x, y)]}`);
            }
        }
    }

    private applyBoundaryConditions(): void {
        for (var x = 0; x < this.width - 2; x++) {
            for (var y = 0; y < this.height - 2; y++) {
                if (this.solid[this.index(x, y)]) {
                    //Reflect fluid distribution
                    this.distribution[this.index(x, y)] = this.oppositeIndices.map(
                        (index) => this.distribution[this.index(x, y)][index],
                    );

                    //Set velocity to 0
                    this.localUXs[this.index(x, y)] = 0;
                    this.localUYs[this.index(x, y)] = 0;
                }
            }
        }
    }

    private computeEquilibrium(): void {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                for (var i in this.latticeIndices) {
                    let localDensity = this.localDensity[this.index(x, y)];
                    let localUX = this.localUXs[this.index(x, y)];
                    let localUY = this.localUYs[this.index(x, y)];
                    let weight = this.latticeWeights[i];
                    let latticeX = this.latticeXs[i];
                    let latticeY = this.latticeYs[i];

                    let latticeDotU = latticeX * localUX + latticeY * localUY; //Pre-calculations

                    this.equilibriumDistribution[this.index(x, y)][i] =
                        weight *
                        localDensity *
                        (1 +
                            3 * latticeDotU +
                            (9 / 2) * latticeDotU ** 2 -
                            (3 / 2) * (localUX ** 2 + localUY ** 2));
                }
            }
        }
    }

    private collideLocally(): void {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                for (var i in this.latticeIndices) {
                    this.distribution[this.index(x, y)][i] =
                        this.distribution[this.index(x, y)][i] -
                        (1 / this.timescale) *
                        (this.distribution[this.index(x, y)][i] -
                            this.equilibriumDistribution[this.index(x, y)][i]);
                }
            }
        }
    }

    private stream(): void {
        //NORTH WEST AND NORTH - INDEX 8 AND 1
        for (var y = this.height - 2; y > 0; y--) {
            for (var x = 1; x < this.width - 1; x++) {
                //NORTH-WEST
                this.distribution[this.index(x, y)][8] =
                    this.distribution[this.index(x + 1, y - 1)][8];
                //NORTH
                this.distribution[this.index(x, y)][1] =
                    this.distribution[this.index(x, y - 1)][1];
            }
        }

        //NORTH EAST AND EAST - INDEX 2 AND 3
        for (var y = this.height - 2; y > 0; y--) {
            for (var x = this.width - 2; x > 0; x--) {
                //NORTH EAST
                this.distribution[this.index(x, y)][2] =
                    this.distribution[this.index(x - 1, y - 1)][2];
                //EAST
                this.distribution[this.index(x, y)][3] =
                    this.distribution[this.index(x - 1, y)][3];
            }
        }

        //SOUTH EAST AND SOUTH - INDEX 4 AND 5
        for (var y = 1; y < this.height - 1; y++) {
            for (var x = this.width - 2; x > 0; x--) {
                //SOUTH EAST
                this.distribution[this.index(x, y)][4] =
                    this.distribution[this.index(x - 1, y + 1)][4];
                //SOUTH
                this.distribution[this.index(x, y)][5] =
                    this.distribution[this.index(x, y + 1)][5];
            }
        }

        //SOUTH WEST AND WEST
        for (var y = 1; y < this.height - 1; y++) {
            for (var x = 1; x < this.width - 1; x++) {
                //SOUTH WEST
                this.distribution[this.index(x, y)][6] =
                    this.distribution[this.index(x + 1, y + 1)][6];
                //WEST
                this.distribution[this.index(x, y)][7] =
                    this.distribution[this.index(x + 1, y)][7];
            }
        }
    }
    //#endregion

    //#region Drawing functions

    drawFluid() {
        for (var y = 1; y < this.height - 1; y++) {
            for (var x = 1; x < this.width - 1; x++) {
                let colour = [255, 255, 255, 255];
                let colourIndex = 0;
                let contrast = Math.pow(1.2, 0.1);

                if (this.solid[this.index(x, y)]) {
                    //Solid
                    colour = [40, 42, 54, 255];
                } else {
                    //Different colouring modes and different graphing modes
                    let velocityMagnitude = Math.sqrt(this.localUXs[this.index(x, y)] ** 2 + this.localUYs[this.index(x, y)] ** 2);
                    colourIndex = Math.round(this.colourMap.NumColours * (velocityMagnitude * 4 * contrast));
                    colour = [this.colourMap.RedList[colourIndex], this.colourMap.GreenList[colourIndex], this.colourMap.BlueList[colourIndex], 255];
                }

                let pxPerNd = this.pxPerNode
                let tempY = this.height - y - 1;
                for (var pixelY = tempY * pxPerNd; pixelY < (tempY + 1) * pxPerNd; pixelY++) {
                    for (var pixelX = x * pxPerNd; pixelX < (x + 1) * pxPerNd; pixelX++) {
                        let imageIndex = (pixelX + pixelY * this.image.width) * 4;
                        this.image.data[imageIndex] = colour[0];
                        this.image.data[imageIndex + 1] = colour[1];
                        this.image.data[imageIndex + 2] = colour[2];
                        this.image.data[imageIndex + 3] = 255;
                    }
                }
            }
        }

        this.context.putImageData(this.image, 0, 0);
    }

    //#endregion
}