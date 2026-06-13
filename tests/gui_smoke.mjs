import assert from "node:assert/strict";

const defaults = {
  loginScreen: "",
  loginError: "",
  loginUserName: "user",
  loginPassword: "password",
  loginSubmitButton: "",
  expiredPasswordPanel: "",
  expiredNewPassword: "",
  expiredConfirmPassword: "",
  expiredPasswordButton: "",
  assessmentName: "Untitled assessment",
  outsideDiameter: "24",
  wallThickness: "0.375",
  maop: "720",
  classLocation: "1",
  designFactor: "0.8",
  grade: "52000",
  customSmys: "52000",
  youngsModulus: "30000000",
  vehiclePreset: "custom",
  vehicleType: "wheel",
  axleCount: "4",
  vehicleWeight: "46000",
  contactArea: "180",
  tirePressure: "85",
  axleWidth: "72",
  tireWidth: "12",
  axleSpacing: "60",
  crossingAngle: "90",
  impactFactor: "1.15",
  soilProfile: "compacted_bare",
  soilLoadModel: "prism",
  soilFrictionAngle: "30",
  surfaceLayerThickness: "0",
  surfaceLayerUnitWeight: "0",
  cover: "48",
  soilUnitWeight: "120",
  soilModulus: "1000",
  kb: "0.1",
  kz: "0.061",
  scanStep: "3",
  bendingStrainMode: "direct",
  bendingStrain: "0",
  pipeDeflection: "0",
  deflectedPipeLength: "240",
  bendingStrainBasis: "absolute",
  fatigueEnabled: "off",
  fatigueStressSource: "calculated",
  fatigueStressRange: "0",
  fatigueCycles: "0",
  fatigueExponent: "3",
  fatigueConstant: "1000000000000000",
  mitigationType: "none",
  mitigationWidth: "0",
  mitigationLength: "0",
  mitigationThickness: "0",
  mitigationSpreadAngle: "45",
  mitigationUnitWeight: "0",
  statusPill: "",
  errorBox: "",
  totalHoop: "",
  smysMeter: "",
  smysText: "",
  liveHoop: "",
  soilHoop: "",
  pressureHoop: "",
  hoopSubtotal: "",
  bendingStrainStress: "",
  totalBendingStrain: "",
  fatigueStatus: "",
  fatigueDamage: "",
  fatigueAllowableCycles: "",
  fatigueStressRangeOutput: "",
  fatigueSummary: "",
  mitigatedAssessment: "",
  mitigatedLiveHoop: "",
  mitigatedStressRatio: "",
  mitigationLoadFactor: "",
  mitigationSummary: "",
  livePressure: "",
  criticalPosition: "",
  zeroPressureTotal: "",
  pointLoadCount: "",
  loadPerPoint: "",
  contactPressure: "",
  vehicleSchematic: "",
  calculateButton: "",
  reportButton: "",
  reportDownloadLink: "",
  moduleSelector: "",
  adminPage: "",
  pipelinePage: "",
  corlasPage: "",
  sccColonyPage: "",
  crackGrowthPage: "",
  iliScreeningPage: "",
  iliToFeaPage: "",
  annexKPage: "",
  dentPage: "",
  b31gPage: "",
  rstrengPage: "",
  prciDentPage: "",
  interactionPage: "",
  moduleSelect: "",
  moduleSelectSummary: "",
  calculationManager: "",
  calculationManagerNote: "",
  iliWorkflowButton: "",
  moduleHelpButton: "",
  helpDialogOverlay: "",
  helpDialogClose: "",
  helpModuleInstructions: "",
  adminModuleOption: "",
  backToModulesFromCorlas: "",
  backToModulesFromSccColony: "",
  backToModulesFromCrackGrowth: "",
  backToModulesFromIliScreening: "",
  backToModulesFromAnnexK: "",
  backToModulesFromDent: "",
  backToModulesFromB31g: "",
  backToModulesFromRstreng: "",
  backToModulesFromPrciDent: "",
  backToModulesFromInteraction: "",
  prciDentReportButton: "",
  corlasReportButton: "",
  calculateCorlasButton: "",
  corlasDiameter: "406.4",
  corlasWallThickness: "7.14",
  corlasCrackDepth: "2.9",
  corlasCrackLength: "26",
  corlasCrackLocation: "external",
  corlasCrackProfile: "semi_elliptical",
  corlasYieldStrength: "359",
  corlasTensileStrength: "450",
  corlasElasticModulus: "207000",
  corlasCvn: "18",
  corlasToughnessMethod: "manual",
  corlasCharpyArea: "0.124",
  corlasFractureToughness: "225",
  corlasFlowCoefficient: "0.5",
  corlasPressureStep: "0.01",
  corlasMaxIterations: "100000",
  corlasErrorBox: "",
  corlasAssessmentBox: "",
  corlasStatus: "",
  corlasStatusDetail: "",
  corlasFracturePressure: "",
  corlasFracturePressurePsi: "",
  corlasCollapsePressure: "",
  corlasCollapsePressurePsi: "",
  corlasFailurePressure: "",
  corlasFailurePressurePsi: "",
  corlasJt: "",
  corlasJe: "",
  corlasJp: "",
  corlasFlowStress: "",
  corlasFoliasFactor: "",
  corlasQf: "",
  corlasFsf: "",
  corlasN: "",
  corlasLocalStress: "",
  corlasPlasticStrain: "",
  corlasF3: "",
  sccColonyReportButton: "",
  calculateSccColonyButton: "",
  sccDiameter: "762",
  sccWallThickness: "9.5",
  sccMaop: "6.9",
  sccSmys: "448",
  sccSmts: "535",
  sccToughness: "95",
  sccAssessmentFactor: "0.72",
  sccOrientation: "axial",
  sccGeometryFactor: "1.12",
  sccDepths: "1.8, 2.4, 2.1, 1.6",
  sccLengths: "18, 24, 20, 15",
  sccSpacings: "8, 12, 30",
  sccPressureRange: "1.5",
  sccParisC: "0.000000000001",
  sccParisM: "3",
  sccErrorBox: "",
  sccAssessmentBox: "",
  sccStatus: "",
  sccDisposition: "",
  sccFailurePressure: "",
  sccAllowablePressure: "",
  sccPressureRatio: "",
  sccColonyClass: "",
  sccInteractionFactor: "",
  sccCrackCount: "",
  sccEquivalentDepth: "",
  sccEquivalentLength: "",
  sccDepthRatio: "",
  sccKr: "",
  sccCollapsePressure: "",
  sccFracturePressure: "",
  sccFolias: "",
  sccRemainingCycles: "",
  sccCrackGrowthStatus: "",
  sccColonyVisualSummary: "",
  sccColonyVisualization: "",
  crackGrowthReportButton: "",
  calculateCrackGrowthButton: "",
  crackGrowthInitialCrack: "1",
  crackGrowthCriticalCrack: "6",
  crackGrowthStressRange: "80",
  crackGrowthGeometryFactor: "1.12",
  crackGrowthThresholdK: "0",
  crackGrowthParisC: "0.000000000001",
  crackGrowthParisM: "3",
  crackGrowthIncrement: "0.001",
  crackGrowthAppliedCycles: "100000",
  crackGrowthLifeFactor: "1",
  crackGrowthErrorBox: "",
  crackGrowthAssessmentBox: "",
  crackGrowthStatus: "",
  crackGrowthDisposition: "",
  crackGrowthEstimatedCycles: "",
  crackGrowthFactoredCycles: "",
  crackGrowthAppliedCyclesOutput: "",
  crackGrowthRemainingCycles: "",
  crackGrowthDamageRatio: "",
  crackGrowthInitialDeltaK: "",
  crackGrowthCriticalDeltaK: "",
  crackGrowthInitialRate: "",
  crackGrowthCriticalRate: "",
  crackGrowthSteps: "",
  iliScreeningReportButton: "",
  calculateIliScreeningButton: "",
  iliDiameter: "762",
  iliWallThickness: "9.5",
  iliMaop: "6.9",
  iliSmys: "448",
  iliAssessmentFactor: "0.72",
  iliRepairRatio: "1",
  iliMonitorRatio: "0.8",
  iliDepthWatch: "50",
  iliClassLocation: "2",
  iliPredictionYears: "5",
  iliGrowthRate: "1",
  iliPrimaryMethod: "corlas",
  iliScreeningMethods: "modified_b31g,asme_b31g,rstreng_simplified,corlas",
  iliToughness: "95",
  iliFatigueEnabled: "yes",
  iliStressRange: "80",
  iliBendingStrain: "0.2",
  iliCyclesPerYear: "1000",
  iliAppliedCycles: "10000",
  iliParisC: "0.000000000001",
  iliParisM: "3",
  iliFeatureIds: "F-101, F-102, F-103, F-104",
  iliFeatureFile: "",
  iliFeatureTypes: "metal_loss, crack, dent, metal_loss",
  iliDepths: "42, 58, 18, 64",
  iliLengths: "110, 45, 75, 180",
  iliClockPositions: "3:00, 6:00, 12:00, 4:30",
  iliDistances: "1250.4, 1258.8, 1280.2, 1315.6",
  iliReportedPressures: "0, 8.1, 0, 6.8",
  iliErrorBox: "",
  iliAssessmentBox: "",
  iliStatus: "",
  iliDisposition: "",
  iliFeatureCount: "",
  iliImmediateCount: "",
  iliHighCount: "",
  iliMonitorCount: "",
  iliConservativeMethod: "",
  iliHighestRiskFeature: "",
  iliPredictedFailures: "",
  iliRiskClass: "",
  iliRankingTableBody: "",
  iliFileStatus: "",
  backToModulesFromIliToFea: "",
  calculateIliToFeaButton: "",
  iliToFeaReportButton: "",
  iliToFeaFile: "",
  iliToFeaFileStatus: "",
  iliToFeaGeometrySource: "auto",
  iliToFeaGeometrySourceNote: "",
  iliToFeaMflFile: "",
  iliToFeaMflStatus: "",
  iliToFeaCrackFile: "",
  iliToFeaCrackStatus: "",
  iliToFeaCaliperFile: "",
  iliToFeaCaliperStatus: "",
  iliToFeaIds: "F-101, F-102, F-103",
  iliToFeaTypes: "metal_loss, crack, dent",
  iliToFeaDepths: "42, 58, 18",
  iliToFeaLengths: "110, 45, 75",
  iliToFeaWidths: "70, 20, 90",
  iliToFeaClocks: "3:00, 3:30, 12:00",
  iliToFeaDistances: "1250, 1250.2, 1280",
  iliToFeaOrientations: "0, 10, 0",
  iliToFeaSurfaces: "external, external, external",
  iliToFeaWeldTypes: "none, girth_weld, pipe_seam",
  iliToFeaWeldOffsets: "0, 0, 0",
  iliToFeaReportedPressures: "0, 8.1, 0",
  iliToFeaMflRaw: "F-101,0,0,42",
  iliToFeaCrackRaw: "F-102,0,0,5.51,0.4",
  iliToFeaCaliperRaw: "F-103,0,0,-1.7",
  iliToFeaOd: "762",
  iliToFeaWallThickness: "9.5",
  iliToFeaMaop: "6.9",
  iliToFeaSmys: "448",
  iliToFeaSmts: "535",
  iliToFeaElasticModulus: "207000",
  iliToFeaToughness: "95",
  iliToFeaAssessmentFactor: "0.72",
  iliToFeaWeldYield: "480",
  iliToFeaPipeWeldType: "erw_high_frequency",
  iliToFeaSpiralTurns: "1.5",
  iliToFeaReliabilityEnabled: "on",
  iliToFeaWeldToughness: "75",
  iliToFeaWeldResidualFactor: "0.6",
  iliToFeaWeldWidth: "12",
  iliToFeaHazWidth: "6",
  iliToFeaWeldMismatch: "",
  iliToFeaPressureRange: "1.5",
  iliToFeaCyclesPerYear: "1000",
  iliToFeaAppliedCycles: "10000",
  iliToFeaBendingStrain: "0.2",
  iliToFeaInteractionDistance: "500",
  iliToFeaSizingCase: "conservative",
  iliToFeaMeshRefinement: "standard",
  iliToFeaSolver: "implicit_riks",
  iliToFeaScreeningMethod: "modified_b31g",
  iliToFeaClassLocation: "2",
  iliToFeaSurrogateModel: "ann",
  iliToFeaReliabilitySamples: "2500",
  iliToFeaDepthCov: "0.10",
  iliToFeaPressureCov: "0.03",
  iliToFeaModelErrorCov: "0.08",
  iliToFeaStrainLimit: "0.06",
  iliToFeaErrorBox: "",
  iliToFeaAssessmentBox: "",
  iliToFeaStatus: "",
  iliToFeaDisposition: "",
  iliToFeaFeatureCount: "",
  iliToFeaModelCount: "",
  iliToFeaMaximumMop: "",
  iliToFeaUtilization: "",
  iliToFeaGoverningSource: "",
  iliToFeaFailureMode: "",
  iliToFeaFatigueLife: "",
  iliToFeaCriticalFeature: "",
  iliToFeaRawSamples: "",
  iliToFeaRawMesh: "",
  iliToFeaCrackVoids: "",
  iliToFeaMeshDensity: "",
  iliToFeaSurrogateOutput: "",
  iliToFeaProbabilityFailure: "",
  iliToFeaReliabilityIndex: "",
  iliToFeaMaximumStrain: "",
  iliToFeaStrainAcceptance: "",
  iliToFeaWeldFeatureCount: "",
  iliToFeaReset3dButton: "",
  iliToFea3dVisualization: "",
  iliToFeaVisualization: "",
  iliToFeaFeatureTable: "",
  iliToFeaModelTable: "",
  ecaReportButton: "",
  calculateAnnexKButton: "",
  ecaDiameter: "508",
  ecaWallThickness: "12.7",
  ecaSmys: "483",
  ecaWeldYield: "520",
  ecaBaseYield: "505",
  ecaElasticModulus: "200000",
  ecaPoisson: "0.3",
  ecaThermalCoeff: "0.0000117",
  ecaKmat: "95",
  ecaPressure: "9.93",
  ecaDeltaT: "45",
  ecaBendingMoment: "120",
  ecaMisalignment: "1.5",
  ecaFlawHeight: "2",
  ecaFlawLength: "25",
  ecaHeightAllowance: "0.5",
  ecaLengthAllowance: "2",
  ecaServiceType: "liquid",
  ecaLongitudinalStrain: "0",
  ecaResidualFactor: "0.6",
  ecaErrorBox: "",
  ecaAssessmentBox: "",
  ecaStatus: "",
  ecaDisposition: "",
  ecaEffectiveHeight: "",
  ecaEffectiveLength: "",
  ecaScf: "",
  ecaHoopStress: "",
  ecaAxialStress: "",
  ecaMismatch: "",
  ecaLr: "",
  ecaKr: "",
  ecaFadBoundary: "",
  ecaAssessmentLevel: "",
  ecaGatewayChecks: "",
  dentReportButton: "",
  calculateDentButton: "",
  dentOd: "24",
  dentWallThickness: "0.5",
  dentCircRadius: "-15",
  dentLongRadius: "-10",
  dentDepth: "3",
  dentLength: "14",
  dentMeasurementError: "0.1",
  dentStrainLimit: "0.06",
  dentSimulationCount: "100000",
  dentSeed: "8675309",
  dentErrorBox: "",
  dentAssessmentBox: "",
  dentStatus: "",
  dentDisposition: "",
  dentMeanStrain: "",
  dentStdStrain: "",
  dentP95Strain: "",
  dentProbability: "",
  dentDepthPercent: "",
  dentExceedCount: "",
  dentFrameworkNotes: "",
  dentChartSummary: "",
  dentDistributionChart: "",
  b31gReportButton: "",
  calculateB31gButton: "",
  b31gDiameter: "406.4",
  b31gWallThickness: "7.14",
  b31gMaop: "7",
  b31gSmys: "359",
  b31gSmts: "455",
  b31gAssessmentFactor: "0.72",
  b31gDepth: "2.5",
  b31gLength: "50",
  b31gCapFlow: "yes",
  b31gErrorBox: "",
  b31gAssessmentBox: "",
  b31gStatus: "",
  b31gDisposition: "",
  b31gFailurePressure: "",
  b31gAllowablePressure: "",
  b31gPressureRatio: "",
  b31gFolias: "",
  b31gZ: "",
  b31gFlowStress: "",
  b31gFailureStress: "",
  b31gDepthRatio: "",
  b31gFoliasEquation: "",
  rstrengReportButton: "",
  calculateRstrengButton: "",
  rstrengDiameter: "406.4",
  rstrengWallThickness: "7.14",
  rstrengMaop: "7",
  rstrengSmys: "359",
  rstrengSmts: "455",
  rstrengAssessmentFactor: "0.72",
  rstrengCapFlow: "yes",
  rstrengStations: "0, 25, 50, 75, 100, 125, 150",
  rstrengDepths: "0.6, 2.4, 3.8, 4.1, 3.0, 1.4, 0.5",
  rstrengProfileSummary: "",
  rstrengProfileChart: "",
  rstrengErrorBox: "",
  rstrengAssessmentBox: "",
  rstrengStatus: "",
  rstrengDisposition: "",
  rstrengFailurePressure: "",
  rstrengAllowablePressure: "",
  rstrengPressureRatio: "",
  rstrengSegment: "",
  rstrengEffectiveArea: "",
  rstrengAreaRatio: "",
  rstrengMaxDepthRatio: "",
  rstrengAverageDepth: "",
  rstrengFolias: "",
  rstrengZ: "",
  rstrengFlowStress: "",
  rstrengFailureStress: "",
  calculatePrciDentButton: "",
  prciDentDepth: "3",
  prciDentOd: "406.4",
  prciDentWallThickness: "12.5",
  prciDentPressure: "10",
  prciDentSmys: "359",
  prciDentRadius: "3",
  prciDentCycles: "10",
  prciDentScf: "0.5",
  prciDentCrackGrowthEnabled: "yes",
  prciDentInitialCrack: "1",
  prciDentCriticalCrack: "6",
  prciDentStressRange: "80",
  prciDentParisC: "0.000000000001",
  prciDentParisM: "3",
  prciDentCrackIncrement: "0.001",
  prciDentErrorBox: "",
  prciDentAssessmentBox: "",
  prciDentStatus: "",
  prciDentResult: "",
  prciDentDepthPercent: "",
  prciDentHoopStress: "",
  prciDentBendingStrain: "",
  prciDentEquivalentStress: "",
  prciDentFatigueLife: "",
  prciDentRsf: "",
  prciDentCrackGrowthLife: "",
  prciDentCrackGrowthStatus: "",
  prciDentCriteriaList: "",
  interactionReportButton: "",
  calculateInteractionButton: "",
  interactionOd: "762",
  interactionWallThickness: "9.5",
  interactionMaop: "6.9",
  interactionSmys: "448",
  interactionSmts: "535",
  interactionElasticModulus: "207000",
  interactionToughness: "95",
  interactionLengthFactor: "8",
  interactionSecondaryStress: "0",
  interactionResidualStress: "0.2",
  interactionPressureRange: "1.5",
  interactionParisC: "0.000000000001",
  interactionParisM: "3",
  interactionA1Type: "metal_loss",
  interactionA1Surface: "external",
  interactionA1X: "-120",
  interactionA1Theta: "20",
  interactionA1Length: "180",
  interactionA1Width: "90",
  interactionA1Depth: "3.5",
  interactionA1Orientation: "0",
  interactionA2Type: "crack",
  interactionA2Surface: "external",
  interactionA2X: "70",
  interactionA2Theta: "35",
  interactionA2Length: "120",
  interactionA2Width: "45",
  interactionA2Depth: "2.5",
  interactionA2Orientation: "0",
  interactionSizingCase: "nominal",
  interactionDepthTolerance: "0.5",
  interactionLengthTolerance: "10",
  interactionWidthTolerance: "10",
  interactionMeshRefinement: "standard",
  interactionSolverStrategy: "implicit_riks",
  interactionErrorBox: "",
  interactionAssessmentBox: "",
  interactionStatus: "",
  interactionDisposition: "",
  interactionFactor: "",
  interactionClass: "",
  interactionCombinedPressure: "",
  interactionWeakestPressure: "",
  interactionSafetyFactor: "",
  interactionSafetyCategory: "",
  interactionAxialSpacing: "",
  interactionCircSpacing: "",
  interactionLambdaX: "",
  interactionLambdaTheta: "",
  interactionMaxStrain: "",
  interactionKMax: "",
  interactionRemainingCycles: "",
  interactionCriticalLocation: "",
  interactionModelLength: "",
  interactionElementCount: "",
  interactionBoundaryList: "",
  interactionVisualization: "",
  meshBoundaryVisualization: "",
  passFailBox: "",
  passFailStatus: "",
  passFailDetail: "",
  axleCountLabel: "",
  schematicTitle: "",
  schematicHelp: "",
  schematicControls: "",
  tireWidthLabel: "",
  soilProfileSummary: "",
  strainSummary: "",
  savedAssessmentSelect: "",
  saveAssessmentButton: "",
  loadAssessmentButton: "",
  deleteAssessmentButton: "",
  logoutButton: "",
  currentUser: "",
  tirePressureField: "",
  adminPanel: "",
  adminMessage: "",
  adminUserTableBody: "",
  adminUserName: "admin",
  adminPassword: "admin",
  adminTargetUser: "user",
  adminTargetFullName: "Default User",
  adminTargetEmail: "user@example.com",
  adminTargetPassword: "",
  adminAccountExpiresAt: "",
  adminTargetRole: "user",
  adminSaveUserButton: "",
  adminDeleteUserButton: "",
  showPasswordPanelButton: "",
  passwordPanel: "",
  passwordMessage: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  changePasswordButton: "",
  hidePasswordPanelButton: "",
};

