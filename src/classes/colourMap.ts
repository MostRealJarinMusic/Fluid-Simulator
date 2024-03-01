class ColourMap {
    private numColours: number;
    private colourMap: Colour[];
    private bounds: Bound;

    constructor(targetColours: Colour[], steps: number[]) {
        this.numColours = steps.reduce((acc, val) => acc + val);
        this.colourMap = new Array(this.numColours);
        this.bounds = { lower: 0, upper: this.numColours - 1 };
        this.colourMap = this.createFullTransition(targetColours, steps);
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
