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
    /**
     * Setting up the airfoil designer
     */
    private setupAirfoilDesigner(): void {
        //Airfoil graph
        this.airfoilGraphCanvas = document.getElementById('airfoilGraph') as HTMLCanvasElement;

        //Designer
        this.ADTypeSelector = document.getElementById('airfoilTypeSelector') as HTMLSelectElement;
        this.ADParameterInputContainer = document.getElementById("airfoilDesignerParameters") as HTMLDivElement;
        this.ADProfileNumText = document.getElementById("airfoilProfileNum") as HTMLParagraphElement;

        this.airfoilDesigner = new AirfoilDesigner(this.airfoilGraphCanvas, this.ADTypeSelector, this.ADParameterInputContainer, this.ADProfileNumText);
    }

    /**
     * Setting up the fluid manager
     */
    private setupSimulation(): void {
        this.FMCanvas = document.getElementById("fluidSimulation") as HTMLCanvasElement;
        this.FMSimulationModeSelector = document.getElementById("simulationModeSelector") as HTMLSelectElement;
        this.FMTracersCheck = document.getElementById("fluidTracers") as HTMLInputElement;
        this.FMStreamlinesCheck = document.getElementById("fluidStreamlines") as HTMLInputElement;
        this.FMAngleOfAttackInput = document.getElementById("angleOfAttack") as HTMLInputElement;
        this.FMFSVelocityInput = document.getElementById("freeStreamVelocity") as HTMLInputElement;

        let elements: LabelledElement[] = [
            { name: "AOA", element: document.getElementById("AOALabel") as HTMLLabelElement, label: "Angle of Attack: ", units: "Degrees" },
            { name: "FSV", element: document.getElementById("FSVLabel") as HTMLLabelElement, label: "Free Stream Velocity: ", units: "m/s" },
        ]

        this.fluidManager = new FluidManager(this.FMCanvas, this.FMSimulationModeSelector, this.FMAngleOfAttackInput, this.FMFSVelocityInput);
        this.fluidManager.updateAirfoil(this.airfoilDesigner.ShapeOutline);
        this.fluidManager.initFluid();
    }

    /**
     * Setting up the results manager
     */
    private setupResultsManager(): void {
        this.RMCanvas = document.getElementById("dataGraph") as HTMLCanvasElement;

        let elements: LabelledElement[] = [
            { name: "lift", element: document.getElementById("liftValue") as HTMLParagraphElement, label: "Lift: ", units: "N" },
            { name: "drag", element: document.getElementById("dragValue") as HTMLParagraphElement, label: "Drag: ", units: "N" },
            { name: "LTDRatio", element: document.getElementById("LTDValue") as HTMLParagraphElement, label: "L/D Ratio: ", units: "" },
            { name: "liftCoefficient", element: document.getElementById("liftCoefficientValue") as HTMLParagraphElement, label: "Lift Coefficient: ", units: "" },
            { name: "dragCoefficient", element: document.getElementById("dragCoefficientValue") as HTMLParagraphElement, label: "Drag Coefficient: ", units: "" }
        ];

        this.resultsManager = new ResultsManager(this.RMCanvas, elements);
        this.resultsManager.assignFluidManager(this.fluidManager);
        this.resultsManager.assignAirfoilDesigner(this.airfoilDesigner);
    }

    /**
     * Setting up listener events for the airfoil designer, fluid manager and results manager
     */
    private setupListeners(): void {
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
    }
    //#endregion


    public skipIterations(): void {
        for (let _ = 0; _ < 100; _++) {
            this.fluidManager.runMainLoop();
        }
    }

    /**
     * Update function that is called every frame
     */
    public update(): void {
        for (let _ = 0; _ < stepsPerFrame; _++) {
            this.fluidManager.runMainLoop();
        }
        this.fluidManager.drawFluid();
        this.resultsManager.calculateResults();
        this.resultsManager.displayValues();
        this.resultsManager.updateGraph();
    }
}