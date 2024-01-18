//#region Types
type Vector = { x: number; y: number; }
type GridPoints = { gridPoints: Vector[]; }
type GraphDataset = { label: string; plotPoints: Vector[]; colour: string; }
type ShapeParameterInfo = { name: string; labelText: string; defaultValue: number; bounds: number[]; }
type Matrix = { elements: number[][] }
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

function roundVector(vector: Vector): Vector {
    return { x: Math.round(vector.x), y: Math.round(vector.y) };
}

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

function getFullShape(outline: Vector[]): Vector[] {
    let fullShape: Vector[] = [];
    /*
    let smallestX = outline.reduce((accumulator, currentValue) => {
        return (accumulator.x < currentValue.x ? accumulator : currentValue)
    }).x;
    */
    let smallestX = filterVectors(outline, 'x', 'least');
    let largestX = filterVectors(outline, 'x', 'most');

    for (let testX = smallestX; testX <= largestX; testX++) {
        let vectorSubset = outline.filter((vector) => vector.x === testX);
        if (vectorSubset.length > 0) {
            let smallestY = filterVectors(vectorSubset, 'y', 'least');
            let largestY = filterVectors(vectorSubset, 'y', 'most')
            //console.log(testX);
            //console.log("SMALLEST: " + smallestY);
            //console.log("LARGEST: " + largestY);
            //console.log(vectorSubset);

            for (let testY = smallestY; testY <= largestY; testY++) {
                let testVector: Vector = { x: testX, y: testY };
                if (!checkInVectorList(fullShape, testVector)) {
                    fullShape.push(testVector);
                }
            }
        }
    }

    return fullShape;
}

