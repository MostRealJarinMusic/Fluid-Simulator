//#region Types
type Vector = { x: number; y: number; }
type GridPoints = { gridPoints: Vector[]; }
type GraphDataset = { label: string; plotPoints: Vector[]; colour: string; }
type ShapeParameterInfo = { name: string; labelText: string; defaultValue: number; bounds: number[]; }
//#endregion

//#region Shape parent class

abstract class Shape {
    protected gridPoints: Vector[] = [];
    protected graphDatasets: GraphDataset[] = [];
    protected params: Record<string, number> = {};

    abstract parameterInfo: Record<string, ShapeParameterInfo>;


    abstract updateParameters(newParameters: Record<string, number>): void;
    abstract updateGridPoints(): void;
    abstract get Area(): number;

    //#region Getters
    get ParameterInfo(): Record<string, ShapeParameterInfo> {
        return this.parameterInfo;
    }

    get Parameters(): Record<string, number> {
        return this.params;
    }

    get GridPoints(): Vector[] {
        return this.gridPoints;
    }

    get GraphDatasets(): GraphDataset[] {
        return this.graphDatasets;
    }
    //#endregion
}

//#endregion

//Shapes

class Ellipse extends Shape {
    override parameterInfo: Record<string, ShapeParameterInfo> = {
        'xRadius': { name: 'xRadius', labelText: 'X Radius', defaultValue: 5, bounds: [1, 10] },
        'yRadius': { name: 'yRadius', labelText: 'Y Radius', defaultValue: 5, bounds: [1, 10] }
    };

    constructor() {
        super();
        this.params = setupParameters(this.parameterInfo);
        //console.log(this.params);
    }

    override get Area(): number {
        return 1;
    }

    override updateParameters(newParameters: Record<string, number>): void {
        this.params['xRadius'] = newParameters['xRadius'];
        this.params['yRadius'] = newParameters['yRadius'];
    }

    override updateGridPoints(): void {
        throw new Error("Method not implemented.");
    }

}

class Rectangle extends Shape {
    override parameterInfo: Record<string, ShapeParameterInfo> = {
        'width': { name: 'width', labelText: 'Width', defaultValue: 5, bounds: [1, 10] },
        'height': { name: 'height', labelText: 'Height', defaultValue: 5, bounds: [1, 10] }
    }

    constructor() {
        super();
        this.params = setupParameters(this.parameterInfo);
    }

    override get Area(): number {
        return this.params['width'] * this.params['height'];
    }

    override updateParameters(newParameters: Record<string, number>): void {
        this.params['width'] = newParameters['width'];
        this.params['height'] = newParameters['height'];
    }

    override updateGridPoints(): void {
        throw new Error("Method not implemented.");
    }
}

class Line extends Shape {
    override parameterInfo: Record<string, ShapeParameterInfo> = {
        'lineLength': { name: 'lineLength', labelText: 'Length', defaultValue: 5, bounds: [1, 10] }
    }
    constructor() {
        super();
        this.params = setupParameters(this.parameterInfo)
    }

    override get Area(): number {
        return 1;
    }
    override updateParameters(newParameters: Record<string, number>): void {
        this.params['lineLength'] = newParameters['lineLength'];
    }

    override updateGridPoints(): void {
        throw new Error("Method not implemented.");
    }
}

class Airfoil extends Shape {
    override parameterInfo: Record<string, ShapeParameterInfo> = {
        'm': { name: 'm', labelText: 'Max. Camber (%)', defaultValue: 0, bounds: [0, 9.5] },
        'p': { name: 'p', labelText: 'Max. Camber Pos. (%)', defaultValue: 0, bounds: [0, 90] },
        't': { name: 't', labelText: 'Thickness', defaultValue: 12, bounds: [1, 40] }
    }

    constructor() {
        super();
        this.params = setupParameters(this.parameterInfo);
        this.updateGraphDatasets();

        this.updateGridPoints();
    }

    override get Area(): number {
        return 1;   //Simpson's Rule?
    }

    override updateParameters(newParameters: Record<string, number>): void {
        let testM = newParameters['m'];
        let testP = newParameters['p'];
        let testT = newParameters['t'];

        if (testM === 0) testP = 0;
        if (testM > 0 && (testP >= 0 && testP < 10)) testP = 10;
        if (testT > 30 && testT < 40) testT = 30;

        this.params['m'] = testM;
        this.params['p'] = testP;
        this.params['t'] = testT;

        this.updateGraphDatasets();
        this.updateGridPoints();
    }

