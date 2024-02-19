//#region Types
type Vector = { x: number; y: number; }
type GridPoints = { points: Vector[]; }
type GraphDataset = GridPoints & { label: string; colour: string; }
type Bound = { lower: number, upper: number };
type ParameterInfo = { name: string; labelText: string; defaultValue: number; bounds: Bound; }
type Colour = { red: number, green: number, blue: number, alpha: number };

const validSimulationModes = ['velocity', 'density', 'curl', 'pressure'] as const;
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

function addVectors(vector1: Vector, vector2: Vector): Vector {
    return { x: vector1.x + vector2.x, y: vector1.y + vector2.y };
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

function dotVectors(vector1: Vector, vector2: Vector): number {
    return (vector1.x * vector2.x) + (vector1.y * vector2.y);
}

function absoluteVector(vector: Vector): number {
    return Math.sqrt(vector.x ** 2 + vector.y ** 2);
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