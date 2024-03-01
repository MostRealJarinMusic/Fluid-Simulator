class ColourMap {
    private numColours: number;
    private colourMap: Colour[];
    private bounds: Bound;

    constructor() {
        let targetColours: Colour[] = [
            getColour(0, 0, 0, 255),
            getColour(255, 0, 0, 255),
            getColour(255, 255, 0, 255),
            getColour(255, 255, 255, 255)
        ];

        let steps: number[] = [200, 100, 100];

        this.numColours = steps.reduce((acc, val) => acc + val);
        this.colourMap = new Array(this.numColours);
        this.bounds = { lower: 0, upper: this.numColours - 1 };
        this.colourMap = this.createFullTransition(targetColours, steps);
    }

    /**
     * Generates a colour map
     * Credit: 
     */
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

    private createFullTransition(targetColours: Colour[], totalSteps: number[]): Colour[] {
        //Recursive algorithm
        if (targetColours.length - 1 === totalSteps.length) {
            //Requirement
            if (targetColours.length === 2) {
                //Base case
                return this.transitionBetweenColour(targetColours[0], targetColours[1], totalSteps[0]);
            } else {
                //General case
                let currentTransition: Colour[] = this.transitionBetweenColour(targetColours[0], targetColours[1], totalSteps[0]);

                let remainingColours: Colour[] = targetColours.slice(1);
                let remainingSteps: number[] = totalSteps.slice(1);
                //Recursive step - getting the remaining transitions
                let remainingTransition: Colour[] = this.createFullTransition(remainingColours, remainingSteps);

                return currentTransition.concat(remainingTransition);
            }
        } else {
            console.log("Error");
            return [];
        }
    }

    /**
     * Creates a transition between a start colour and end colour, between a set amount of steps
     * @param startColour Starting colour   
     * @param targetColour Ending colour
     * @param steps Number of colours between the start and target
     */
    private transitionBetweenColour(startColour: Colour, targetColour: Colour, steps: number): Colour[] {
        let gradient: Colour[] = [];
        for (let i = 0; i < steps; i++) {
            let percentage = i / steps;
            let newColour: Colour = {
                red: Math.round(startColour.red + (targetColour.red - startColour.red) * percentage),
                green: Math.round(startColour.green + (targetColour.green - startColour.green) * percentage),
                blue: Math.round(startColour.blue + (targetColour.blue - startColour.blue) * percentage),
                alpha: 255
            }
            gradient.push(newColour);
        }

        return gradient;
    }

    //#region Getters
    get NumColours(): number {
        return this.numColours;
    }

    get Map(): Colour[] {
        return this.colourMap;
    }
    get Bounds(): Bound {
        return this.bounds;
    }
    //#endregion
}