const elements = new Map();
let axleInputElements = [];
let tirePressureInputElements = [];
let tireWidthInputElements = [];
let contactAreaInputElements = [];
let axleWidthInputElements = [];
let axleSpacingInputElements = [];
let trackLengthInputElements = [];
let fetchPayload = undefined;

function makeElement(id, value) {
  const element = {
    id,
    value,
    disabled: false,
    hidden: false,
    textContent: "",
    _innerHTML: "",
    dataset: {},
    options: [],
    classList: {
      values: new Set(),
      add(className) {
        this.values.add(className);
      },
      remove(className) {
        this.values.delete(className);
      },
      toggle(className, force) {
        const shouldAdd = force === undefined ? !this.values.has(className) : Boolean(force);
        if (shouldAdd) {
          this.values.add(className);
        } else {
          this.values.delete(className);
        }
        return shouldAdd;
      },
      contains(className) {
        return this.values.has(className);
      },
    },
    get innerHTML() {
      return this._innerHTML;
    },
    set innerHTML(value) {
      this._innerHTML = value;
      if (id === "savedAssessmentSelect") {
        this.options = [];
      }
    },
    add(option) {
      this.options.push(option);
      if (!this.value) {
        this.value = option.value;
      }
    },
    addEventListener(event, handler) {
      this[`on${event}`] = handler;
    },
    click() {
      globalThis.lastDownloadHref = this.href;
      globalThis.lastDownloadFilename = this.download;
    },
    removeAttribute(name) {
      delete this[name];
    },
    querySelectorAll(selector) {
      if (selector !== "li") {
        return [];
      }
      return Array.from(this._innerHTML.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map((match) => ({
        textContent: match[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      }));
    },
  };
  return element;
}

for (const [id, value] of Object.entries(defaults)) {
  elements.set(id, makeElement(id, value));
}
elements.get("moduleSelector").hidden = true;
elements.get("adminPage").hidden = true;
elements.get("pipelinePage").hidden = true;
elements.get("corlasPage").hidden = true;
elements.get("sccColonyPage").hidden = true;
elements.get("crackGrowthPage").hidden = true;
elements.get("iliScreeningPage").hidden = true;
elements.get("iliToFeaPage").hidden = true;
elements.get("annexKPage").hidden = true;
elements.get("dentPage").hidden = true;
elements.get("b31gPage").hidden = true;
elements.get("rstrengPage").hidden = true;
elements.get("prciDentPage").hidden = true;
elements.get("interactionPage").hidden = true;

globalThis.document = {
  addEventListener(event, handler) {
    this[`on${event}`] = handler;
  },
  getElementById(id) {
    if (id === "reportPrintFrame") {
      return globalThis.reportPrintFrame || null;
    }
    if (id === "reportDialogOverlay" && !elements.has(id)) {
      return null;
    }
    if (!elements.has(id)) {
      throw new Error(`Missing test element ${id}`);
    }
    return elements.get(id);
  },
  createElement(tagName) {
    if (tagName !== "iframe") {
      throw new Error(`Unexpected created element ${tagName}`);
    }
    const frame = {
      id: "",
      className: "",
      attributes: {},
      contentDocument: {
        html: "",
        open() {
          this.html = "";
        },
        write(html) {
          this.html += html;
          globalThis.lastReportHtml = html;
        },
        close() {
          if (typeof frame.onload === "function") {
            frame.onload();
          }
        },
      },
      contentWindow: {
        focus() {
          frame.focused = true;
        },
        print() {
          frame.printed = true;
          globalThis.reportPrinted = true;
        },
      },
      setAttribute(name, value) {
        this.attributes[name] = value;
      },
      remove() {
        globalThis.reportPrintFrame = null;
      },
    };
    return frame;
  },
  body: {
    classList: {
      values: new Set(["auth-locked"]),
      add(className) {
        this.values.add(className);
      },
      remove(className) {
        this.values.delete(className);
      },
      contains(className) {
        return this.values.has(className);
      },
    },
    appendChild(element) {
      globalThis.reportPrintFrame = element;
      return element;
    },
    insertAdjacentHTML(_position, html) {
      globalThis.lastInsertedHtml = html;
      for (const match of html.matchAll(/id="([^"]+)"/g)) {
        if (!elements.has(match[1])) {
          elements.set(match[1], makeElement(match[1], ""));
        }
      }
    },
  },
  querySelectorAll(selector) {
    if (
      selector !== ".axle-load-input" &&
      selector !== ".tire-pressure-input" &&
      selector !== ".tire-width-input" &&
      selector !== ".contact-area-input" &&
      selector !== ".axle-width-input" &&
      selector !== ".axle-spacing-input" &&
      selector !== ".track-length-input"
    ) {
      return [];
    }
    const schematic = elements.get("vehicleSchematic").innerHTML;
    const className = selector.slice(1);
    const pattern = new RegExp(`class="${className}" data-axle="(\\d+)".*?value="([^"]+)"`, "gs");
    const values = Array.from(schematic.matchAll(pattern));
    const found = values.map((match) => ({
      value: match[2],
      dataset: { axle: match[1] },
      addEventListener() {},
    }));
    if (selector === ".axle-load-input") {
      axleInputElements = found;
      return axleInputElements;
    }
    if (selector === ".tire-pressure-input") {
      tirePressureInputElements = found;
      return tirePressureInputElements;
    }
    if (selector === ".tire-width-input") {
      tireWidthInputElements = found;
      return tireWidthInputElements;
    }
    if (selector === ".contact-area-input") {
      contactAreaInputElements = found;
      return contactAreaInputElements;
    }
    if (selector === ".axle-width-input") {
      axleWidthInputElements = found;
      return axleWidthInputElements;
    }
    if (selector === ".axle-spacing-input") {
      axleSpacingInputElements = found;
      return axleSpacingInputElements;
    }
    trackLengthInputElements = found;
    return trackLengthInputElements;
  },
};

function makeStorage() {
  return {
  data: new Map(),
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  },
  setItem(key, value) {
    this.data.set(key, value);
  },
  removeItem(key) {
    this.data.delete(key);
  },
  };
}

