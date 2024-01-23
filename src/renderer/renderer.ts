//Front end

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
let FMParameterInputContainer = document.getElementById("fluidSimulationParameters") as HTMLDivElement;
let FMSimulationModeSelector = document.getElementById("simulationModeSelector") as HTMLSelectElement;

//160, 80
//const fluidSimulation = new Fluid(160, 80, 1, 2.5, 0.53, FMCanvas);
const fluidManager = new FluidManager(FMCanvas, FMParameterInputContainer, FMSimulationModeSelector);

//fluidSimulation.setupDefaultObstacle();

fluidManager.updateAirfoil(airfoilDesigner.ShapeGridPoints);
fluidManager.initFluid();

//#endregion

//#region Data and Graphs


//#endregion


//#region Listener events
function updateAirfoilParameters(): void {
    airfoilDesigner.updateAirfoil();
    fluidManager.updateAirfoil(airfoilDesigner.ShapeGridPoints);
}

function updateChosenShape(): void {
    airfoilDesigner.changeAirfoil();
    fluidManager.updateAirfoil(airfoilDesigner.ShapeGridPoints);
}

function resetAirfoilParameters(): void {
    airfoilDesigner.resetAirfoil();
    fluidManager.updateAirfoil(airfoilDesigner.ShapeGridPoints);
}

function updateAngleOfAttack(): void {

}

function updateFreeStreamVelocity(): void {

}

function updateSimulationMode(): void {
    fluidManager.updateSimulationMode();
}



//#endregion

//#region Updating
function update(): void {
    fluidManager.runMainLoop();
    fluidManager.drawFluid();
    requestAnimationFrame(update);
}

update();
//#endregion

