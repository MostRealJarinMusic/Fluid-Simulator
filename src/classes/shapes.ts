

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
        'xRadius': { name: 'xRadius', labelText: 'X Radius', defaultValue: 0.1, bounds: [0.05, 0.25] },
        'yRadius': { name: 'yRadius', labelText: 'Y Radius', defaultValue: 0.1, bounds: [0.05, 0.25] }
    };

    constructor() {
        super();
        this.params = setupParameters(this.parameterInfo);
        //console.log(this.params);
        this.updateGridPoints();
    }

    override get Area(): number {
        return 1;
    }

    override updateParameters(newParameters: Record<string, number>): void {
        this.params['xRadius'] = newParameters['xRadius'];
        this.params['yRadius'] = newParameters['yRadius'];

        this.updateGridPoints();
    }

    override updateGridPoints(): void {
        let scaleFactor = 60;
        let xRadius = Math.round(this.params.xRadius * scaleFactor);
        let yRadius = Math.round(this.params.yRadius * scaleFactor);
        let tempGridPoints: Vector[] = [];

        for (let theta = 0; theta <= 2 * Math.PI; theta += 0.01) {
            tempGridPoints.push({
                x: Math.round(xRadius * Math.cos(theta)),
                y: Math.round(yRadius * Math.sin(theta)),
            })
        }

        tempGridPoints = getFullShape(tempGridPoints);

        this.gridPoints = tempGridPoints;


        //throw new Error("Method not implemented.");
    }

}

class Rectangle extends Shape {
    override parameterInfo: Record<string, ShapeParameterInfo> = {
        'width': { name: 'width', labelText: 'Width', defaultValue: 0.5, bounds: [0.05, 0.75] },
        'height': { name: 'height', labelText: 'Height', defaultValue: 0.2, bounds: [0.05, 0.3] }
    }

    constructor() {
        super();
        this.params = setupParameters(this.parameterInfo);

        this.updateGridPoints();
    }

    override get Area(): number {
        return this.params['width'] * this.params['height'];
    }

    override updateParameters(newParameters: Record<string, number>): void {
        this.params['width'] = newParameters['width'];
        this.params['height'] = newParameters['height'];

        this.updateGridPoints();
    }

    override updateGridPoints(): void {
        let scaleFactor = 60;
        let width = Math.round(this.params.width * scaleFactor);
        let height = Math.round(this.params.height * scaleFactor);
        let tempGridPoints: Vector[] = [];

        for (let x = 0; x <= width; x++) {
            for (let y = 0; y <= height; y++) {
                tempGridPoints.push({
                    x: Math.round(x - width / 2), y: Math.round(y - height / 2)
                })
            }
        }

        this.gridPoints = tempGridPoints;

        //throw new Error("Method not implemented.");
    }
}

class Line extends Shape {
    override parameterInfo: Record<string, ShapeParameterInfo> = {
        'lineLength': { name: 'lineLength', labelText: 'Length', defaultValue: 0.3, bounds: [0.1, 0.5] }
    }
    constructor() {
        super();
        this.params = setupParameters(this.parameterInfo);
        this.updateGridPoints();
    }

    override get Area(): number {
        return 1;
    }

    override updateParameters(newParameters: Record<string, number>): void {
        this.params['lineLength'] = newParameters['lineLength'];
        this.updateGridPoints();
    }

    override updateGridPoints(): void {
        let scaleFactor = 60;
        let pixelLength = Math.round(this.params.lineLength * scaleFactor);
        let tempGridPoints: Vector[] = [];

        for (let x = 0; x <= 1; x++) {
            for (let y = 0; y < pixelLength; y++) {
                tempGridPoints.push({
                    x: x, y: Math.round(y - pixelLength / 2)
                })
            }
        }

        this.gridPoints = tempGridPoints;
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
            airfoilUpper.push(this.getUpperPoint(sampleX));

            //Lower surface point
            airfoilLower.push(this.getLowerPoint(sampleX));

            //Mean line of camber
            meanCamberLine.push({
                x: sampleX,
                y: this.calculateMeanCamber(sampleX)
            });
        }

        let airfoilUpperDataset: GraphDataset = { label: "Upper Airfoil Surface", points: airfoilUpper, colour: 'rgba(80, 250, 123,1)' };
        let airfoilLowerDataset: GraphDataset = { label: "Lower Airfoil Surface", points: airfoilLower, colour: 'rgba(255, 184, 108,1)' };
        let meanCamberLineDataset: GraphDataset = { label: "Mean Camber Line", points: meanCamberLine, colour: 'rgba(255, 121, 198,1)' };

        this.graphDatasets = [airfoilUpperDataset, airfoilLowerDataset, meanCamberLineDataset];
    }


    override updateGridPoints(): void {
        this.gridPoints = [];
        let tempGridPoints: Vector[] = [];
        //Magic number here - 
        let scaleFactor = 60;   //Chord length - this can be used for scaling the airfoil 
        let translation: Vector = { x: -Math.round(scaleFactor / 2), y: 0 };

        //Outline
        for (let beta = 0; beta <= Math.PI; beta += 0.01) {
            let sampleX = (1 - Math.cos(beta)) / 2;
            let testLower: Vector = roundVector(addVectors(scaleVector(this.getLowerPoint(sampleX), scaleFactor), translation));
            let testUpper: Vector = roundVector(addVectors(scaleVector(this.getUpperPoint(sampleX), scaleFactor), translation));

            if (!checkInVectorList(tempGridPoints, testLower)) {
                tempGridPoints.push(testLower);
            }
            if (!checkInVectorList(tempGridPoints, testUpper)) {
                tempGridPoints.push(testUpper);
            }
        }

        tempGridPoints = getFullShape(tempGridPoints);
        //tempGridPoints.sort((vector1, vector2) => vector1.x - vector2.x);
        //console.log(tempGridPoints);

        this.gridPoints = tempGridPoints;
    }

    //#region Airfoil geometry functions

    private getUpperPoint(xValue: number): Vector {
        return {
            x: xValue - (this.calculateHalfThickness(xValue) * Math.sin(this.calculateTheta(xValue))),
            y: this.calculateMeanCamber(xValue) + (this.calculateHalfThickness(xValue) * Math.cos(this.calculateTheta(xValue)))
        }
    }

    private getLowerPoint(xValue: number): Vector {
        return {
            x: xValue + (this.calculateHalfThickness(xValue) * Math.sin(this.calculateTheta(xValue))),
            y: this.calculateMeanCamber(xValue) - (this.calculateHalfThickness(xValue) * Math.cos(this.calculateTheta(xValue)))
        }
    }

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