globalThis.localStorage = makeStorage();
globalThis.sessionStorage = makeStorage();
globalThis.Option = function Option(text, value) {
  return { text, value };
};
globalThis.window = {
  location: { href: "http://127.0.0.1:8765/" },
  confirm(message) {
    globalThis.lastConfirmMessage = message;
    return true;
  },
  open() {
    const popup = {
      html: "",
      document: {
        open() {
          popup.html = "";
        },
        write(html) {
          popup.html += html;
          globalThis.lastPopupHtml = popup.html;
        },
        close() {
          popup.closed = true;
        },
      },
      focus() {
        popup.focused = true;
      },
    };
    globalThis.lastPopup = popup;
    return popup;
  },
  setTimeout(callback) {
    callback();
  },
};

globalThis.fetch = async (url, options) => {
  const body = options?.body ? JSON.parse(options.body) : {};
  if (url === "/api/login") {
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          user: {
            username: body.username,
            role: body.username === "admin" ? "admin" : "user",
            account_expires_at: "",
            password_expires_at: "2026-09-22",
          },
          session_id: `${body.username}-session`,
        };
      },
    };
  }
  if (url === "/api/session-restore") {
    return {
      ok: body.session_id === `${body.username}-session`,
      async json() {
        if (body.session_id !== `${body.username}-session`) {
          return { ok: false, error: "Stored login session is no longer active." };
        }
        return {
          ok: true,
          user: {
            username: body.username,
            role: body.username === "admin" ? "admin" : "user",
            account_expires_at: "",
            password_expires_at: "2026-09-22",
          },
          session_id: body.session_id,
        };
      },
    };
  }
  if (url === "/api/session-activity") {
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          user: {
            username: body.username,
            role: body.username === "admin" ? "admin" : "user",
            session_count: 1,
            total_session_seconds: body.elapsed_seconds || 0,
            modules_used: body.module ? [body.module] : [],
          },
        };
      },
    };
  }
  if (url === "/api/change-password") {
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          user: {
            username: body.username,
            role: body.username === "admin" ? "admin" : "user",
            account_expires_at: "",
            password_expires_at: "2026-09-22",
          },
        };
      },
    };
  }
  if (url === "/api/admin/config") {
    return {
      async json() {
        return {
          ok: true,
          users: [
            {
              username: "admin",
              role: "admin",
              full_name: "Administrator",
              account_expires_at: "",
              password_expires_at: "2026-09-22",
              session_count: 2,
              total_session_seconds: 7200,
              modules_used: ["Backend User Management", "Pipeline Crossing Assessment"],
            },
            {
              username: "user",
              role: "user",
              full_name: "Default User",
              email: "user@example.com",
              account_expires_at: "",
              password_expires_at: "2026-09-22",
              session_count: 3,
              total_session_seconds: 5400,
              modules_used: ["Pipeline Crossing Assessment"],
            },
          ],
          config: {
            method_name: "CEPA vehicle crossing methodology",
            fatigue_constant: 1000000000000000,
            fatigue_exponent: 3,
            notes: "Method notes",
          },
        };
      },
    };
  }
  if (url === "/api/admin/user" || url === "/api/admin/method") {
    return {
      async json() {
        return {
          ok: true,
          users: [
            { username: "admin", role: "admin", account_expires_at: "", password_expires_at: "2026-09-22" },
            {
              username: "user",
              role: "user",
              full_name: body.full_name || "Default User",
              email: body.email || "user@example.com",
              account_expires_at: "",
              password_expires_at: "2026-09-22",
            },
          ],
          config: { fatigue_constant: 1000000000000000, fatigue_exponent: 3 },
        };
      },
    };
  }
  if (url === "/api/admin/delete-user") {
    return {
      async json() {
        return {
          ok: true,
          users: [{ username: "admin", role: "admin", account_expires_at: "", password_expires_at: "2026-09-22" }],
        };
      },
    };
  }
  if (url === "/api/report") {
    return {
      ok: true,
      async blob() {
        return new Blob(["%PDF-1.4\nPipeline Crossing Assessment Report\nPASS\n%%EOF"], { type: "application/pdf" });
      },
    };
  }
  if (url === "/api/report-link") {
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          url: "/api/report-download/untitled-assessment-abc123-report.pdf",
          filename: "untitled-assessment-report.pdf",
          bytes: 4025,
        };
      },
    };
  }
  if (url === "/api/corlas-calculate") {
    fetchPayload = body;
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            outputs: {
              fracture_pressure_mpa: 13.52,
              collapse_pressure_mpa: 13.7878,
              failure_pressure_mpa: 13.52,
              fracture_pressure_psi: 1960.9,
              collapse_pressure_psi: 1999.7,
              failure_pressure_psi: 1960.9,
              controlling_mode: "Fracture",
              stopped_by: "fracture",
              iterations: 1352,
            },
            intermediate: {
              total_j: 225.0186,
              elastic_j: 9.0052,
              plastic_j: 216.0134,
              flow_stress_mpa: 404.5,
              folias_factor_m: 1.3635,
              qf: 1.1296,
              fsf: 1.126,
              strain_hardening_n: 0.089967,
              local_stress_mpa: 401.089,
              plastic_strain: 0.011198,
              shih_hutchinson_f3: 13.0399,
            },
          },
        };
      },
    };
  }
  if (url === "/api/scc-colony-calculate") {
    fetchPayload = body;
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            outputs: {
              status: "ACCEPTABLE",
              disposition: "MAOP is less than or equal to the factored SCC colony failure pressure.",
              colony_class: "Moderate interaction",
              crack_count: 4,
              interaction_factor: 1.24,
              equivalent_depth_mm: 2.98,
              equivalent_length_mm: 87,
              depth_ratio: 0.314,
              folias_factor: 1.52,
              failure_pressure_mpa: 9.8,
              allowable_pressure_mpa: 7.06,
              maop_to_allowable_ratio: 0.978,
              kr_at_maop: 0.73,
              collapse_pressure_mpa: 12.4,
              fracture_pressure_mpa: 9.8,
              remaining_cycles: 2450000,
              crack_growth_status: "Estimated",
            },
          },
        };
      },
    };
  }
  if (url === "/api/crack-growth-calculate") {
    fetchPayload = body;
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            outputs: {
              status: "PASS",
              disposition: "Applied cycles are within the factored Paris-law crack-growth life.",
              estimated_cycles: 1364659.98,
              factored_cycles: 1364659.98,
              applied_cycles: 100000,
              remaining_cycles: 1264659.98,
              damage_ratio: 0.0733,
              initial_delta_k_mpa_sqrt_m: 5.02,
              critical_delta_k_mpa_sqrt_m: 12.31,
              initial_growth_rate_mm_per_cycle: 1.26e-10,
              critical_growth_rate_mm_per_cycle: 1.87e-9,
              integration_steps: 5000,
            },
          },
        };
      },
    };
  }
  if (url === "/api/ili-screening-calculate") {
    fetchPayload = body;
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            outputs: {
              status: "ACTION REQUIRED",
              disposition: "1 feature(s) require immediate action, 1 high-priority review, 1 monitoring, and 1 acceptable.",
              feature_count: 4,
              immediate_count: 1,
              high_count: 1,
              monitor_count: 1,
              acceptable_count: 1,
              most_conservative_method: "CorLAS crack-like flaw",
              highest_risk_feature: "F-104",
              predicted_failure_count: 1,
              risk_class: "High",
              ranked_features: [
                {
                  rank: 1,
                  feature_id: "F-104",
                  feature_type: "metal_loss",
                  distance_m: 1315.6,
                  clock_position: "4:30",
                  depth_percent: 64,
                  length_mm: 180,
                  conservative_method: "CorLAS crack-like flaw",
                  calculation_method: "CorLAS crack-like flaw",
                  calculation_method_key: "corlas",
                  method_results: [
                    { method: "modified_b31g", label: "Modified B31.G", maop_to_allowable_ratio: 1.35 },
                    { method: "corlas", label: "CorLAS crack-like flaw", maop_to_allowable_ratio: 1.41 },
                  ],
                  maop_to_allowable_ratio: 1.41,
                  fatigue_life_years: 3.4,
                  predicted_failure_years: 2,
                  risk_class: "High",
                  priority: "Immediate action",
                  recommended_action: "Repair, replace, pressure-reduce, or complete detailed assessment before continued operation.",
                },
                {
                  rank: 2,
                  feature_id: "F-102",
                  feature_type: "crack",
                  distance_m: 1258.8,
                  clock_position: "6:00",
                  depth_percent: 58,
                  length_mm: 45,
                  conservative_method: "Crack/SCC fracture screen",
                  calculation_method: "Crack/SCC fracture screen",
                  calculation_method_key: "crack_fracture",
                  method_results: [
                    { method: "corlas", label: "CorLAS crack-like flaw", maop_to_allowable_ratio: 1.1 },
                    { method: "crack_fracture", label: "Crack/SCC fracture screen", maop_to_allowable_ratio: 1.18 },
                  ],
                  maop_to_allowable_ratio: 1.18,
                  fatigue_life_years: 8.9,
                  predicted_failure_years: null,
                  risk_class: "Medium",
                  priority: "High priority",
                  recommended_action: "Schedule engineering review and confirm sizing, interaction, and excavation priority.",
                },
              ],
            },
          },
        };
      },
    };
  }
  if (url === "/api/ili-to-fea-calculate") {
    fetchPayload = body;
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            translated_features: [
              {
                id: "F-101",
                type: "metal_loss",
                axial_location_mm: 0,
                clock_position: "3:00",
                clock_position_deg: 90,
                depth_mm: 3.99,
                depth_percent: 42,
                length_mm: 110,
                width_mm: 70,
                geometry_source: "raw_tool_data",
                effective_geometry: { minimum_remaining_ligament_mm: 5.51 },
                surface: "external",
              },
              {
                id: "F-102",
                type: "crack",
                axial_location_mm: 200,
                clock_position: "3:30",
                clock_position_deg: 105,
                depth_mm: 5.51,
                depth_percent: 58,
                length_mm: 45,
                width_mm: 20,
                geometry_source: "raw_tool_data",
                effective_geometry: { minimum_remaining_ligament_mm: 3.99 },
                surface: "external",
              },
            ],
            fea_models: [
              {
                model_id: "FEA-F-101-F-102",
                feature_ids: ["F-101", "F-102"],
                interaction_classification: "Strong",
                interaction_factor: 1.31,
                combined_failure_pressure_mpa: 8.4,
                maximum_mop_mpa: 6.048,
                fatigue_life_years: 14.2,
                governing_failure_mode: "Fracture / crack driving force",
                mesh: { estimated_solid_elements: 48200, refinement: "standard" },
              },
            ],
            raw_mesh: {
              mfl_samples: [{ feature_id: "F-101", axial_offset_mm: 0, circumferential_offset_mm: 0, depth_percent: 42 }],
              crack_samples: [{ feature_id: "F-102", axial_offset_mm: 0, circumferential_offset_mm: 0, depth_mm: 5.51, opening_mm: 0.4 }],
              caliper_samples: [{ feature_id: "F-103", axial_offset_mm: 0, circumferential_offset_mm: 0, radial_deformation_mm: -1.7 }],
              node_count: 684,
              element_count: 1265,
            },
            workflow: [
              { stage: 1, name: "FEA automated reconstruction", status: "Complete" },
              { stage: 2, name: "Adaptive FEA automation", status: "Model ready" },
            ],
            surrogate: {
              selected_model: "ANN (4-8-1)",
              validation: {
                benchmark_case_count: 29,
                r_squared: 0.9977,
                mae_normalized_pressure: 0.006,
                mape_percent: 1.2,
                maximum_absolute_error_percent: 3.1,
                benchmark_scope: "Published benchmark reproduction.",
                published_ann_unseen_r_squared: 0.9921,
                published_fea_burst_validation_max_difference_percent: 3.67,
              },
            },
            outputs: {
              status: "ACTION REQUIRED",
              feature_count: 3,
              interaction_model_count: 1,
              maximum_mop_mpa: 6.048,
              current_maop_mpa: 6.9,
              mop_utilization: 1.141,
              governing_source: "FEA-F-101-F-102",
              governing_failure_mode: "Fracture / crack driving force",
              minimum_fatigue_life_years: 14.2,
              critical_feature: "F-102",
              raw_sample_count: 3,
              raw_mesh_nodes: 684,
              raw_mesh_elements: 1265,
              removed_crack_elements: 12,
              mesh_density_ratio: 18.2,
              surrogate_model: "ANN (4-8-1)",
              surrogate_minimum_mop_mpa: 6.2,
              reliability_enabled: true,
              probability_of_failure: 0.002,
              reliability_index_beta: 2.878,
              maximum_strain_percent: 2.1,
              b31_8_strain_status: "ACCEPTABLE",
              api_rp_1183_status: "DETAILED ASSESSMENT REQUIRED",
              weld_feature_count: 1,
              disposition: "3 ILI features translated into model geometry and 1 interaction model. Maximum recommended MOP is 6.048 MPa.",
            },
          },
        };
      },
    };
  }
  if (url === "/api/annex-k-eca-calculate") {
    fetchPayload = body;
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            outputs: {
              status: "REJECT - FRACTURE BOUNDARY EXCEEDED",
              disposition: "Repair Required",
              assessment_level: "Level 2 - Elastic-plastic FAD",
              gateway_issues: [],
              effective_flaw_height_mm: 2.5,
              effective_flaw_length_mm: 27,
              scf: 1.3895,
              hoop_stress_mpa: 198.6,
              restrained_axial_stress_mpa: 421.2,
              strength_mismatch_ratio: 1.03,
              load_ratio_lr: 1.16,
              fracture_ratio_kr: 1.42,
              fad_boundary: 0.49,
            },
          },
        };
      },
    };
  }
  if (url === "/api/dent-assessment-calculate") {
    fetchPayload = body;
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            outputs: {
              mean_peak_strain: 0.0457,
              std_dev_strain: 0.0047,
              p95_strain: 0.0546,
              probability_exceedance: 0.0141,
              status: "ACCEPTABLE",
              disposition: "Acceptable",
              depth_percent_od: 0.125,
              exceed_count: 1411,
              framework_notes: ["Dent depth exceeds 6% OD screening threshold; advanced FFS review recommended."],
              distribution: [
                { peak_strain: 0.036, cumulative_probability: 0 },
                { peak_strain: 0.041, cumulative_probability: 0.25 },
                { peak_strain: 0.044, cumulative_probability: 0.5 },
                { peak_strain: 0.050, cumulative_probability: 0.75 },
                { peak_strain: 0.0546, cumulative_probability: 0.95 },
                { peak_strain: 0.062, cumulative_probability: 1 },
              ],
            },
            inputs: { strain_limit: 0.06 },
          },
        };
      },
    };
  }
  if (url === "/api/modified-b31g-calculate") {
    fetchPayload = body;
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            outputs: {
              status: "PASS",
              disposition: "MAOP is less than or equal to the factored Modified B31G pressure.",
              depth_ratio: 0.35,
              z_parameter: 49.0,
              folias_factor: 2.7,
              folias_equation: "sqrt(1 + 0.6275z - 0.003375z^2), z <= 50",
              flow_stress_mpa: 428,
              failure_stress_mpa: 330,
              failure_pressure_mpa: 11.6,
              allowable_pressure_mpa: 8.35,
              maop_to_allowable_ratio: 0.84,
            },
          },
        };
      },
    };
  }
  if (url === "/api/rstreng-calculate") {
    fetchPayload = body;
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            inputs: {
              wall_thickness_mm: 7.14,
            },
            outputs: {
              status: "PASS",
              disposition: "MAOP is less than or equal to the factored RSTRENG effective-area pressure.",
              flow_stress_mpa: 428,
              allowable_pressure_mpa: 8.12,
              maop_to_allowable_ratio: 0.862,
              controlling_segment: {
                start_station_mm: 25,
                end_station_mm: 125,
                length_mm: 100,
                effective_area_mm2: 311.25,
                area_ratio: 0.436,
                average_depth_mm: 3.1125,
                max_depth_mm: 4.1,
                folias_factor: 2.62,
                z_parameter: 34.42,
                failure_stress_mpa: 310.4,
                failure_pressure_mpa: 11.28,
              },
            },
          },
        };
      },
    };
  }
  if (url === "/api/prci-level2-dent-calculate") {
    fetchPayload = body;
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            outputs: {
              status: "REPAIR REQUIRED",
              assessment_result: "EXCESSIVE STRAIN - REPAIR REQUIRED",
              dent_depth_percent: 0.7381889763779528,
              hoop_stress_mpa: 162.56,
              bending_strain: 2.0833333333333335,
              equivalent_stress_mpa: 81.28,
              fatigue_life_cycles: 1364.6599861837378,
              remaining_strength_factor: 4.416830708661418,
              criteria: [
                {
                  label: "Bending strain",
                  status: "FAIL",
                  message: "Calculated bending strain 2.083 is greater than the 0.06 Level 2 strain limit; repair is required.",
                },
                {
                  label: "Remaining strength factor",
                  status: "PASS",
                  message: "Remaining strength factor 4.42 is at or above the 1.10 screening limit.",
                },
              ],
              crack_growth: {
                enabled: true,
                estimated_cycles: 250000,
                status: "PASS",
              },
            },
          },
        };
      },
    };
  }
  if (url === "/api/interacting-anomalies-calculate") {
    fetchPayload = body;
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            anomalies: [
              {
                id: "A1",
                type: "metal_loss",
                surface: "external",
                axial_location_mm: -120,
                clock_position_deg: 20,
                length_mm: 180,
                width_mm: 90,
                depth_mm: 3.5,
                orientation_deg: 0,
                failure_pressure_mpa: 12.2,
              },
              {
                id: "A2",
                type: "crack",
                surface: "external",
                axial_location_mm: 70,
                clock_position_deg: 35,
                length_mm: 120,
                width_mm: 45,
                depth_mm: 2.5,
                orientation_deg: 0,
                failure_pressure_mpa: 10.1,
              },
            ],
            outputs: {
              status: "MARGINAL",
              interaction_factor: 1.18,
              interaction_classification: "Moderate",
              interaction_response: "Evaluate as an interacting cluster for reassessment and monitoring.",
              weakest_isolated_failure_pressure_mpa: 10.1,
              combined_failure_pressure_mpa: 8.35,
              safety_factor: 1.21,
              safety_category: "Critical",
              recommended_response: "Consider pressure reduction or repair planning.",
              axial_edge_spacing_mm: 40,
              circumferential_edge_spacing_mm: 65,
              lambda_x: 0.47,
              lambda_theta: 0.76,
              max_equivalent_plastic_strain: 0.061,
              k_max_mpa_sqrt_m: 44.5,
              remaining_cycles: 1234567,
              governing_failure_mode: "Fracture / crack driving force",
              critical_location: "A2",
            },
            mesh: {
              model_length_mm: 6096,
              remote_element_size_mm: 42.3,
              local_element_size_mm: 3.2,
              through_ligament_elements: 7,
              estimated_solid_elements: 245000,
              refinement: "standard",
              solver_strategy: "implicit_riks",
              boundary_conditions: [
                "Left reference ring constrains rigid-body motion while avoiding local over-constraint.",
                "Internal pressure is applied to pipe ID and internal flaw surfaces.",
              ],
            },
          },
        };
      },
    };
  }
  fetchPayload = body;
  return {
    ok: true,
    async json() {
      return {
        ok: true,
        result: {
          critical_position: { vehicle_position_in: -72, live_pressure_psi: 6.686 },
          zero_pressure: { total_hoop_stress_psi: 6841.9 },
          mop: {
            total_hoop_stress_psi: 27212.4,
            total_hoop_percent_smys: 52.33,
            assessment_stress_psi: 27212.4,
            assessment_percent_smys: 52.33,
            pre_existing_bending_stress_psi: 0,
            pre_existing_bending_strain_microstrain: 0,
            live_hoop_bending_psi: 2784.4,
            soil_hoop_bending_psi: 1388.1,
            pressure_hoop_psi: 23040,
          },
          vehicle: {
            point_load_count: 8,
            average_point_load_lb: 5750,
            contact_pressure_psi: 31.9,
            pipe: {
              class_location: "1",
              design_factor: 0.8,
              hoop_limit_percent_smys: 80,
              hoop_limit_psi: 41600,
            },
          },
        },
      };
    },
  };
};

