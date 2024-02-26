class ApplicationManager {
    //#region Private Variables
    private airfoilGraphCanvas!: HTMLCanvasElement;
    private ADTypeSelector!: HTMLSelectElement;
    private ADParameterInputContainer!: HTMLDivElement;
    private ADProfileNumText!: HTMLParagraphElement;
    public airfoilDesigner!: AirfoilDesigner;

    private FMCanvas!: HTMLCanvasElement;
    private FMSimulationModeSelector!: HTMLSelectElement;
    public FMTracersCheck!: HTMLInputElement;
    public FMStreamlinesCheck!: HTMLInputElement;
    private FMAngleOfAttackInput!: HTMLInputElement;
    private FMFSVelocityInput!: HTMLInputElement;
    public fluidManager!: FluidManager;

    private RMCanvas!: HTMLCanvasElement;
    private RMValuesDisplay!: HTMLDivElement;
    private RMGraphingModeSelector!: HTMLSelectElement;
    public resultsManager!: ResultsManager;
    //#endregion

    constructor() {
        //Setup
        this.setupAirfoilDesigner();
        this.setupSimulation();
        this.setupResultsManager();
        this.setupListeners();
    }

    //#region Setup
    setupAirfoilDesigner(): void {
        //Airfoil graph
        this.airfoilGraphCanvas = document.getElementById('airfoilGraph') as HTMLCanvasElement;

        //Designer
        this.ADTypeSelector = document.getElementById('airfoilTypeSelector') as HTMLSelectElement;
        this.ADParameterInputContainer = document.getElementById("airfoilDesignerParameters") as HTMLDivElement;
        this.ADProfileNumText = document.getElementById("airfoilProfileNum") as HTMLParagraphElement;

        this.airfoilDesigner = new AirfoilDesigner(this.airfoilGraphCanvas, this.ADTypeSelector, this.ADParameterInputContainer, this.ADProfileNumText);
    }

    setupSimulation(): void {
        this.FMCanvas = document.getElementById("fluidSimulation") as HTMLCanvasElement;
        this.FMSimulationModeSelector = document.getElementById("simulationModeSelector") as HTMLSelectElement;
        this.FMTracersCheck = document.getElementById("fluidTracers") as HTMLInputElement;
        this.FMStreamlinesCheck = document.getElementById("fluidStreamlines") as HTMLInputElement;
        this.FMAngleOfAttackInput = document.getElementById("angleOfAttack") as HTMLInputElement;
        this.FMFSVelocityInput = document.getElementById("freeStreamVelocity") as HTMLInputElement;

        this.fluidManager = new FluidManager(this.FMCanvas, this.FMSimulationModeSelector, this.FMAngleOfAttackInput, this.FMFSVelocityInput);
        this.fluidManager.updateAirfoil(this.airfoilDesigner.ShapeOutline);
        this.fluidManager.initFluid();
    }

    setupResultsManager(): void {
        this.RMCanvas = document.getElementById("dataGraph") as HTMLCanvasElement;
        this.RMValuesDisplay = document.getElementById("valuesDisplay") as HTMLDivElement;
        this.RMGraphingModeSelector = document.getElementById("resultsGraphModeSelector") as HTMLSelectElement;

        this.resultsManager = new ResultsManager(this.RMCanvas, this.RMGraphingModeSelector, this.RMValuesDisplay);
    }

    setupListeners(): void {
        this.FMTracersCheck.addEventListener('change', function () {
            applicationManager.fluidManager.ShowTracers = this.checked;
        });
        this.FMStreamlinesCheck.addEventListener('change', function () {
            applicationManager.fluidManager.ShowStreamlines = this.checked;
        });
        this.ADTypeSelector.addEventListener('change', function () {
            applicationManager.airfoilDesigner.changeAirfoil();
            applicationManager.fluidManager.resetParameters();
            applicationManager.fluidManager.updateAirfoil(applicationManager.airfoilDesigner.ShapeOutline);
        });
        this.FMSimulationModeSelector.addEventListener('change', function () {
            applicationManager.fluidManager.updateSimulationMode();
        });
        this.FMAngleOfAttackInput.addEventListener('input', function () {
            applicationManager.fluidManager.updateAngleOfAttack();
        });
        this.FMFSVelocityInput.addEventListener('change', function () {
            applicationManager.fluidManager.updateFreeStreamVelocity();
        });
        this.RMGraphingModeSelector.addEventListener('change', function () {
            applicationManager.resultsManager.updateGraphingMode();
        });

    }
    //#endregion

    update(): void {
        for (let _ = 0; _ < stepsPerFrame; _++) {
            this.fluidManager.runMainLoop();
        }
        this.fluidManager.drawFluid();
        this.resultsManager.calculateForce(this.fluidManager.PressureGradient, this.fluidManager.SurfaceNormals, this.fluidManager.Origin);
    }
}