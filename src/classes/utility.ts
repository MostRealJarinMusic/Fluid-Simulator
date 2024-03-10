/*
    Utility functions and some declarations for types and enums
*/

//#region Types
type Vector = { x: number; y: number; }
type GraphDataset = { points: Vector[], label: string; colour: string; }
type Bound = { lower: number, upper: number };
type ParameterInfo = { name: string; labelText: string; defaultValue: number; bounds: Bound; }
type Colour = { red: number, green: number, blue: number, alpha: number };
type DistributionDir = keyof Fluid;
type SurfaceNormal = { position: Vector, normal: Vector };
type TaggedPosition = { position: Vector, tag: PositionTag };
type FluidProperties = {
    localDensity: number[],
    localVelocity: Vector[],
    localPressure: number[],
    pressureGradient: Vector[],
    localCurl: number[],
    solid: boolean[]
};
type LabelledElement = { element: HTMLElement, label: string, units?: string };

const validSimulationModes = ['velocity', 'density', 'curl', 'pressure', 'pressureGradient'] as const;
type SimulationMode = typeof validSimulationModes[number];
const validPositionTags = ['upperSurface', 'lowerSurface', 'default'] as const;
type PositionTag = typeof validPositionTags[number];
const validShapeTypes = ['ellipse', 'line', 'rectangle', 'airfoil'] as const;
type ShapeType = typeof validShapeTypes[number];
//#endregion

//#region Type Guards
/**
 * Type guard for a valid simulation mode
 * @param testMode The mode to be tested
 */
function isSimulationMode(testMode: unknown): testMode is SimulationMode {
    // @ts-expect-error
    return typeof testMode === 'string' && validSimulationModes.includes(testMode);
}

/**
 * Type guard for a valid tag
 * @param testTag The tag to be tested
 */
function isPositionTag(testTag: unknown): testTag is PositionTag {
    //@ts-expect-error
    return typeof testTag === 'string' && validPositionTags.includes(testTag);
}

/**
 * Type guard for valid type
 * @param testType The type to be tested
 */
function isAirfoilType(testType: unknown): testType is ShapeType {
    //@ts-expect-error
    return typeof testType === 'string' && validShapeTypes.includes(testType);
}
//#endregion

//#region Enums
enum Directions {
    Centre = 0,
    North,
    NorthEast,
    East,
    SouthEast,
    South,
    SouthWest,
    West,
    NorthWest
}
//#endregion

//#region General functions
/**
 * Maps the GraphDataset type to the Chart.ChartDataSets type
 * @param datasets The datasets to be mapped
 */
function mapDatasets(datasets: GraphDataset[]): Chart.ChartDataSets[] {
    return datasets.map(dataset => ({
        label: dataset.label,
        data: dataset.points,
        pointRadius: 0.5,
        hoverRadius: 0.5,
        showLine: false,
        backgroundColor: dataset.colour,
        borderColor: dataset.colour,
        borderWidth: 2,
        pointStyle: 'circle',
    }));
}

/**
 * Takes 'blueprints' of parameters and creates a record of them
 * @param setupInformation 
 */
function setupParameters(setupInformation: Record<string, ParameterInfo>): Record<string, number> {
    let temp: Record<string, number> = {};
    for (const [parameterName, parameterInfo] of Object.entries(setupInformation)) {
        temp[parameterName] = parameterInfo.defaultValue;
    }
    return temp;
}

/**
 * Takes any value and 'bounds' it - returning either the value itself, or the closest bound.
 * @param value The value to be 'bounded'
 * @param bounds The bounds
 */
function enforceBounds(value: number, bounds: Bound): number {
    return Math.max(Math.min(value, bounds.upper), bounds.lower);
}

/**
 * Returns a colour, from given RGBA values
 * @param r Red value
 * @param g Green value
 * @param b Blue value
 * @param a Alpha value
 */