await import(new URL("../web/app.js", import.meta.url).href);
globalThis.URL.createObjectURL = (blob) => {
  globalThis.lastPdfBlob = blob;
  return "blob:assessment-report";
};
globalThis.URL.revokeObjectURL = (url) => {
  globalThis.lastRevokedUrl = url;
};
await elements.get("loginSubmitButton").onclick();
assert.equal(elements.get("currentUser").textContent, "user");
assert.equal(globalThis.document.body.classList.contains("auth-locked"), false);
assert.equal(elements.get("moduleSelector").hidden, false);
assert.equal(elements.get("adminModuleOption").hidden, true);
const storedUserSession = JSON.parse(globalThis.sessionStorage.getItem("pipelineAssessmentActiveSession.v1"));
assert.equal(storedUserSession.username, "user");
assert.equal(storedUserSession.session_id, "user-session");
globalThis.document.body.classList.add("auth-locked");
elements.get("loginScreen").hidden = false;
elements.get("moduleSelector").hidden = true;
elements.get("currentUser").textContent = "";
await globalThis.window.restorePipelineAssessmentSession();
assert.equal(elements.get("currentUser").textContent, "user");
assert.equal(globalThis.document.body.classList.contains("auth-locked"), false);
assert.equal(elements.get("loginScreen").hidden, true);
assert.equal(elements.get("moduleSelector").hidden, false);
assert.equal(elements.get("statusPill").textContent, "Session restored");
assert.equal(elements.get("pipelinePage").hidden, true);
assert.equal(elements.get("adminPage").hidden, true);
assert.equal(elements.get("corlasPage").hidden, true);
assert.equal(elements.get("annexKPage").hidden, true);
assert.equal(elements.get("dentPage").hidden, true);
assert.equal(elements.get("b31gPage").hidden, true);
assert.equal(elements.get("rstrengPage").hidden, true);
assert.equal(elements.get("prciDentPage").hidden, true);
assert.equal(elements.get("interactionPage").hidden, true);
elements.get("moduleSelect").value = "pipeline";
elements.get("moduleSelect").onchange();
assert.equal(elements.get("pipelinePage").hidden, false);
assert.equal(elements.get("moduleSelectSummary").textContent, "Vehicle crossing hoop stress, fatigue, and mitigation assessment.");
assert.equal(elements.get("corlasPage").hidden, true);
assert.equal(elements.get("annexKPage").hidden, true);
assert.equal(elements.get("dentPage").hidden, true);
await elements.get("calculateButton").onclick();

