//Front end
//#region Constants for the simulation
const nodesPerMeter: number = 60;
const nodeDistance: number = 1 / nodesPerMeter; //Defined 60 nodes as 1m
const stepsPerFrame: number = 10;
const latticeSpeedOfSound: number = 1 / Math.sqrt(3);

const discreteVelocities = 9;
const latticeIndices = Array.from(
    { length: discreteVelocities },
    (_, index) => index,
);
const latticeXs = [0, 0, 1, 1, 1, 0, -1, -1, -1];
const latticeYs = [0, 1, 1, 0, -1, -1, -1, 0, 1];
const oppositeIndices = [0, 5, 6, 7, 8, 1, 2, 3, 4];
const latticeWeights = [
    4 / 9,
    1 / 9,
    1 / 36,
    1 / 9,
    1 / 36,
    1 / 9,
    1 / 36,
    1 / 9,
    1 / 36,
];

//#endregion

const applicationManager = new ApplicationManager();

//#region Listener events
function updateAirfoilParameters(): void {
    applicationManager.airfoilDesigner.updateAirfoil();
    applicationManager.fluidManager.updateAirfoil(applicationManager.airfoilDesigner.ShapeGridPoints);
}
function resetAirfoilParameters(): void {
    applicationManager.airfoilDesigner.resetAirfoil();
    //applicationManager.fluidManager.resetParameters();
    applicationManager.fluidManager.updateAirfoil(applicationManager.airfoilDesigner.ShapeGridPoints);
}
function resetFluidParameters(): void {
    applicationManager.fluidManager.resetParameters();
    applicationManager.fluidManager.updateAirfoil(applicationManager.airfoilDesigner.ShapeGridPoints);
    resetGeneralFluidControls();
}
function resetGeneralFluidControls(): void {
    applicationManager.fluidManager.ShowTracers = false;
    applicationManager.fluidManager.ShowStreamlines = false;

    applicationManager.FMTracersCheck.checked = false;
    applicationManager.FMStreamlinesCheck.checked = false;
}
//#endregion

//#region Updating
function update(): void {
    applicationManager.update();
    requestAnimationFrame(update);
}

update();

//#endregion
