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


function getFullShape(startX: number, endX: number, outline: Vector[]): Vector[] {
    let fullShape: Vector[] = [];

    for (let testX = startX; testX < endX; testX++) {
        let sameXVectors = outline.filter((vector) => vector.x === testX);
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