assert.match(elements.get("totalHoop").textContent, /psi$/);
assert.match(elements.get("smysText").textContent, /% of SMYS$/);
assert.equal(elements.get("pointLoadCount").textContent, "8");
assert.match(elements.get("livePressure").textContent, /psi$/);
assert.equal(elements.get("errorBox").hidden, true);
assert.deepEqual(fetchPayload.vehicle.axle_loads_lb, [9000, 9000, 14000, 14000]);
assert.deepEqual(fetchPayload.vehicle.tire_pressures_psi, [85, 85, 85, 85]);
assert.deepEqual(fetchPayload.vehicle.tire_widths_in, [12, 12, 12, 12]);
assert.deepEqual(fetchPayload.vehicle.contact_areas_in2, [180, 180, 180, 180]);
assert.deepEqual(fetchPayload.vehicle.axle_widths_in, [72, 72, 72, 72]);
assert.deepEqual(fetchPayload.vehicle.axle_spacings_in, [60, 60, 60]);
assert.equal(fetchPayload.vehicle.tire_width_in, 12);
assert.equal(fetchPayload.pipe.class_location, "1");
assert.equal(fetchPayload.pipe.design_factor, 0.8);
assert.equal(fetchPayload.soil.profile, "compacted_bare");
assert.equal(fetchPayload.soil.load_model, "prism");
assert.equal(fetchPayload.soil.friction_angle_deg, 30);
assert.equal(fetchPayload.strain.bending_strain_microstrain, 0);
assert.equal(fetchPayload.fatigue.enabled, false);
assert.equal(fetchPayload.mitigation.type, "none");
assert.equal(elements.get("passFailStatus").textContent, "PASS");
assert.match(elements.get("totalBendingStrain").textContent, /microstrain$/);
assert.equal(elements.get("fatigueStatus").textContent, "Not checked");
assert.equal(elements.get("mitigatedAssessment").textContent, "Not applied");
assert.match(elements.get("passFailBox").className, /pass-fail-pass/);
assert.match(elements.get("passFailDetail").textContent, /Class 1 limit: 80/);
assert.match(elements.get("passFailDetail").textContent, /% of SMYS at MAOP/);
assert.doesNotMatch(elements.get("passFailDetail").textContent, /including pre-existing bending strain/);
elements.get("mitigationType").value = "wooden_bridge";
elements.get("mitigationType").oninput();
assert.equal(elements.get("mitigationLoadFactor").textContent, "0");
assert.match(elements.get("mitigationSummary").textContent, /bypass 100/);
assert.match(elements.get("mitigationSummary").textContent, /self-weight adds/);
assert.match(elements.get("passFailDetail").textContent, /after Wooden [Bb]ridge mitigation/);
assert.match(elements.get("passFailDetail").textContent, /Unmitigated: 52\.33% of SMYS/);
assert.notEqual(elements.get("totalHoop").textContent, "27,212.4 psi");

