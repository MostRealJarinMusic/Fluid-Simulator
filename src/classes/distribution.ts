class Distribution {
    public dNorth: number[];
    public dNorthEast: number[];
    public dEast: number[];
    public dSouthEast: number[];
    public dSouth: number[];
    public dSouthWest: number[];
    public dWest: number[];
    public dNorthWest: number[];
    public dCentre: number[];

    constructor(size: number, initialValue: number) {
        this.dNorth = new Array(size).fill(initialValue);
        this.dNorthEast = new Array(size).fill(initialValue);
        this.dEast = new Array(size).fill(initialValue);
        this.dSouthEast = new Array(size).fill(initialValue);
        this.dSouth = new Array(size).fill(initialValue);
        this.dSouthWest = new Array(size).fill(initialValue);
        this.dWest = new Array(size).fill(initialValue);
        this.dNorthWest = new Array(size).fill(initialValue);
        this.dCentre = new Array(size).fill(initialValue);
    }

    /*
    public getDistribution(index: number): number[] {
        return [
            this.dCentre[index],
            this.dNorth[index],
            this.dNorthEast[index],
            this.dEast[index],
            this.dSouthEast[index],
            this.dSouth[index],
            this.dSouthWest[index],
            this.dWest[index],
            this.dNorthWest[index]
        ];
    }
    */
}