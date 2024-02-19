//Front end
//#region Defined SI constants for the simulation
const nodesPerMeter = 60;
const nodeDistance = 1 / nodesPerMeter; //Defined 60 nodes as 1m
const stepsPerFrame = 7;

//#endregion



//#region Airfoil designer

//Airfoil graph
let airfoilGraphCanvas = document.getElementById('airfoilGraph') as HTMLCanvasElement;

//Designer
let ADTypeSelector = document.getElementById('airfoilTypeSelector') as HTMLSelectElement;
let ADParameterInputContainer = document.getElementById("airfoilDesignerParameters") as HTMLDivElement;
let ADProfileNumText = document.getElementById("airfoilProfileNum") as HTMLParagraphElement;

const airfoilDesigner = new AirfoilDesigner(airfoilGraphCanvas, ADTypeSelector, ADParameterInputContainer, ADProfileNumText);
//#endregion

//#region Simulation
//Simulation
let FMCanvas = document.getElementById("fluidSimulation") as HTMLCanvasElement;
let FMSimulationModeSelector = document.getElementById("simulationModeSelector") as HTMLSelectElement;
let FMTracersCheck = document.getElementById("fluidTracers") as HTMLInputElement;
let FMStreamlinesCheck = document.getElementById("fluidStreamlines") as HTMLInputElement;
let FMFreeStreamVelocityInput = document.getElementById("freeStreamVelocity") as HTMLInputElement;
let FMAngleOfAttackInput = document.getElementById("angleOfAttack") as HTMLInputElement;
let FMFSVelocityInput = document.getElementById("freeStreamVelocity") as HTMLInputElement;

//160, 80
//const fluidSimulation = new Fluid(160, 80, 1, 2.5, 0.53, FMCanvas);
const fluidManager = new FluidManager(FMCanvas, FMSimulationModeSelector, FMAngleOfAttackInput, FMFSVelocityInput);
//fluidSimulation.setupDefaultObstacle();
fluidManager.updateAirfoil(airfoilDesigner.ShapeGridPoints);
fluidManager.initFluid();


//#endregion

//#region Data and Graphs
let RMCanvas = document.getElementById("dataGraph") as HTMLCanvasElement;
let RMValuesDisplay = document.getElementById("valuesDisplay") as HTMLDivElement;
let RMGraphingModeSelector = document.getElementById("resultsGraphModeSelector") as HTMLSelectElement;

const resultsManager = new ResultsManager(RMCanvas, RMGraphingModeSelector, RMValuesDisplay);

//#endregion


//#region Listener events
function updateAirfoilParameters(): void {
    airfoilDesigner.updateAirfoil();
    fluidManager.updateAirfoil(airfoilDesigner.ShapeGridPoints);
}

function updateChosenShape(): void {
    airfoilDesigner.changeAirfoil();
    fluidManager.resetParameters();
    fluidManager.updateAirfoil(airfoilDesigner.ShapeGridPoints);
}

function resetAirfoilParameters(): void {
    airfoilDesigner.resetAirfoil();
    fluidManager.resetParameters();
    fluidManager.updateAirfoil(airfoilDesigner.ShapeGridPoints);
}

function resetFluidParameters(): void {
    fluidManager.resetParameters();
    fluidManager.updateAirfoil(airfoilDesigner.ShapeGridPoints);
}


function updateSimulationMode(): void {
    fluidManager.updateSimulationMode();
}

function updateResultsGraphingMode(): void {
    resultsManager.updateGraphingMode();
}

FMTracersCheck.addEventListener('change', function () {
    fluidManager.ShowTracers = this.checked;
});

FMStreamlinesCheck.addEventListener('change', function () {
    fluidManager.ShowStreamlines = this.checked;
});
/*
FMFreeStreamVelocityInput.addEventListener('change', function () {
    //console.log(this.value);
    fluidManager.FreeStreamVelocity = parseFloat(this.value);
});
*/
function updateFreeStreamVelocity(): void {
    fluidManager.updateFreeStreamVelocity();
}

/*
FMAngleOfAttackInput.addEventListener('change', function () {
    fluidManager.AngleOfAttack = parseFloat(this.value);
})
*/
function updateAngleOfAttack(): void {
    fluidManager.updateAngleOfAttack();
}


//#endregion

//#region Updating
function update(): void {
    for (let i = 0; i < stepsPerFrame; i++) {
        fluidManager.runMainLoop();
    }
    fluidManager.drawFluid();
    requestAnimationFrame(update);
}

update();
//#endregion