elements.get("moduleSelect").value = "corlas";
elements.get("moduleSelect").onchange();
assert.equal(elements.get("pipelinePage").hidden, true);
assert.equal(elements.get("corlasPage").hidden, false);
await elements.get("calculateCorlasButton").onclick();
assert.equal(fetchPayload.geometry.outside_diameter_mm, 406.4);
assert.equal(fetchPayload.crack.depth_mm, 2.9);
assert.equal(fetchPayload.material.fracture_toughness_j, 225);
assert.equal(fetchPayload.material.fracture_toughness_method, "manual");
assert.equal(fetchPayload.material.charpy_area_in2, 0.124);
assert.equal(elements.get("corlasStatus").textContent, "13.52 MPa");
assert.equal(elements.get("corlasStatusDetail").textContent, "");
assert.match(elements.get("corlasFailurePressure").textContent, /MPa$/);
assert.match(elements.get("corlasJt").textContent, /225/);
elements.get("backToModulesFromCorlas").onclick();
assert.equal(elements.get("pipelinePage").hidden, true);
assert.equal(elements.get("corlasPage").hidden, true);
elements.get("moduleSelect").value = "sccColony";
elements.get("moduleSelect").onchange();
assert.equal(elements.get("sccColonyPage").hidden, false);
assert.equal(elements.get("corlasPage").hidden, true);
assert.match(elements.get("sccColonyVisualization").innerHTML, /SCC crack colony layout/);
assert.match(elements.get("sccColonyVisualization").innerHTML, />C4</);
assert.match(elements.get("sccColonyVisualSummary").textContent, /colony span 127/);
const initialSccVisual = elements.get("sccColonyVisualization").innerHTML;
elements.get("sccDepths").value = "1.8, 3.1, 2.1, 1.6";
elements.get("sccDepths").oninput();
assert.notEqual(elements.get("sccColonyVisualization").innerHTML, initialSccVisual);
assert.match(elements.get("sccColonyVisualSummary").textContent, /deepest crack 3.1/);
elements.get("sccDepths").value = "1.8, 2.4, 2.1, 1.6";
elements.get("sccDepths").oninput();
await elements.get("calculateSccColonyButton").onclick();
assert.equal(fetchPayload.pipe.outside_diameter_mm, 762);
assert.deepEqual(fetchPayload.colony.depths_mm, [1.8, 2.4, 2.1, 1.6]);
assert.deepEqual(fetchPayload.colony.lengths_mm, [18, 24, 20, 15]);
assert.deepEqual(fetchPayload.colony.axial_spacings_mm, [8, 12, 30]);
assert.equal(fetchPayload.fatigue.pressure_range_mpa, 1.5);
assert.equal(elements.get("sccStatus").textContent, "ACCEPTABLE");
assert.match(elements.get("sccFailurePressure").textContent, /MPa$/);
assert.equal(elements.get("sccColonyClass").textContent, "Moderate interaction");
assert.match(elements.get("sccRemainingCycles").textContent, /cycles$/);
elements.get("backToModulesFromSccColony").onclick();
assert.equal(elements.get("sccColonyPage").hidden, true);
elements.get("moduleSelect").value = "crackGrowth";
elements.get("moduleSelect").onchange();
assert.equal(elements.get("crackGrowthPage").hidden, false);
assert.equal(elements.get("sccColonyPage").hidden, true);
await elements.get("calculateCrackGrowthButton").onclick();
assert.equal(fetchPayload.crack.initial_crack_mm, 1);
assert.equal(fetchPayload.crack.critical_crack_mm, 6);
assert.equal(fetchPayload.loading.stress_range_mpa, 80);
assert.equal(fetchPayload.loading.geometry_factor, 1.12);
assert.equal(fetchPayload.assessment.applied_cycles, 100000);
assert.equal(elements.get("crackGrowthStatus").textContent, "PASS");
assert.match(elements.get("crackGrowthEstimatedCycles").textContent, /cycles$/);
assert.match(elements.get("crackGrowthInitialDeltaK").textContent, /MPa/);
assert.match(elements.get("crackGrowthInitialRate").textContent, /e-/);
elements.get("backToModulesFromCrackGrowth").onclick();
assert.equal(elements.get("crackGrowthPage").hidden, true);
elements.get("iliWorkflowButton").onclick();
assert.equal(elements.get("iliScreeningPage").hidden, false);
assert.equal(elements.get("moduleSelect").value, "iliScreening");
assert.equal(elements.get("crackGrowthPage").hidden, true);
elements.get("iliFeatureFile").files = [
  {
    name: "ili-import.csv",
    async text() {
      return "id,type,depth,length,clock,distance,pressure\nF-201,metal_loss,45,120,2:00,1400.5,0\nF-202,crack,62,55,5:30,1412.0,7.2";
    },
  },
];
await elements.get("iliFeatureFile").onchange({ target: elements.get("iliFeatureFile") });
assert.equal(elements.get("iliFeatureIds").value, "F-201, F-202");
assert.match(elements.get("iliFileStatus").textContent, /Loaded 2 features/);
await elements.get("calculateIliScreeningButton").onclick();
assert.equal(fetchPayload.pipe.outside_diameter_mm, 762);
assert.deepEqual(fetchPayload.features.ids, ["F-201", "F-202"]);
assert.deepEqual(fetchPayload.features.depths_percent, [45, 62]);
assert.equal(fetchPayload.criteria.repair_pressure_ratio, 1);
assert.equal(fetchPayload.criteria.primary_method, "corlas");
assert.deepEqual(fetchPayload.criteria.screening_methods, ["modified_b31g", "asme_b31g", "rstreng_simplified", "corlas"]);
assert.equal(fetchPayload.criteria.fracture_toughness_mpa_sqrt_m, 95);
assert.equal(fetchPayload.fatigue.enabled, true);
assert.equal(fetchPayload.fatigue.bending_strain_percent, 0.2);
assert.equal(fetchPayload.risk.class_location, "2");
assert.equal(elements.get("iliStatus").textContent, "ACTION REQUIRED");
assert.equal(elements.get("iliFeatureCount").textContent, "4");
assert.equal(elements.get("iliConservativeMethod").textContent, "CorLAS crack-like flaw");
assert.equal(elements.get("iliRiskClass").textContent, "High");
assert.match(elements.get("iliRankingTableBody").innerHTML, /F-104/);
assert.match(elements.get("iliRankingTableBody").innerHTML, /Immediate action/);
assert.match(elements.get("iliRankingTableBody").innerHTML, /CorLAS crack-like flaw/);
assert.match(elements.get("iliRankingTableBody").innerHTML, /ili-feature-method-select/);
assert.match(elements.get("iliRankingTableBody").innerHTML, /Modified B31.G/);
assert.match(elements.get("iliRankingTableBody").innerHTML, /RSTRENG simplified/);
assert.match(elements.get("iliRankingTableBody").innerHTML, /SCC crack colony/);
const pendingMethodSelect = {
  value: "rstreng_simplified",
  dataset: { featureId: "F-201" },
  classList: { add(value) { this.value = value; } },
  closest() {
    return this;
  },
};
elements.get("iliRankingTableBody").onchange({ target: pendingMethodSelect });
assert.equal(elements.get("calculateIliScreeningButton").textContent, "Re-run ILI Features");
assert.equal(elements.get("statusPill").textContent, "Method changes pending");
await elements.get("calculateIliScreeningButton").onclick();
assert.equal(fetchPayload.criteria.feature_methods["F-201"], "rstreng_simplified");
assert.equal(elements.get("calculateIliScreeningButton").textContent, "Rank ILI Features");
elements.get("backToModulesFromIliScreening").onclick();
assert.equal(elements.get("iliScreeningPage").hidden, true);
elements.get("moduleSelect").value = "iliToFea";
elements.get("moduleSelect").onchange();
assert.equal(elements.get("iliToFeaPage").hidden, false);
await elements.get("calculateIliToFeaButton").onclick();
assert.equal(fetchPayload.pipe.outside_diameter_mm, 762);
assert.deepEqual(fetchPayload.features.ids, ["F-101", "F-102", "F-103"]);
assert.equal(fetchPayload.model.interaction_distance_mm, 500);
assert.equal(fetchPayload.model.geometry_source, "auto");
assert.equal(fetchPayload.raw_data.mfl_samples[0].feature_id, "F-101");
assert.equal(fetchPayload.raw_data.crack_samples[0].depth_mm, 5.51);
assert.equal(fetchPayload.raw_data.caliper_samples[0].radial_deformation_mm, -1.7);
assert.equal(elements.get("iliToFeaStatus").textContent, "ACTION REQUIRED");
assert.match(elements.get("iliToFeaMaximumMop").textContent, /6.048 MPa/);
assert.match(elements.get("iliToFeaFeatureTable").innerHTML, /F-102/);
assert.match(elements.get("iliToFeaModelTable").innerHTML, /FEA-F-101-F-102/);
assert.match(elements.get("iliToFeaVisualization").innerHTML, /ILI features translated/);
assert.equal(elements.get("iliToFeaRawSamples").textContent, "3");
assert.match(elements.get("iliToFeaRawMesh").textContent, /684 nodes/);
assert.match(elements.get("iliToFeaCrackVoids").textContent, /12 removed elements/);
await elements.get("iliToFeaReportButton").onclick();
assert.equal(elements.get("reportDialogOverlay").hidden, false);
assert.equal(elements.get("reportDialogTitle").textContent, "Report ready");
assert.equal(elements.get("reportDialogDownload").download, "automated-ili-to-fea-defect-assessment-report.pdf");
assert.ok(globalThis.lastPdfBlob.size > 0);
elements.get("backToModulesFromIliToFea").onclick();
assert.equal(elements.get("iliToFeaPage").hidden, true);
elements.get("moduleSelect").value = "annexK";
elements.get("moduleSelect").onchange();
assert.equal(elements.get("annexKPage").hidden, false);
assert.equal(elements.get("sccColonyPage").hidden, true);
assert.equal(elements.get("crackGrowthPage").hidden, true);
assert.equal(elements.get("iliScreeningPage").hidden, true);
assert.equal(elements.get("pipelinePage").hidden, true);
assert.equal(elements.get("dentPage").hidden, true);
await elements.get("calculateAnnexKButton").onclick();
assert.equal(fetchPayload.geometry.outside_diameter_mm, 508);
assert.equal(fetchPayload.material.kmat_mpa_sqrt_m, 95);
assert.equal(fetchPayload.flaw.height_nde_allowance_mm, 0.5);
assert.match(elements.get("ecaStatus").textContent, /REJECT/);
assert.equal(elements.get("ecaEffectiveHeight").textContent, "2.5 mm");
assert.match(elements.get("ecaDisposition").textContent, /Repair Required/);
elements.get("backToModulesFromAnnexK").onclick();
assert.equal(elements.get("annexKPage").hidden, true);
elements.get("moduleSelect").value = "dent";
elements.get("moduleSelect").onchange();
assert.equal(elements.get("dentPage").hidden, false);
assert.equal(elements.get("pipelinePage").hidden, true);
assert.equal(elements.get("corlasPage").hidden, true);
assert.equal(elements.get("annexKPage").hidden, true);
await elements.get("calculateDentButton").onclick();
assert.equal(fetchPayload.pipe.outside_diameter_in, 24);
assert.equal(fetchPayload.dent.circumferential_radius_in, -15);
assert.equal(fetchPayload.simulation.num_simulations, 100000);
assert.equal(elements.get("dentStatus").textContent, "ACCEPTABLE");
assert.equal(elements.get("dentP95Strain").textContent, "5.46%");
assert.match(elements.get("dentProbability").textContent, /1.41/);
assert.match(elements.get("dentFrameworkNotes").textContent, /advanced FFS/);
assert.match(elements.get("dentDistributionChart").innerHTML, /Peak Strain Cumulative Distribution/);
assert.match(elements.get("dentDistributionChart").innerHTML, /Calculated Total Strain/);
assert.match(elements.get("dentDistributionChart").innerHTML, /Probability \(Percentile\)/);
assert.match(elements.get("dentChartSummary").textContent, /P95 5.46/);
elements.get("backToModulesFromDent").onclick();
assert.equal(elements.get("dentPage").hidden, true);
elements.get("moduleSelect").value = "b31g";
elements.get("moduleSelect").onchange();
assert.equal(elements.get("b31gPage").hidden, false);
assert.equal(elements.get("pipelinePage").hidden, true);
await elements.get("calculateB31gButton").onclick();
assert.equal(fetchPayload.pipe.outside_diameter_mm, 406.4);
assert.equal(fetchPayload.defect.depth_mm, 2.5);
assert.equal(fetchPayload.assessment.cap_flow_stress_to_smts, true);
assert.equal(elements.get("b31gStatus").textContent, "PASS");
assert.match(elements.get("b31gFailurePressure").textContent, /MPa$/);
assert.match(elements.get("b31gFoliasEquation").textContent, /z <= 50/);
elements.get("backToModulesFromB31g").onclick();
assert.equal(elements.get("b31gPage").hidden, true);
elements.get("moduleSelect").value = "rstreng";
elements.get("moduleSelect").onchange();
assert.equal(elements.get("rstrengPage").hidden, false);
assert.equal(elements.get("b31gPage").hidden, true);
assert.match(elements.get("rstrengProfileChart").innerHTML, /Corrosion depth profile/);
assert.match(elements.get("rstrengProfileSummary").textContent, /7 points/);
const initialRstrengChart = elements.get("rstrengProfileChart").innerHTML;
elements.get("rstrengDepths").value = "0.6, 2.4, 4.5, 4.1, 3.0, 1.4, 0.5";
elements.get("rstrengDepths").oninput();
assert.notEqual(elements.get("rstrengProfileChart").innerHTML, initialRstrengChart);
assert.match(elements.get("rstrengProfileSummary").textContent, /deepest point 4.5/);
elements.get("rstrengDepths").value = "0.6, 2.4, 3.8, 4.1, 3.0, 1.4, 0.5";
elements.get("rstrengDepths").oninput();
await elements.get("calculateRstrengButton").onclick();
assert.equal(fetchPayload.pipe.outside_diameter_mm, 406.4);
assert.deepEqual(fetchPayload.profile.slice(0, 2), [
  { station_mm: 0, depth_mm: 0.6 },
  { station_mm: 25, depth_mm: 2.4 },
]);
assert.equal(elements.get("rstrengStatus").textContent, "PASS");
assert.match(elements.get("rstrengFailurePressure").textContent, /MPa$/);
assert.equal(elements.get("rstrengSegment").textContent, "25 to 125 mm");
assert.match(elements.get("rstrengAreaRatio").textContent, /43.6/);
assert.match(elements.get("rstrengProfileChart").innerHTML, /governing-segment/);
assert.match(elements.get("rstrengProfileSummary").textContent, /Governing segment: 25 to 125 mm/);
elements.get("backToModulesFromRstreng").onclick();
assert.equal(elements.get("rstrengPage").hidden, true);
elements.get("moduleSelect").value = "prciDent";
elements.get("moduleSelect").onchange();
assert.equal(elements.get("prciDentPage").hidden, false);
assert.equal(elements.get("dentPage").hidden, true);
assert.equal(elements.get("rstrengPage").hidden, true);
await elements.get("calculatePrciDentButton").onclick();
assert.equal(fetchPayload.pipe.outside_diameter_mm, 406.4);
assert.equal(fetchPayload.dent.radius_mm, 3);
assert.equal(fetchPayload.crack_growth.enabled, true);
assert.equal(elements.get("prciDentStatus").textContent, "REPAIR REQUIRED");
assert.equal(elements.get("prciDentBendingStrain").textContent, "2.0833");
assert.match(elements.get("prciDentFatigueLife").textContent, /cycles$/);
assert.match(elements.get("prciDentCriteriaList").innerHTML, /repair is required/);
await elements.get("prciDentReportButton").onclick();
assert.equal(elements.get("reportDialogOverlay").hidden, false);
assert.equal(elements.get("reportDialogTitle").textContent, "Report ready");
assert.equal(elements.get("reportDialogDownload").download, "prci-level-2-dent-assessment-report.pdf");
assert.ok(globalThis.lastPdfBlob.size > 0);
elements.get("backToModulesFromPrciDent").onclick();
assert.equal(elements.get("prciDentPage").hidden, true);
elements.get("moduleSelect").value = "interaction";
elements.get("moduleSelect").onchange();
assert.equal(elements.get("interactionPage").hidden, false);
assert.match(elements.get("interactionVisualization").innerHTML, /Developed pipe surface/);
const liveInteractionVisual = elements.get("interactionVisualization").innerHTML;
elements.get("interactionA2Length").value = "260";
elements.get("interactionA2Length").oninput();
assert.notEqual(elements.get("interactionVisualization").innerHTML, liveInteractionVisual);
assert.match(elements.get("interactionVisualization").innerHTML, /L 260 mm/);
assert.match(elements.get("interactionVisualization").innerHTML, /anomaly-callout/);
assert.match(elements.get("interactionVisualization").innerHTML, /Metal loss extent\/core/);
assert.match(elements.get("interactionVisualization").innerHTML, /Crack length\/orientation/);
await elements.get("calculateInteractionButton").onclick();
assert.equal(fetchPayload.pipe.outside_diameter_mm, 762);
assert.equal(fetchPayload.anomalies[1].type, "crack");
assert.equal(elements.get("interactionStatus").textContent, "MARGINAL");
assert.equal(elements.get("interactionClass").textContent, "Moderate");
assert.match(elements.get("interactionBoundaryList").innerHTML, /Internal pressure/);
assert.match(elements.get("meshBoundaryVisualization").innerHTML, /FEA mesh architecture/);
await elements.get("interactionReportButton").onclick();
assert.equal(elements.get("reportDialogOverlay").hidden, false);
assert.equal(elements.get("reportDialogDownload").download, "interacting-anomalies-fea-model-report.pdf");
elements.get("backToModulesFromInteraction").onclick();
assert.equal(elements.get("interactionPage").hidden, true);
elements.get("moduleSelect").value = "pipeline";
elements.get("moduleSelect").onchange();

