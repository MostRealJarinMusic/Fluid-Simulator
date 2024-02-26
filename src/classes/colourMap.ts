
//Credit???
class ColourMap {
    private numColours: number;
    private colourMap: Colour[];

    constructor() {
        this.numColours = 400;
        this.colourMap = new Array(this.numColours + 2);

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

            this.colourMap[colourIndex] = { red: r, green: g, blue: b, alpha: 255 };
        }
    }

    //#region Getters
    get NumColours(): number {
        return this.numColours;
    }

    get Map(): Colour[] {
        return this.colourMap;
    }
    //#endregion
}
