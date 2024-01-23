//#region Types
type Vector = { x: number; y: number; }
type GridPoints = { points: Vector[]; }
type GraphDataset = GridPoints & { label: string; colour: string; }
type ShapeParameterInfo = { name: string; labelText: string; defaultValue: number; bounds: number[]; }
type SimulationMode = { mode: 'absVelocity' | 'density' | 'curl' }
type GraphMode = { mode: 'surfacePressure' | 'velocity' }
//#endregion

function setupParameters(setupInformation: Record<string, ShapeParameterInfo>): Record<string, number> {
    let temp: Record<string, number> = {};

    for (const [parameterName, parameterInfo] of Object.entries(setupInformation)) {
        temp[parameterName] = parameterInfo.defaultValue;
    }

    return temp;
}

function enforceBounds(value: number, bounds: number[]): number {
    return Math.max(Math.min(value, bounds[1]), bounds[0]);
}

function create2DArrayFill(rows: number, columns: number, fill: number): number[][] {
    let arr = new Array(rows);
    for (let i = 0; i < rows; i++) {
        arr[i] = new Array(columns).fill(fill);
    }
    return arr;
}

//#region Vector functions
function checkInVectorList(currentList: Vector[], testVector: Vector): boolean {
    for (let i = 0; i < currentList.length; i++) {
        let currentVector = currentList[i];
        if (testVector.x == currentVector.x && testVector.y == currentVector.y) {
            return true;
        }
    }
    return false;
}

function addVectors(vector1: Vector, vector2: Vector): Vector {
    return { x: vector1.x + vector2.x, y: vector1.y + vector2.y };
}

function scaleVector(vector1: Vector, scalar: number): Vector {
    return { x: vector1.x * scalar, y: vector1.y * scalar };
}

function rotateVector(vector: Vector, theta: number): Vector {
    let x = vector.x;
    let y = vector.y;
    return {
        x: x * Math.cos(theta) - y * Math.sin(theta),
        y: x * Math.sin(theta) + y * Math.cos(theta)
    }
}

function dotVectors(vector1: Vector, vector2: Vector): number {
    return (vector1.x * vector2.x) + (vector1.y * vector2.y);
}

function absoluteVector(vector: Vector): number {
    return Math.sqrt(vector.x ** 2 + vector.y ** 2);
}


/**
 * Returns a vector with its components rounded to the nearest integer.
 * @param vector - The vector to be 'rounded'.
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

function getFullShape(outline: Vector[]): Vector[] {
    let fullShape: Vector[] = [];
    let xMin = filterVectors(outline, 'x', 'least');
    let xMax = filterVectors(outline, 'x', 'most');

    for (let testX = xMin; testX <= xMax; testX++) {
        let vectorSubset = outline.filter((vector) => vector.x === testX);
        if (vectorSubset.length > 0) {
            let yMin = filterVectors(vectorSubset, 'y', 'least');
            let yMax = filterVectors(vectorSubset, 'y', 'most')
            //console.log(testX);
            //console.log("SMALLEST: " + smallestY);
            //console.log("LARGEST: " + largestY);
            //console.log(vectorSubset);

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

