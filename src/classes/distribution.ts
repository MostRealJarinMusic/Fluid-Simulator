class Distribution {
    public north: number[];
    public northEast: number[];
    public east: number[];
    public southEast: number[];
    public south: number[];
    public southWest: number[];
    public west: number[];
    public northWest: number[];
    public centre: number[];

    constructor(size: number, initialValue: number) {
        this.north = new Array(size).fill(initialValue);
        this.northEast = new Array(size).fill(initialValue);
        this.east = new Array(size).fill(initialValue);
        this.southEast = new Array(size).fill(initialValue);
        this.south = new Array(size).fill(initialValue);
        this.southWest = new Array(size).fill(initialValue);
        this.west = new Array(size).fill(initialValue);
        this.northWest = new Array(size).fill(initialValue);
        this.centre = new Array(size).fill(initialValue);
    }

    public getDistribution(index: number): number[] {
        return [
            this.centre[index],
            this.north[index],
            this.northEast[index],
            this.east[index],
            this.southEast[index],
            this.south[index],
            this.southWest[index],
            this.west[index],
            this.northWest[index]
        ];
    }

}