//Front end
//#region Constants for the simulation
const nodesPerMeter: number = 60;
const nodeDistance: number = 1 / nodesPerMeter; //Defined 60 nodes as 1m
const stepsPerFrame: number = 10;
const latticeSpeedOfSound: number = 1 / Math.sqrt(3);
//#endregion

const applicationManager = new ApplicationManager();

//#region Listener events
function updateAirfoilParameters(): void {
    applicationManager.airfoilDesigner.updateAirfoil();
    applicationManager.fluidManager.updateAirfoil(applicationManager.airfoilDesigner.ShapeGridPoints);
}
function resetAirfoilParameters(): void {
    applicationManager.airfoilDesigner.resetAirfoil();
    applicationManager.fluidManager.resetParameters();
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