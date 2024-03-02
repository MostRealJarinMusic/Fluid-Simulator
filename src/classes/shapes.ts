//#region Shape parent class
abstract class Shape {
    protected outline: TaggedPosition[];
    protected graphDatasets: GraphDataset[];
    protected parameters: Record<string, number>;
    protected abstract parameterInfo: Record<string, ParameterInfo>;

    constructor() {
        this.outline = [];
        this.graphDatasets = []
        this.parameters = {};
    }

    /**
     * Takes a set of parameters and sets them to the shape's parameters.
     * Shapes can also enforce restrictions on the given parameters
     * @param newParameters The new parameters for the shape
     */
    public abstract updateParameters(newParameters: Record<string, number>): void;
    /**
     * Updates the set of position vectors representing the shape
     */
    protected abstract updateOutline(): void;
    /**
     * Returns the approximate area of the shape - implemented differently from shape to shape
     */
    public abstract get Area(): number;
    abstract get Type(): ShapeType;

    //#region Getters
    get ParameterInfo(): Record<string, ParameterInfo> {
        return this.parameterInfo;
    }

    get Parameters(): Record<string, number> {
        return this.parameters;
    }

    get Outline(): TaggedPosition[] {
        return this.outline;
    }

    get GraphDatasets(): GraphDataset[] {
        return this.graphDatasets;
    }
    //#endregion
}
//#endregion

//Shapes
class Ellipse extends Shape {
    override parameterInfo: Record<string, ParameterInfo> = {
        'xRadius': { name: 'xRadius', labelText: 'X Radius', defaultValue: 0.1, bounds: { lower: 0.05, upper: 0.25 } },
        'yRadius': { name: 'yRadius', labelText: 'Y Radius', defaultValue: 0.1, bounds: { lower: 0.05, upper: 0.25 } }
    };

    constructor() {
        super();
        this.parameters = setupParameters(this.parameterInfo);
        this.updateOutline();
    }

    override get Area(): number {
        let xRadius = this.parameters.xRadius;
        let yRadius = this.parameters.yRadius;

        return Math.PI * (xRadius * yRadius);
    }

    override get Type(): ShapeType {
        return 'ellipse';
    }

    override updateParameters(newParameters: Record<string, number>): void {
        this.parameters['xRadius'] = newParameters['xRadius'];
        this.parameters['yRadius'] = newParameters['yRadius'];

        this.updateOutline();
    }

    override updateOutline(): void {
        let scaleFactor = nodesPerMeter;
        let xRadius = Math.round(this.parameters.xRadius * scaleFactor);
        let yRadius = Math.round(this.parameters.yRadius * scaleFactor);
        let tempOutline: Vector[] = [];

        for (let theta = 0; theta <= 2 * Math.PI; theta += 0.005) {
            tempOutline.push({
                x: xRadius * Math.cos(theta),
                y: yRadius * Math.sin(theta),
            })
        }
        this.outline = tempOutline.map((value) => {
            return { position: value, tag: 'default' }
        });
    }
}

class Rectangle extends Shape {
    override parameterInfo: Record<string, ParameterInfo> = {
        'width': { name: 'width', labelText: 'Width', defaultValue: 0.5, bounds: { lower: 0.05, upper: 0.75 } },
        'height': { name: 'height', labelText: 'Height', defaultValue: 0.2, bounds: { lower: 0.05, upper: 0.3 } }
    }

    constructor() {
        super();
        this.parameters = setupParameters(this.parameterInfo);
        this.updateOutline();
    }

    override get Area(): number {
        return this.parameters['width'] * this.parameters['height'];
    }

    override get Type(): ShapeType {
        return 'rectangle';
    }

    override updateParameters(newParameters: Record<string, number>): void {
        this.parameters['width'] = newParameters['width'];
        this.parameters['height'] = newParameters['height'];

        this.updateOutline();
    }

    override updateOutline(): void {
        let scaleFactor = nodesPerMeter;
        let width = Math.round(this.parameters.width * scaleFactor);
        let height = Math.round(this.parameters.height * scaleFactor);
        let tempOutline: Vector[] = [];

        for (let x = 0; x < width; x += 0.05) {
            tempOutline.push({ x: x - width / 2, y: -height / 2 })
            tempOutline.push({ x: x - width / 2, y: height / 2 })
        }

        for (let y = 0; y < height; y += 0.05) {
            tempOutline.push({ x: -width / 2, y: y - height / 2 })
            tempOutline.push({ x: width / 2, y: y - height / 2 })
        }

        this.outline = tempOutline.map((value) => {
            return { position: value, tag: 'default' }
        });
    }
}