await elements.get("reportButton").onclick();
assert.equal(globalThis.lastDownloadFilename, undefined);
assert.equal(globalThis.lastDownloadHref, undefined);
assert.equal(globalThis.lastPopupHtml, undefined);
assert.equal(elements.get("reportDialogOverlay").hidden, false);
assert.equal(elements.get("reportDialogTitle").textContent, "Report ready");
assert.equal(elements.get("reportDialogDownload").href, "http://127.0.0.1:8765/api/report-download/untitled-assessment-abc123-report.pdf");
assert.equal(elements.get("reportDialogDownload").download, "untitled-assessment-report.pdf");
assert.equal(elements.get("reportDownloadLink").hidden, false);
assert.equal(elements.get("statusPill").textContent, "Report ready");

globalThis.lastPdfBlob = undefined;
globalThis.lastDownloadFilename = undefined;
globalThis.lastDownloadHref = undefined;
globalThis.lastRevokedUrl = undefined;
globalThis.lastPopupHtml = undefined;
elements.get("assessmentName").value = "Auto calculate report";
await elements.get("reportButton").onclick();
assert.equal(globalThis.lastDownloadFilename, undefined);
assert.equal(globalThis.lastPopupHtml, undefined);
assert.equal(elements.get("statusPill").textContent, "Report ready");

