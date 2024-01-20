class ColourMap {
    private numColours: number;
    private redList: number[];
    private greenList: number[];
    private blueList: number[];

    constructor() {
        this.numColours = 400;

        this.redList = new Array(this.numColours + 2).fill(0);
        this.greenList = new Array(this.numColours + 2).fill(0);
        this.blueList = new Array(this.numColours + 2).fill(0);

        this.generateColourMap();
    }

    private generateColourMap(): void {
        for (let colourIndex = 0; colourIndex <= this.numColours; colourIndex++) {
            let r, g, b;
            if (colourIndex < this.numColours / 8) {
                r = 0;
                g = 0;
                b = Math.round((255 * (colourIndex + this.numColours / 8)) / (this.numColours / 4));
            } else if (colourIndex < (3 * this.numColours) / 8) {
                r = 0;
                g = Math.round((255 * (colourIndex - this.numColours / 8)) / (this.numColours / 4));
                b = 255;
            } else if (colourIndex < (5 * this.numColours) / 8) {
                r = Math.round((255 * (colourIndex - (3 * this.numColours) / 8)) / (this.numColours / 4));
                g = 255;
                b = 255 - r;
            } else if (colourIndex < (7 * this.numColours) / 8) {
                r = 255;
                g = Math.round((255 * ((7 * this.numColours) / 8 - colourIndex)) / (this.numColours / 4));
                b = 0;
            } else {
                r = Math.round((255 * ((9 * this.numColours) / 8 - colourIndex)) / (this.numColours / 4));
                g = 0;
                b = 0;
            }
            this.redList[colourIndex] = r;
            this.greenList[colourIndex] = g;
            this.blueList[colourIndex] = b;
        }
    }

    //#region Getters
    get RedList(): number[] {
        return this.redList;
    }

    get GreenList(): number[] {
        return this.greenList;
    }

    get BlueList(): number[] {
        return this.blueList;
    }

    get NumColours(): number {
        return this.numColours;
    }
    //#endregion
}
