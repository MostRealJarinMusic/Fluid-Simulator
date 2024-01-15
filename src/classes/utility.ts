
/*
class Utility {
    public static setupParameters(setupInformation: { [key: string]: ShapeParameterInfo }): { [key: string]: number } {
        var temp: { [key: string]: number } = {};

        for (const [parameterName, parameterInfo] of Object.entries(setupInformation)) {
            temp[parameterName] = parameterInfo.defaultValue;
        }

        return temp;
    }
}
*/

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