elements.get("assessmentName").value = "Delete smoke";
elements.get("saveAssessmentButton").onclick();
assert.ok(JSON.parse(globalThis.localStorage.getItem("pipelineCrossingAssessments.v1.user")).modules.pipeline["Delete smoke"]);
elements.get("deleteAssessmentButton").onclick();
assert.match(globalThis.lastConfirmMessage, /Delete saved calculation "Delete smoke"/);
assert.equal(JSON.parse(globalThis.localStorage.getItem("pipelineCrossingAssessments.v1.user")).modules.pipeline["Delete smoke"], undefined);
assert.equal(elements.get("statusPill").textContent, "Deleted");

elements.get("loginUserName").value = "Alice";
elements.get("loginPassword").value = "secret";
await elements.get("loginSubmitButton").onclick();
assert.equal(elements.get("currentUser").textContent, "Alice");
elements.get("moduleSelect").value = "pipeline";
await elements.get("moduleSelect").onchange();
elements.get("assessmentName").value = "Alice assessment";
elements.get("saveAssessmentButton").onclick();
assert.ok(JSON.parse(globalThis.localStorage.getItem("pipelineCrossingAssessments.v1.alice")).modules.pipeline["Alice assessment"]);

elements.get("vehicleType").value = "track";
elements.get("vehicleType").oninput();
assert.equal(elements.get("axleCount").disabled, true);
assert.equal(elements.get("axleCount").value, 1);
assert.equal(elements.get("schematicTitle").textContent, "Track Load Schematic");
assert.equal(elements.get("schematicControls").classList.contains("is-hidden"), true);
assert.equal(globalThis.document.querySelectorAll(".track-length-input").length, 1);
assert.equal(globalThis.document.querySelectorAll(".tire-pressure-input").length, 0);
assert.match(elements.get("vehicleSchematic").innerHTML, /Contact area/);
assert.doesNotMatch(elements.get("vehicleSchematic").innerHTML, /Distance to next axle/);
assert.equal(elements.get("tirePressure").disabled, true);

elements.get("vehiclePreset").value = "dump_truck_3_axle";
elements.get("vehiclePreset").oninput();
assert.equal(elements.get("vehicleType").value, "wheel");
assert.equal(elements.get("schematicControls").classList.contains("is-hidden"), true);
assert.equal(elements.get("axleCount").value, 3);
assert.match(elements.get("vehicleSchematic").innerHTML, /Contact area per tyre/);
assert.match(elements.get("vehicleSchematic").innerHTML, /Axle width/);
assert.match(elements.get("vehicleSchematic").innerHTML, /Distance to next axle/);
assert.deepEqual(globalThis.document.querySelectorAll(".axle-load-input").map((input) => Number(input.value)), [
  16000,
  18750,
  18750,
]);
assert.deepEqual(globalThis.document.querySelectorAll(".axle-spacing-input").map((input) => Number(input.value)), [180, 52]);

elements.get("vehiclePreset").value = "b_train";
elements.get("vehiclePreset").oninput();
assert.equal(elements.get("vehicleType").value, "wheel");
assert.equal(elements.get("axleCount").value, 8);
assert.deepEqual(globalThis.document.querySelectorAll(".axle-spacing-input").map((input) => Number(input.value)), [
  220,
  52,
  220,
  60,
  60,
  220,
  52,
]);

elements.get("vehiclePreset").value = "combine_harvester";
elements.get("vehiclePreset").oninput();
assert.equal(elements.get("vehicleType").value, "wheel");
assert.equal(elements.get("axleCount").value, 2);
assert.deepEqual(globalThis.document.querySelectorAll(".axle-load-input").map((input) => Number(input.value)), [
  30000,
  18000,
]);

elements.get("vehiclePreset").value = "hydrovac_tri_drive";
elements.get("vehiclePreset").oninput();
assert.equal(elements.get("vehicleType").value, "wheel");
assert.equal(elements.get("axleCount").value, 4);
assert.deepEqual(globalThis.document.querySelectorAll(".axle-load-input").map((input) => Number(input.value)), [
  16000,
  17000,
  17000,
  17000,
]);

elements.get("vehiclePreset").value = "large_bulldozer";
elements.get("vehiclePreset").oninput();
assert.equal(elements.get("vehicleType").value, "track");
assert.equal(elements.get("axleCount").disabled, true);
assert.deepEqual(globalThis.document.querySelectorAll(".axle-load-input").map((input) => Number(input.value)), [85000]);
assert.equal(globalThis.document.querySelectorAll(".track-length-input")[0].value, "126");
assert.equal(globalThis.document.querySelectorAll(".tire-pressure-input").length, 0);

elements.get("soilProfile").value = "concrete_over_soil";
elements.get("soilProfile").oninput();
assert.equal(elements.get("surfaceLayerThickness").value, 6);
assert.equal(elements.get("soilModulus").value, 2500);

assert.equal(elements.get("soilFrictionAngle").disabled, true);
elements.get("soilLoadModel").value = "trap_door";
elements.get("soilLoadModel").oninput();
assert.equal(elements.get("soilFrictionAngle").disabled, false);

elements.get("bendingStrainMode").value = "deflection";
elements.get("pipeDeflection").value = "1";
elements.get("deflectedPipeLength").value = "240";
elements.get("bendingStrainMode").oninput();
assert.equal(elements.get("bendingStrain").disabled, true);
assert.match(elements.get("strainSummary").textContent, /Calculated bending strain/);

elements.get("loginUserName").value = "admin";
elements.get("loginPassword").value = "admin";
await elements.get("loginSubmitButton").onclick();
assert.equal(elements.get("currentUser").textContent, "admin");
assert.equal(elements.get("adminModuleOption").hidden, false);
elements.get("moduleSelect").value = "admin";
await elements.get("moduleSelect").onchange();
assert.equal(elements.get("adminPage").hidden, false);
assert.equal(elements.get("pipelinePage").hidden, true);
assert.match(elements.get("adminUserTableBody").innerHTML, /Administrator/);
assert.match(elements.get("adminUserTableBody").innerHTML, /Backend User Management/);
assert.match(elements.get("adminUserTableBody").innerHTML, /2\.00/);
assert.equal(JSON.parse(globalThis.sessionStorage.getItem("pipelineAssessmentActiveSession.v1")).username, "admin");
elements.get("logoutButton").onclick();
assert.equal(globalThis.sessionStorage.getItem("pipelineAssessmentActiveSession.v1"), null);
assert.equal(globalThis.document.body.classList.contains("auth-locked"), true);
