/*
    Utility functions and some declarations for types and enums
*/

//#region Types
type Vector = { x: number; y: number; }
type GridPoints = { points: Vector[]; }
type GraphDataset = GridPoints & { label: string; colour: string; }
type Bound = { lower: number, upper: number };
type ParameterInfo = { name: string; labelText: string; defaultValue: number; bounds: Bound; }
type Colour = { red: number, green: number, blue: number, alpha: number };
type DistributionDir = keyof Fluid;
type SurfaceNormal = { position: Vector, normal: Vector };

const validSimulationModes = ['velocity', 'density', 'curl', 'pressure', 'pressureGradient'] as const;
type SimulationMode = typeof validSimulationModes[number];
const validResultGraphModes = ['surfacePressure', 'velocity'] as const;
type GraphingMode = typeof validResultGraphModes[number];
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
 * Type guard for a valid graphing mode
 * @param testMode The mode to be tested
 */
function isGraphingMode(testMode: unknown): testMode is GraphingMode {
    // @ts-expect-error
    return typeof testMode === 'string' && validResultGraphModes.includes(testMode);
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
enum OppositeDirections {
    Centre = 0,
    South,
    SouthWest,
    West,
    NorthWest,
    North,
    NorthEast,
    East,
    SouthEast
}

enum Orientation {
    CounterClockwise = -1,
    Colinear = 0,
    Clockwise = 1
}
//#endregion

/**
 * Takes any Direction from the Directions enum and returns the opposite Direction
 * @param direction The direction
 */
function getOppositeDirection(direction: Directions): Directions {
    let opposite: string = OppositeDirections[direction];
    //console.log(opposite);
    return Directions[opposite as keyof typeof Directions];
}


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
 * Creates an array of arrays
 * @param rows Number of rows
 * @param columns Number of columns
 * @param fill The initial value for every element in the array
 */
function create2DArrayFill(rows: number, columns: number, fill: number): number[][] {
    let arr = new Array(rows);
    for (let i = 0; i < rows; i++) {
        arr[i] = new Array(columns).fill(fill);
    }
    return arr;
}

//#region Vector functions
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

function removeDuplicateVectors(vectorSet: Vector[]): Vector[] {
    let finalSet: Vector[] = [];
    for (let vector of vectorSet) {
        if (!checkInVectorList(finalSet, vector)) finalSet.push(vector);
    }
    return finalSet;
}

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
//#endregion

/**
 * Takes an outline as a set of position vectors and returns the full shape as a set of position vectors
 * @param outline - The vector array of outline positions, as integer coordinates
 */
function getFullShape(outline: Vector[]): Vector[] {
    let fullShape: Vector[] = [];
    let xMin = filterVectors(outline, 'x', 'least');
    let xMax = filterVectors(outline, 'x', 'most');

    for (let testX = xMin; testX <= xMax; testX++) {
        let vectorSubset = outline.filter((vector) => vector.x === testX);
        if (vectorSubset.length > 0) {
            let yMin = filterVectors(vectorSubset, 'y', 'least');
            let yMax = filterVectors(vectorSubset, 'y', 'most')

            for (let testY = yMin; testY <= yMax; testY++) {
                let testVector: Vector = { x: testX, y: testY };
                if (!checkInVectorList(fullShape, testVector)) {    //Slightly redundant
                    fullShape.push(testVector);
                }
            }
        }
    }

    return fullShape;
}

function getOrientation(p: Vector, q: Vector, r: Vector): Orientation {
    let value = ((q.y - p.y) * (r.x - p.x)) - ((r.y - p.y) * (q.x - p.x));
    if (value === 0) return Orientation.Colinear;
    return (value > 0) ? Orientation.Clockwise : Orientation.CounterClockwise;
}


function getCentroid(fullShape: Vector[]): Vector {
    let summation = fullShape.reduce((acc, { x, y }) => ({ x: acc.x + x, y: acc.y + y }), { x: 0, y: 0 });
    return scaleVector(summation, 1 / fullShape.length);
}

function roundAll(vectorSet: Vector[]): Vector[] {
    return vectorSet.map((vector) => roundVector(vector));
}

function sortVectorsAntiClockwise(outline: Vector[]): Vector[] {
    let centroid: Vector = { x: 0, y: 0 }//roundVector(getCentroid(outline));
    let translatedOutline = outline.map((value) => subVectors(value, centroid));
    let sorted = translatedOutline.sort((a, b) => {
        let angleA = getAngle(a);
        let angleB = getAngle(b);
        if (angleA < angleB) return -1;
        if ((angleA === angleB) && (absoluteVector(a) < absoluteVector(b))) return -1;
        return 1;
    });

    return sorted.map((value) => addVectors(value, centroid));
}

function getAngle(vector: Vector): number {
    let angle = Math.atan2(vector.y, vector.x);
    if (angle <= 0) {
        angle += 2 * Math.PI;
    }
    return angle;
}


function sortClosestToVector(vector: Vector, outline: Vector[]): Vector[] {
    outline = outline.filter((value) => {
        return value != vector
    });
    outline = outline.map((value) => subVectors(value, vector));
    let sorted = outline.sort((a, b) => absoluteVector(a) - absoluteVector(b));
    sorted = sorted.map((value) => addVectors(value, vector));
    return sorted;
}


function getAllSurfaceNormals(outline: Vector[]): SurfaceNormal[] {
    let fullShape = getFullShape(outline);
    let pairs: SurfaceNormal[] = [];
    for (let i = 0; i < outline.length; i++) {
        let currentVector = outline[i]
        let normal = getSurfaceNormal(currentVector, outline);
        let testPoint = roundVector(addVectors(currentVector, normal));
        if (checkInVectorList(fullShape, testPoint)) {
            //normal is facing inwards
            normal = scaleVector(normal, -1);
        }

        pairs.push({ position: currentVector, normal: normal });
    }
    return pairs;
}


function getSurfaceNormal(vector: Vector, outline: Vector[]): Vector {
    //console.log(outline);
    if (checkInVectorList(outline, vector)) {
        //console.log(`LOOKING FOR NORMAL VECTOR FOR ${vector.x},${vector.y}`);
        let sortedOutline = sortClosestToVector(vector, outline);
        /*
        let nearest: Vector[] = sortedOutline.slice(0, 4)
        nearest.push(vector)
        console.log(nearest);
        let meanX = nearest.map((value) => value.x).reduce((acc, val) => acc + val, 0);
        let meanY = nearest.map((value) => value.y).reduce((acc, val) => acc + val, 0);
        let xDifferences = nearest.map((value) => value.x - meanX).reduce((acc, val) => acc + val, 0);
        let productDifferences = nearest.map((value) => (value.x - meanX) * (value.y - meanY)).reduce((acc, val) => acc + val, 0);
        let newTangent = (productDifferences) / (xDifferences ** 2);

        console.log(newTangent);
        console.log(- (1 / newTangent));
        */

        let vector1 = sortedOutline[0];
        let vector2 = sortedOutline[1];
        //console.log(`VECTOR1 ${vector1.x},${vector1.y}`);
        //console.log(`VECTOR2 ${vector2.x},${vector2.y}`);

        let tangent = { x: vector1.x - vector2.x, y: vector1.y - vector2.y };
        //More accurate then rotate function, which introduces some rounding errors
        let normal = normaliseVector({ x: -tangent.y, y: tangent.x })///rotateVector(tangent, Math.PI / 2);

        /*
        let testPoint = roundVector(addVectors(currentVector, normal));

        if (!checkInVectorList(getFullShape(outline), testPoint)) {
            //the normal is facing outwards
            //console.log("NORMAL FACING OUTWARDS");
        } else {
            //console.log("NORMAL FACING INWARDS");
            normal = scaleVector(normal, -1);//rotateVector(normal, Math.PI);
        }
        */

        //normal = normaliseVector(normal);
        //console.log(normal);

        return normal;
    }

    console.log("Error");
    return { x: 0, y: 0 };
}

function globalIndex(i: number, j: number, width: number) {
    return (width * j) + i;
}