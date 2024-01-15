//Front end

//#region Airfoil designer

//Airfoil graph
let airfoilGraphCanvas: HTMLCanvasElement = document.getElementById('airfoilGraph') as HTMLCanvasElement;
let airfoilGraphContext: CanvasRenderingContext2D = airfoilGraphCanvas.getContext('2d') as CanvasRenderingContext2D;

//Designer
let ADTypeSelector = document.getElementById('airfoilTypeSelector') as HTMLSelectElement;
let ADParameterInputContainer = document.getElementById("airfoilDesignerParameters") as HTMLDivElement;
let ADProfileNumText = document.getElementById("airfoilProfileNum") as HTMLParagraphElement;

const airfoilDesigner = new AirfoilDesigner(airfoilGraphContext, ADTypeSelector, ADParameterInputContainer, ADProfileNumText);

//Airfoil designer listener events
function updateAirfoilParameters(): void {
    airfoilDesigner.updateAirfoil();
}

function updateChosenShape(): void {
    airfoilDesigner.changeAirfoil();
}

function resetAirfoilParameters(): void {
    airfoilDesigner.resetAirfoil();
}

//#endregion




//#region Simulation

//Simulation
let FSCanvas = document.getElementById("fluidSimulation") as HTMLCanvasElement;

//160, 80
const fluidSimulation = new Fluid(160, 80, 1, 2.7, 0.53, FSCanvas);

fluidSimulation.setupObstacle();
fluidSimulation.initFluid();

function updateFluidSimulation(): void {
    fluidSimulation.runMainLoop();
    fluidSimulation.drawFluid();
    requestAnimationFrame(updateFluidSimulation);
}

updateFluidSimulation();
//#endregion


//#region Data and Graphs



//#endregion