class Line extends Shape {
    override parameterInfo: Record<string, ParameterInfo> = {
        'lineLength': { name: 'lineLength', labelText: 'Length', defaultValue: 0.3, bounds: { lower: 0.1, upper: 0.5 } }
    }
    constructor() {
        super();
        this.parameters = setupParameters(this.parameterInfo);
        this.updateOutline();
    }

    override get Area(): number {
        return (nodeDistance) * this.parameters.lineLength;
    }

    override get Type(): ShapeType {
        return 'line';
    }

    override updateParameters(newParameters: Record<string, number>): void {
        this.parameters['lineLength'] = newParameters['lineLength'];
        this.updateOutline();
    }

    override updateOutline(): void {
        let scaleFactor = nodesPerMeter;
        let pixelLength = Math.round(this.parameters.lineLength * scaleFactor);
        let tempOutline: Vector[] = [];

        for (let x = 0; x <= 1; x += 0.25) {
            for (let y = 0; y < pixelLength; y += 0.01) {
                tempOutline.push({
                    x: 0, y: y - pixelLength / 2
                })
            }
        }

        this.outline = tempOutline.map((value) => {
            return { position: value, tag: 'default' }
        });
    }
}

class Airfoil extends Shape {
    override parameterInfo: Record<string, ParameterInfo> = {
        'm': { name: 'm', labelText: 'Max. Camber (%)', defaultValue: 0, bounds: { lower: 0, upper: 9.5 } },
        'p': { name: 'p', labelText: 'Max. Camber Pos. (%)', defaultValue: 0, bounds: { lower: 0, upper: 90 } },
        't': { name: 't', labelText: 'Thickness', defaultValue: 12, bounds: { lower: 1, upper: 40 } }
    }

    constructor() {
        super();
        this.parameters = setupParameters(this.parameterInfo);

        this.updateGraphDatasets();
        this.updateOutline();
    }

    override get Area(): number {
        //Simpson's rule for the area of an airfoil - numerical integration
        let totalArea = 0;
        let samples = 100;
        let spacing = 1 / samples;

        for (let i = 0; i <= samples; i += 1) {
            let sampleX = i / samples;
            let upperPoint = this.getUpperPoint(sampleX);
            let lowerPoint = this.getLowerPoint(sampleX);

            if (i === 0 || i === samples) {
                totalArea += upperPoint.y - lowerPoint.y;
            } else if (i % 2 === 0) {
                totalArea += 4 * (upperPoint.y - lowerPoint.y);
            } else {
                totalArea += 2 * (upperPoint.y - lowerPoint.y);
            }
        }

        totalArea *= (spacing / 3);
        return totalArea;
    }

    override get Type(): ShapeType {
        return 'airfoil';
    }

    override updateParameters(newParameters: Record<string, number>): void {
        let testM = newParameters['m'];
        let testP = newParameters['p'];
        let testT = newParameters['t'];

        if (testM === 0) testP = 0;
        if (testM > 0 && (testP >= 0 && testP < 10)) testP = 10;
        if (testT > 30 && testT < 40) testT = 30;

        this.parameters['m'] = testM;
        this.parameters['p'] = testP;
        this.parameters['t'] = testT;

        this.updateGraphDatasets();
        this.updateOutline();
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


    override updateOutline(): void {
        this.outline = [];
        let tempOutline: TaggedPosition[] = [];
        let scaleFactor = nodesPerMeter;
        let translation: Vector = { x: -Math.round(scaleFactor / 2), y: 0 };

        //Outline
        for (let beta = 0; beta <= Math.PI; beta += 0.01) {
            let sampleX = (1 - Math.cos(beta)) / 2;
            let testLower: Vector = (addVectors(scaleVector(this.getLowerPoint(sampleX), scaleFactor), translation));
            let testUpper: Vector = (addVectors(scaleVector(this.getUpperPoint(sampleX), scaleFactor), translation));

            tempOutline.push({ position: testLower, tag: 'lowerSurface' });
            tempOutline.push({ position: testUpper, tag: 'upperSurface' });
        }
        this.outline = tempOutline;
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
        let t = this.parameters['t'] / 100;

        let tempSum = (0.2969 * Math.pow(x, 0.5)) - (0.1260 * x) - (0.3516 * Math.pow(x, 2)) + (0.2843 * Math.pow(x, 3)) - (0.1036 * Math.pow(x, 4));
        return (5 * t * tempSum);
    }

    //Calculates the mean line of camber for any given x
    private calculateMeanCamber(x: number): number {
        let m = this.parameters['m'] / 100;
        let p = this.parameters['p'] / 100;
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
        let m = this.parameters['m'] / 100;
        let p = this.parameters['p'] / 100;
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