function getColour(r: number, g: number, b: number, a: number): Colour {
    let colourBound = { lower: 0, upper: 255 }
    return {
        red: enforceBounds(r, colourBound),
        green: enforceBounds(g, colourBound),
        blue: enforceBounds(b, colourBound),
        alpha: enforceBounds(a, colourBound)
    };
}

function getIndex(i: number, j: number, width: number): number {
    return (width * j) + i;
}

function untagPositions(taggedPositions: TaggedPosition[]): Vector[] {
    return taggedPositions.map((value) => value.position);
}

function writeToElement(labelledElement: LabelledElement, value: number | string): void {
    let units = labelledElement.units !== undefined ? labelledElement.units : ""
    labelledElement.element.innerHTML = labelledElement.label + value + " " + units;
}
//#endregion

//#region Vector functions
function addVectors(vector1: Vector, vector2: Vector): Vector {
    return { x: vector1.x + vector2.x, y: vector1.y + vector2.y };
}

function subVectors(vector1: Vector, vector2: Vector): Vector {
    return { x: vector1.x - vector2.x, y: vector1.y - vector2.y };
}

function scaleVector(vector1: Vector, scalar: number): Vector {
    return { x: vector1.x * scalar, y: vector1.y * scalar };
}

/**
 * Rotates a vector by a given angle theta, by multiply the vector by a rotation matrix (as Cartesian equations)
 * @param vector The vector to be rotated
 * @param theta The angle the vector is to be rotated by
 */
function rotateVector(vector: Vector, theta: number): Vector {
    let x = vector.x;
    let y = vector.y;
    return {
        x: x * Math.cos(theta) - y * Math.sin(theta),
        y: x * Math.sin(theta) + y * Math.cos(theta)
    }
}

/**
 * Rotates a vector by a given angle theta, around a given point
 * @param vector The vector to be rotated
 * @param theta The angle of rotation
 * @param point The origin of rotation
 */
function rotateVectorAroundPoint(vector: Vector, theta: number, point: Vector): Vector {
    return addVectors(rotateVector(subVectors(vector, point), theta), point);
}

function dotVectors(vector1: Vector, vector2: Vector): number {
    return (vector1.x * vector2.x) + (vector1.y * vector2.y);
}

/**
 * Cross product - note that the cross product is not well defined in 3D
 * This returns the magnitude of the 3D cross product
 */
function crossVectors(vector1: Vector, vector2: Vector): number {
    return (vector1.x * vector2.y) - (vector1.y * vector2.x);
}

function absoluteVector(vector: Vector): number {
    return Math.sqrt(vector.x ** 2 + vector.y ** 2);
}

function normaliseVector(vector: Vector): Vector {
    return scaleVector(vector, 1 / absoluteVector(vector));
}

/**
 * Rounds both components of the vector
 * @param vector The vector that is to be 'rounded'
 */
function roundVector(vector: Vector): Vector {
    return { x: Math.round(vector.x), y: Math.round(vector.y) };
}

/**
 * Filters an array of vectors for either the largest or smallest component.
 * @param vectors - The vector array to be filtered.
 * @param component - The component which all vectors will be compared with.
 * @param comparison - Specifies the aim of the filter.
 */
function filterVectors(vectors: Vector[], component: 'x' | 'y', comparison: 'least' | 'most'): number {
    if (comparison === 'least') {
        return vectors.reduce((accumulator, currentValue) => {
            return (accumulator[component] < currentValue[component] ? accumulator : currentValue)
        })[component];
    } else {
        return vectors.reduce((accumulator, currentValue) => {
            return (accumulator[component] > currentValue[component] ? accumulator : currentValue)
        })[component];
    }
}

/**
 * Checks if a given vector is contained within a list
 * @param currentList The list to search through
 * @param testVector The vector to search for
 */
function checkInVectorList(currentList: Vector[], testVector: Vector): boolean {
    for (let i = 0; i < currentList.length; i++) {
        let currentVector = currentList[i];
        if (testVector.x == currentVector.x && testVector.y == currentVector.y) {
            return true;
        }
    }
    return false;
}
//#endregion