    private updateGraphDatasets(): void {
        let airfoilUpper = [];
        let airfoilLower = [];
        let meanCamberLine = [];

        //Slight modification for sampling points evenly using cosine
        //Credit: http://airfoiltools.com/airfoil/naca4digit?MNaca4DigitForm%5Bcamber%5D=9&MNaca4DigitForm%5Bposition%5D=40&MNaca4DigitForm%5Bthick%5D=14&MNaca4DigitForm%5BnumPoints%5D=81&MNaca4DigitForm%5BcosSpace%5D=0&MNaca4DigitForm%5BcosSpace%5D=1&MNaca4DigitForm%5BcloseTe%5D=0&MNaca4DigitForm%5BcloseTe%5D=1&yt0=Plot
        for (let beta = 0; beta <= Math.PI; beta += 0.01) { //Can control the fineness of sampling
            let sampleX = (1 - Math.cos(beta)) / 2;
            //Upper surface point
            airfoilUpper.push({
                x: sampleX - (this.calculateHalfThickness(sampleX) * Math.sin(this.calculateTheta(sampleX))),
                y: this.calculateMeanCamber(sampleX) + (this.calculateHalfThickness(sampleX) * Math.cos(this.calculateTheta(sampleX)))
            });

            //Lower surface point
            airfoilLower.push({
                x: sampleX + (this.calculateHalfThickness(sampleX) * Math.sin(this.calculateTheta(sampleX))),
                y: this.calculateMeanCamber(sampleX) - (this.calculateHalfThickness(sampleX) * Math.cos(this.calculateTheta(sampleX)))
            });

            //Mean line of camber
            meanCamberLine.push({
                x: sampleX,
                y: this.calculateMeanCamber(sampleX)
            });
        }

        let airfoilUpperDataset: GraphDataset = { label: "Upper Airfoil Surface", plotPoints: airfoilUpper, colour: 'rgba(80, 250, 123,1)' };
        let airfoilLowerDataset: GraphDataset = { label: "Lower Airfoil Surface", plotPoints: airfoilLower, colour: 'rgba(255, 184, 108,1)' };
        let meanCamberLineDataset: GraphDataset = { label: "Mean Camber Line", plotPoints: meanCamberLine, colour: 'rgba(255, 121, 198,1)' };

        this.graphDatasets = [airfoilUpperDataset, airfoilLowerDataset, meanCamberLineDataset];
    }

    override updateGridPoints(): void {
        this.gridPoints = [];
        let tempGridPoints: Vector[] = [];
        let scaleFactor = 60;   //Chord length - this can be used for scaling the airfoil 
        let xOffset = scaleFactor / 2;

        //Outline
        for (let beta = 0; beta <= Math.PI; beta += 0.01) {
            let sampleX = (1 - Math.cos(beta)) / 2;

            let upperX: number = sampleX - (this.calculateHalfThickness(sampleX) * Math.sin(this.calculateTheta(sampleX)));
            let upperY: number = this.calculateMeanCamber(sampleX) + (this.calculateHalfThickness(sampleX) * Math.cos(this.calculateTheta(sampleX)));
            let lowerX: number = sampleX + (this.calculateHalfThickness(sampleX) * Math.sin(this.calculateTheta(sampleX)));
            let lowerY: number = this.calculateMeanCamber(sampleX) - (this.calculateHalfThickness(sampleX) * Math.cos(this.calculateTheta(sampleX)));

            let testLower: Vector = { x: Math.round((upperX * scaleFactor) - xOffset), y: Math.round(upperY * scaleFactor) };
            let testUpper: Vector = { x: Math.round((lowerX * scaleFactor) - xOffset), y: Math.round(lowerY * scaleFactor) };

            if (!checkInVectorList(tempGridPoints, testLower)) {
                tempGridPoints.push(testLower);
            }
            if (!checkInVectorList(tempGridPoints, testUpper)) {
                tempGridPoints.push(testUpper);
            }
        }

        tempGridPoints = getFullShape(-xOffset - 5, scaleFactor - xOffset + 5, tempGridPoints);
        /*
        for (let testX = -xOffset - 5; testX < scaleFactor - xOffset + 5; testX++) {
            let sameXVectors = tempGridPoints.filter((vector) => vector.x === testX);
            if (sameXVectors.length > 0) {
                let smallestY = sameXVectors.reduce((accumulator, currentValue) => {
                    return (accumulator.y < currentValue.y ? accumulator : currentValue);
                }).y;
                let largestY = sameXVectors.reduce((accumulator, currentValue) => {
                    return (accumulator.y > currentValue.y ? accumulator : currentValue);
                }).y;
                //console.log(testX);
                //console.log("SMALLEST: " + smallestY);
                //console.log("LARGEST: " + largestY);
                //console.log(sameXVectors);

                for (let testY = smallestY + 1; testY < largestY; testY++) {
                    let testVector: Vector = { x: testX, y: testY };
                    if (!checkInVectorList(tempGridPoints, testVector)) {
                        tempGridPoints.push(testVector);
                    }
                }
            }
        }
        */
        tempGridPoints.sort((vector1, vector2) => vector1.x - vector2.x);
        //console.log(tempGridPoints);

        this.gridPoints = tempGridPoints;
    }

    //#region Airfoil geometry functions

    //General equation for half-thickness at any given x
    private calculateHalfThickness(x: number): number {
        let t = this.params['t'] / 100;

        let tempSum = (0.2969 * Math.pow(x, 0.5)) - (0.1260 * x) - (0.3516 * Math.pow(x, 2)) + (0.2843 * Math.pow(x, 3)) - (0.1036 * Math.pow(x, 4));
        return (5 * t * tempSum);
    }

    //Calculates the mean line of camber for any given x
    private calculateMeanCamber(x: number): number {
        let m = this.params['m'] / 100;
        let p = this.params['p'] / 100;
        let final = 0;

        if (0 <= x && x < p) {
            final = (m / Math.pow(p, 2)) * ((2 * p * x) - Math.pow(x, 2));
        }
        else if (p <= x && x <= 1) {
            final = (m / Math.pow((1 - p), 2)) * ((1 - (2 * p)) + (2 * p * x) - Math.pow(x, 2));
        }
        return final;
    }

    private calculateCamberDerivative(x: number): number {
        let m = this.params['m'] / 100;
        let p = this.params['p'] / 100;
        let final = 0;

        if (0 <= x && x < p) {
            final = ((2 * m) / Math.pow(p, 2)) * (p - x);
        }
        else if (p <= x && x <= 1) {
            final = ((2 * m) / Math.pow((1 - p), 2)) * (p - x);
        }
        return final;
    }

    private calculateTheta(x: number): number {
        return Math.atan(this.calculateCamberDerivative(x));
    }



    //#endregion
}