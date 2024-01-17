//Front end

//#region Airfoil designer

//Airfoil graph
let airfoilGraphCanvas: HTMLCanvasElement = document.getElementById('airfoilGraph') as HTMLCanvasElement;

//Designer
let ADTypeSelector = document.getElementById('airfoilTypeSelector') as HTMLSelectElement;
let ADParameterInputContainer = document.getElementById("airfoilDesignerParameters") as HTMLDivElement;
let ADProfileNumText = document.getElementById("airfoilProfileNum") as HTMLParagraphElement;

const airfoilDesigner = new AirfoilDesigner(airfoilGraphCanvas, ADTypeSelector, ADParameterInputContainer, ADProfileNumText);
//console.log(airfoilDesigner.ShapeGridPoints)
//#endregion

//#region Simulation
//Simulation
let FSCanvas = document.getElementById("fluidSimulation") as HTMLCanvasElement;

//160, 80
const fluidSimulation = new Fluid(160, 80, 1, 2.5, 0.53, FSCanvas);
//fluidSimulation.setupDefaultObstacle();
fluidSimulation.updateAirfoil(airfoilDesigner.ShapeGridPoints)
fluidSimulation.initFluid();

//#endregion

//#region Data and Graphs


//#endregion


//#region Listener events
//Airfoil designer listener events
function updateAirfoilParameters(): void {
    airfoilDesigner.updateAirfoil();
    fluidSimulation.updateAirfoil(airfoilDesigner.ShapeGridPoints);
}

function updateChosenShape(): void {
    airfoilDesigner.changeAirfoil();
}

function resetAirfoilParameters(): void {
    airfoilDesigner.resetAirfoil();
    fluidSimulation.updateAirfoil(airfoilDesigner.ShapeGridPoints);
}



//#endregion

//#region Updating
function update(): void {
    fluidSimulation.runMainLoop();
    fluidSimulation.drawFluid();
    requestAnimationFrame(update);
}

update();

//#endregion

