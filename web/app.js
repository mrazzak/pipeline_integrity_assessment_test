const $ = (id) => document.getElementById(id);
const assessmentStorageKey = "pipelineCrossingAssessments.v1";
const activeSessionStorageKey = "pipelineAssessmentActiveSession.v1";

const baseFields = [
  "assessmentName",
  "outsideDiameter",
  "wallThickness",
  "maop",
  "classLocation",
  "designFactor",
  "grade",
  "customSmys",
  "youngsModulus",
  "vehiclePreset",
  "vehicleType",
  "axleCount",
  "contactArea",
  "tirePressure",
  "axleWidth",
  "tireWidth",
  "axleSpacing",
  "crossingAngle",
  "impactFactor",
  "soilProfile",
  "soilLoadModel",
  "soilFrictionAngle",
  "surfaceLayerThickness",
  "surfaceLayerUnitWeight",
  "cover",
  "soilUnitWeight",
  "soilModulus",
  "kb",
  "kz",
  "scanStep",
  "bendingStrainMode",
  "bendingStrain",
  "pipeDeflection",
  "deflectedPipeLength",
  "bendingStrainBasis",
  "fatigueEnabled",
  "fatigueStressSource",
  "fatigueStressRange",
  "fatigueCycles",
  "fatigueExponent",
  "fatigueConstant",
  "mitigationType",
  "mitigationWidth",
  "mitigationLength",
  "mitigationThickness",
  "mitigationSpreadAngle",
  "mitigationUnitWeight",
];

const postCalculationFields = new Set([
  "fatigueEnabled",
  "fatigueStressSource",
  "fatigueStressRange",
  "fatigueCycles",
  "fatigueExponent",
  "fatigueConstant",
  "mitigationType",
  "mitigationWidth",
  "mitigationLength",
  "mitigationThickness",
  "mitigationSpreadAngle",
  "mitigationUnitWeight",
]);

const axleLoads = [];
const tirePressures = [];
const tireWidths = [];
const contactAreas = [];
const axleWidths = [];
const axleSpacings = [];
const trackLengths = [];
let savedWheelAxleCount = 4;
let activeVehicleType = "wheel";
let latestResult = null;
let activeUser = "";
let activeRole = "";
let passwordChangeUser = "";
let activeSessionId = "";
let sessionStartedAtMs = 0;
let activeModuleKey = "";
let noLoginMode = false;
let latestInteractionResult = null;
let latestRstrengResult = null;
let latestIliToFeaResult = null;
const iliFeatureMethodOverrides = new Map();
const iliCalculationMethods = [
  { value: "modified_b31g", label: "Modified B31.G" },
  { value: "asme_b31g", label: "ASME B31G" },
  { value: "rstreng_simplified", label: "RSTRENG simplified" },
  { value: "corlas", label: "CorLAS crack-like flaw" },
  { value: "scc_colony", label: "SCC crack colony" },
  { value: "reported_pressure", label: "ILI reported failure pressure", requiresReportedPressure: true },
  { value: "crack_fracture", label: "Crack/SCC fracture screen" },
];

const moduleUsageLabels = {
  pipeline: "Pipeline Crossing Assessment",
  corlas: "CorLAS Failure Pressure Calculation",
  sccColony: "SCC Crack Colony Assessment",
  crackGrowth: "Crack Growth / Fatigue Life",
  iliScreening: "ILI Feature Screening and Ranking",
  iliToFea: "Automated ILI-to-FEA Defect Assessment",
  annexK: "Engineering Criticality Assessment - CSA Z662 Annex K",
  dent: "Statistical Dent Assessment",
  b31g: "Modified B31.G Calculation",
  rstreng: "RSTRENG Effective Area Calculation",
  prciDent: "PRCI Level 2 Dent Assessment",
  interaction: "Interacting Anomalies FEA Model",
  admin: "Backend User Management",
};

const modulePageIds = {
  pipeline: "pipelinePage",
  corlas: "corlasPage",
  sccColony: "sccColonyPage",
  crackGrowth: "crackGrowthPage",
  iliScreening: "iliScreeningPage",
  iliToFea: "iliToFeaPage",
  annexK: "annexKPage",
  dent: "dentPage",
  b31g: "b31gPage",
  rstreng: "rstrengPage",
  prciDent: "prciDentPage",
  interaction: "interactionPage",
};

const moduleSummaries = {
  pipeline: "Vehicle crossing hoop stress, fatigue, and mitigation assessment.",
  corlas: "Crack-like flaw failure pressure by collapse and fracture criteria.",
  sccColony: "Interacting SCC crack colony screening and growth-life check.",
  crackGrowth: "Standalone Paris-law crack-growth fatigue life estimate.",
  iliScreening: "Multi-feature ILI anomaly screening and action ranking.",
  iliToFea: "Direct ILI translation into interaction models, fatigue life, crack growth, and governing MOP.",
  annexK: "CSA Z662 Annex K girth weld ECA screening and FAD disposition.",
  dent: "Monte Carlo dent strain screening with measurement uncertainty.",
  b31g: "Modified B31.G corrosion metal-loss remaining strength check.",
  rstreng: "Effective-area corrosion assessment using a measured depth profile.",
  prciDent: "PRCI Level 2 dent strain, RSF, fatigue life, and crack-growth screening.",
  interaction: "Parametric Level 3 interacting anomaly model setup and screening.",
  admin: "Admin-only user accounts, expiry settings, sessions, and module usage.",
};

const moduleInstructionNotes = {
  pipeline: [
    "Select Pipeline Crossing Assessment for vehicle or equipment crossings over a buried pipe.",
    "Fill Pipeline Information, Vehicle Information, soil/loading assumptions, bending strain, fatigue, and mitigation sections.",
    "Use the vehicle preset dropdown first when applicable, then adjust axle loads, tyre/contact data, crossing angle, cover, and mitigation dimensions.",
    "Click Calculate to evaluate live-load hoop stress, MOP/MAOP screening, fatigue, and the separate mitigated scenario. Use Create Report after the calculation is complete.",
  ],
  corlas: [
    "Select CorLAS Failure Pressure Calculation for crack-like flaw failure pressure screening.",
    "Enter pipe geometry, material properties, operating pressure, flaw depth/length, toughness, and stress-strain parameters.",
    "Click Calculate CorLAS to compute collapse pressure, fracture pressure, governing failure pressure, and intermediate CorLAS terms.",
    "Review the pressure values in MPa and psi before creating a report.",
  ],
  sccColony: [
    "Select SCC Crack Colony Assessment for groups of nearby stress-corrosion cracks.",
    "Enter pipe/material properties, fracture toughness, assessment factor, crack depths, crack lengths, and spacings between adjacent cracks.",
    "Click Calculate SCC Colony to estimate equivalent interacting crack geometry, interaction factor, fracture pressure, collapse pressure, allowable pressure, and Kr at MAOP.",
    "Use pressure cycling inputs to estimate remaining cycles from the equivalent crack depth to the critical screening depth.",
  ],
  crackGrowth: [
    "Select Crack Growth / Fatigue Life for a standalone Paris-law cycle-life estimate.",
    "Enter the initial crack size, critical crack size, stress range, geometry factor, optional threshold delta K, Paris C, Paris m, integration increment, applied cycles, and life factor.",
    "Click Calculate Crack Growth to integrate crack growth from the initial size to the critical size and compare applied cycles to the factored life.",
    "Review estimated life, remaining cycles, damage ratio, delta K, and growth-rate outputs before creating a report.",
  ],
  iliScreening: [
    "Select ILI Feature Screening and Ranking for triaging multiple inspection-reported anomalies.",
    "Enter pipe properties, screening thresholds, and comma-separated feature IDs, types, depths, lengths, clock positions, distances, and optional reported failure pressures.",
    "Click Rank ILI Features to classify features as immediate action, high priority, monitor, or acceptable.",
    "Review the ranked table and recommended actions before planning digs, validation, pressure reduction, or detailed assessment.",
  ],
  iliToFea: [
    "Select Automated ILI-to-FEA Defect Assessment to convert raw inspection measurements into defect-aware shell geometry.",
    "Choose Auto, Raw tool data only, or Feature list only. The summarized feature list is optional when raw files include feature ID, distance, and clock position.",
    "Load MFL, crack-tool, and caliper TXT, CSV, or Excel files separately. Review the editable imported rows before calculation.",
    "MFL depth points thin the outer wall, caliper points deform the shell, and crack or SCC paths remove local mesh elements. Anomaly-centered patches use a denser mesh than the remote pipe.",
    "Choose the ANN or DNN advisory surrogate and set uncertainty inputs for Monte Carlo reliability analysis. Predictions outside the published corrosion domain must be treated as model-development cases.",
    "Click Build and Assess FEA Models, then review the reconstructed mesh, probability of failure, B31.8 strain screening, API RP 1183 review status, and governing maximum MOP. Validation evidence is documented separately in the validation white paper.",
  ],
  annexK: [
    "Select Engineering Criticality Assessment - CSA Z662 Annex K for girth weld flaw screening.",
    "Enter pipe, weld, material, fracture toughness, flaw geometry, stress, and assessment-level inputs.",
    "Click Calculate ECA to run gateway checks, FAD ratios, load ratio, fracture ratio, and disposition logic.",
    "Use the returned disposition and gateway issues to decide whether the flaw is acceptable, needs repair, or requires higher-level review.",
  ],
  dent: [
    "Select Statistical Dent Assessment for probabilistic dent strain screening.",
    "Enter pipe geometry, dent depth/radius data, pressure, material properties, uncertainty settings, and simulation count.",
    "Click Calculate Dent Assessment to run the Monte Carlo model and generate percentile results and repair criteria.",
    "Use the distribution chart and criteria list to understand pass/fail drivers before issuing a report.",
  ],
  b31g: [
    "Select Modified B31.G Calculation for corrosion metal-loss remaining strength checks.",
    "Enter pipe OD, wall thickness, MAOP, SMYS/SMTS, assessment factor, defect depth, defect length, and flow-stress cap setting.",
    "Click Calculate Modified B31.G to compute Folias factor, failure stress, failure pressure, allowable pressure, and MAOP ratio.",
    "Confirm the depth/thickness ratio and allowable pressure are suitable for the intended engineering disposition.",
  ],
  rstreng: [
    "Select RSTRENG Effective Area Calculation for corrosion profiles with multiple measured depth points.",
    "Enter pipe geometry, MAOP, SMYS/SMTS, assessment factor, flow-stress cap, station list, and matching depth list.",
    "Click Calculate RSTRENG to integrate the measured metal-loss area across all contiguous profile segments and find the governing failure pressure.",
    "Review the governing segment, effective area ratio, Folias factor, allowable pressure, and MAOP ratio before creating a report.",
  ],
  prciDent: [
    "Select PRCI Level 2 Dent Assessment for workbook-style dent screening.",
    "Enter pipe information, dent depth/radius, fatigue cycle inputs, SCF, and optional Paris-law crack-growth settings.",
    "Click Calculate PRCI Dent to evaluate dent depth percent, bending strain, equivalent stress, fatigue life, RSF, and crack-growth life.",
    "Review the repair/acceptance criteria list to see the specific reason for repair required or not required.",
  ],
  interaction: [
    "Select Interacting Anomalies FEA Model for Level 3 model preparation and interaction screening.",
    "Enter pipe/material/loading values, define both anomaly geometries, and choose uncertainty, mesh refinement, and solver controls.",
    "Click Calculate Interaction Model to estimate interaction factor, combined failure pressure, safety factor, failure mode, mesh size, and boundary-condition notes.",
    "Use the visual model demonstration to verify anomaly spacing, interaction envelope, mesh refinement, and boundary-condition setup.",
  ],
  admin: [
    "Select Backend User Management only when logged in as an administrator.",
    "Review the user table for roles, expiry dates, session activity, total hours, and modules used.",
    "Enter or update the target user information, role, password, and login expiration before clicking Save User.",
    "Use Save Method to update calculation method notes and defaults; use Delete User only after confirming the selected target account.",
  ],
};

const moduleShowHandlers = {
  pipeline: showPipelineAssessment,
  corlas: showCorlasAssessment,
  sccColony: showSccColonyAssessment,
  crackGrowth: showCrackGrowthAssessment,
  iliScreening: showIliScreeningAssessment,
  iliToFea: showIliToFeaAssessment,
  annexK: showAnnexKAssessment,
  dent: showDentAssessment,
  b31g: showB31gAssessment,
  rstreng: showRstrengAssessment,
  prciDent: showPrciDentAssessment,
  interaction: showInteractionAssessment,
  admin: showAdminManagement,
};

const mitigationPresets = {
  none: { width: 0, length: 0, thickness: 0, spreadAngle: 45, unitWeight: 0 },
  steel_plate: { width: 96, length: 240, thickness: 1, spreadAngle: 45, unitWeight: 490 },
  rig_mats: { width: 96, length: 192, thickness: 8, spreadAngle: 35, unitWeight: 45 },
  wooden_bridge: { width: 144, length: 240, thickness: 12, spreadAngle: 30, unitWeight: 40 },
  hollow_concrete_slab: { width: 120, length: 240, thickness: 8, spreadAngle: 40, unitWeight: 90 },
  custom: null,
};

const mitigationMedia = {
  none: { stiffness: 0, transferability: 1, bypass: 0, minFactor: 1, description: "No mitigation" },
  steel_plate: {
    stiffness: 0.95,
    transferability: 0.35,
    bypass: 0.25,
    minFactor: 0.03,
    description: "stiff plate distribution with partial edge bypass",
  },
  rig_mats: {
    stiffness: 0.65,
    transferability: 0.55,
    bypass: 0.2,
    minFactor: 0.08,
    description: "moderate stiffness mat distribution",
  },
  wooden_bridge: {
    stiffness: 0.9,
    transferability: 0.06,
    bypass: 1,
    minFactor: 0,
    description: "bridge action transferring live load to supports away from the pipe",
  },
  hollow_concrete_slab: {
    stiffness: 0.85,
    transferability: 0.22,
    bypass: 0.5,
    minFactor: 0.02,
    description: "stiff slab distribution with partial structural bypass",
  },
  custom: {
    stiffness: 0.5,
    transferability: 0.5,
    bypass: 0,
    minFactor: 0.05,
    description: "custom load-spreading medium",
  },
};

const soilProfiles = {
  compacted_bare: {
    summary: "Compacted native soil without a paved load-spreading layer.",
    surfaceLayerThickness: 0,
    surfaceLayerUnitWeight: 0,
    soilUnitWeight: 120,
    soilModulus: 1000,
    kb: 0.1,
    kz: 0.061,
  },
  sand_soil_mix: {
    summary: "Mixed cover assumption with 25% sand and 75% native soil.",
    surfaceLayerThickness: 0,
    surfaceLayerUnitWeight: 0,
    soilUnitWeight: 115,
    soilModulus: 700,
    kb: 0.11,
    kz: 0.061,
  },
  asphalt_over_soil: {
    summary: "Asphalt wearing surface over compacted soil cover.",
    surfaceLayerThickness: 4,
    surfaceLayerUnitWeight: 145,
    soilUnitWeight: 125,
    soilModulus: 1500,
    kb: 0.09,
    kz: 0.061,
  },
  concrete_over_soil: {
    summary: "Concrete slab surface over compacted soil cover.",
    surfaceLayerThickness: 6,
    surfaceLayerUnitWeight: 150,
    soilUnitWeight: 130,
    soilModulus: 2500,
    kb: 0.075,
    kz: 0.061,
  },
  custom: {
    summary: "Custom soil profile. Enter project-specific soil and surface values.",
  },
};

const vehiclePresets = {
  custom: null,
  ford_f150: {
    vehicleType: "wheel",
    axleCount: 2,
    axleLoads: [3200, 3900],
    contactArea: 51,
    tirePressure: 35,
    axleWidth: 68,
    tireWidth: 11,
    axleSpacing: 145,
    contactAreas: [46, 56],
    axleWidths: [68, 68],
    tireWidths: [11, 11],
    tirePressures: [35, 35],
    axleSpacings: [145],
  },
  ford_f350: {
    vehicleType: "wheel",
    axleCount: 2,
    axleLoads: [5600, 6780],
    contactArea: 39,
    tirePressure: 80,
    axleWidth: 75,
    tireWidth: 11.5,
    axleSpacing: 160,
    contactAreas: [35, 42],
    axleWidths: [75, 75],
    tireWidths: [11.5, 11.5],
    tirePressures: [80, 80],
    axleSpacings: [160],
  },
  dump_truck_3_axle: {
    vehicleType: "wheel",
    axleCount: 3,
    axleLoads: [16000, 18750, 18750],
    contactArea: 90,
    tirePressure: 100,
    axleWidth: 102,
    tireWidth: 12,
    axleSpacing: 52,
    contactAreas: [80, 94, 94],
    axleWidths: [102, 102, 102],
    tireWidths: [12, 12, 12],
    tirePressures: [100, 100, 100],
    axleSpacings: [180, 52],
  },
  semi_truck: {
    vehicleType: "wheel",
    axleCount: 5,
    axleLoads: [13200, 18700, 18700, 18700, 18700],
    contactArea: 89,
    tirePressure: 100,
    axleWidth: 102,
    tireWidth: 12,
    axleSpacing: 52,
    contactAreas: [66, 94, 94, 94, 94],
    axleWidths: [102, 102, 102, 102, 102],
    tireWidths: [12, 12, 12, 12, 12],
    tirePressures: [100, 100, 100, 100, 100],
    axleSpacings: [220, 52, 360, 52],
  },
  b_train: {
    vehicleType: "wheel",
    axleCount: 8,
    axleLoads: [13200, 18700, 18700, 17270, 17270, 17270, 18700, 18700],
    contactArea: 89,
    tirePressure: 100,
    axleWidth: 102,
    tireWidth: 12,
    axleSpacing: 52,
    contactAreas: [66, 94, 94, 87, 87, 87, 94, 94],
    axleWidths: [102, 102, 102, 102, 102, 102, 102, 102],
    tireWidths: [12, 12, 12, 12, 12, 12, 12, 12],
    tirePressures: [100, 100, 100, 100, 100, 100, 100, 100],
    axleSpacings: [220, 52, 220, 60, 60, 220, 52],
  },
  tracked_dozer: {
    vehicleType: "track",
    axleCount: 1,
    axleLoads: [48800],
    contactArea: 3090,
    tirePressure: 0,
    axleWidth: 76,
    tireWidth: 24,
    axleSpacing: 117,
    contactAreas: [3090],
    axleWidths: [76],
    tireWidths: [24],
    trackLengths: [117],
  },
  hydrovac_tandem: {
    vehicleType: "wheel",
    axleCount: 3,
    axleLoads: [16000, 18750, 18750],
    contactArea: 80,
    tirePressure: 110,
    axleWidth: 102,
    tireWidth: 12,
    axleSpacing: 52,
    contactAreas: [73, 85, 85],
    axleWidths: [102, 102, 102],
    tireWidths: [12, 12, 12],
    tirePressures: [110, 110, 110],
    axleSpacings: [220, 52],
  },
  hydrovac_tridem: {
    vehicleType: "wheel",
    axleCount: 4,
    axleLoads: [16000, 16000, 16000, 16000],
    contactArea: 73,
    tirePressure: 110,
    axleWidth: 102,
    tireWidth: 12,
    axleSpacing: 60,
    contactAreas: [73, 73, 73, 73],
    axleWidths: [102, 102, 102, 102],
    tireWidths: [12, 12, 12, 12],
    tirePressures: [110, 110, 110, 110],
    axleSpacings: [220, 60, 60],
  },
  hydrovac_tri_drive: {
    vehicleType: "wheel",
    axleCount: 4,
    axleLoads: [16000, 17000, 17000, 17000],
    contactArea: 77,
    tirePressure: 110,
    axleWidth: 102,
    tireWidth: 12,
    axleSpacing: 60,
    contactAreas: [73, 77, 77, 77],
    axleWidths: [102, 102, 102, 102],
    tireWidths: [12, 12, 12, 12],
    tirePressures: [110, 110, 110, 110],
    axleSpacings: [220, 60, 60],
  },
  hydrovac_semi_trailer: {
    vehicleType: "wheel",
    axleCount: 5,
    axleLoads: [13200, 18700, 18700, 18700, 18700],
    contactArea: 81,
    tirePressure: 110,
    axleWidth: 102,
    tireWidth: 12,
    axleSpacing: 52,
    contactAreas: [60, 85, 85, 85, 85],
    axleWidths: [102, 102, 102, 102, 102],
    tireWidths: [12, 12, 12, 12, 12],
    tirePressures: [110, 110, 110, 110, 110],
    axleSpacings: [220, 52, 300, 52],
  },
  small_bulldozer: {
    vehicleType: "track",
    axleCount: 1,
    axleLoads: [30000],
    contactArea: 1200,
    tirePressure: 25,
    axleWidth: 72,
    tireWidth: 20,
    axleSpacing: 84,
    trackLengths: [84],
  },
  large_bulldozer: {
    vehicleType: "track",
    axleCount: 1,
    axleLoads: [85000],
    contactArea: 3024,
    tirePressure: 0,
    axleWidth: 96,
    tireWidth: 24,
    axleSpacing: 126,
    contactAreas: [3024],
    axleWidths: [96],
    tireWidths: [24],
    trackLengths: [126],
  },
  tracked_excavator: {
    vehicleType: "track",
    axleCount: 1,
    axleLoads: [50000],
    contactArea: 4390,
    tirePressure: 0,
    axleWidth: 94,
    tireWidth: 24,
    axleSpacing: 183,
    contactAreas: [4390],
    axleWidths: [94],
    tireWidths: [24],
    trackLengths: [183],
  },
  crawler_crane_small: {
    vehicleType: "track",
    axleCount: 1,
    axleLoads: [120000],
    contactArea: 4200,
    tirePressure: 30,
    axleWidth: 132,
    tireWidth: 36,
    axleSpacing: 150,
    trackLengths: [150],
  },
  crawler_crane_large: {
    vehicleType: "track",
    axleCount: 1,
    axleLoads: [220000],
    contactArea: 7200,
    tirePressure: 32,
    axleWidth: 168,
    tireWidth: 42,
    axleSpacing: 180,
    trackLengths: [180],
  },
  farm_tractor: {
    vehicleType: "wheel",
    axleCount: 2,
    axleLoads: [12000, 18000],
    contactArea: 240,
    tirePressure: 28,
    axleWidth: 96,
    tireWidth: 18,
    axleSpacing: 120,
    axleSpacings: [120],
  },
  tractor_grain_cart: {
    vehicleType: "wheel",
    axleCount: 4,
    axleLoads: [9000, 17000, 22000, 22000],
    contactArea: 300,
    tirePressure: 35,
    axleWidth: 96,
    tireWidth: 24,
    axleSpacing: 96,
  },
  combine_harvester: {
    vehicleType: "wheel",
    axleCount: 2,
    axleLoads: [30000, 18000],
    contactArea: 420,
    tirePressure: 30,
    axleWidth: 120,
    tireWidth: 32,
    axleSpacing: 156,
  },
  self_propelled_sprayer: {
    vehicleType: "wheel",
    axleCount: 2,
    axleLoads: [12000, 14000],
    contactArea: 180,
    tirePressure: 45,
    axleWidth: 120,
    tireWidth: 15,
    axleSpacing: 150,
  },
  tracked_tractor: {
    vehicleType: "track",
    axleCount: 1,
    axleLoads: [42000],
    contactArea: 1600,
    tirePressure: 18,
    axleWidth: 88,
    tireWidth: 24,
    axleSpacing: 110,
    trackLengths: [110],
  },
};

function valueOf(id) {
  return Number($(id).value);
}

function sanitizeUserName(value) {
  const name = String(value || "").trim();
  return name || "default";
}

function userStorageKey() {
  return `${assessmentStorageKey}.${activeUser.toLowerCase()}`;
}

function isLoggedIn() {
  return Boolean(activeUser);
}

function saveActiveSession(username, role, sessionId) {
  if (!sessionId) {
    return;
  }
  try {
    sessionStorage.setItem(
      activeSessionStorageKey,
      JSON.stringify({
        username: sanitizeUserName(username),
        role: role || "user",
        session_id: sessionId,
        saved_at: new Date().toISOString(),
      }),
    );
  } catch {
    // Session restore is helpful, but the calculator remains usable if browser storage is unavailable.
  }
}

function readActiveSession() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(activeSessionStorageKey) || "null");
    if (!stored || !stored.username || !stored.session_id) {
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

function clearActiveSession() {
  try {
    sessionStorage.removeItem(activeSessionStorageKey);
  } catch {
    // Nothing to clear when browser storage is unavailable.
  }
}

function sessionElapsedSeconds() {
  if (!sessionStartedAtMs) {
    return 0;
  }
  return Math.max(0, Math.round((Date.now() - sessionStartedAtMs) / 1000));
}

function adminAuthPayload() {
  const adminUsername = $("adminUserName").value.trim() || activeUser;
  const payload = { admin_username: adminUsername };
  if ($("adminPassword").value) {
    payload.admin_password = $("adminPassword").value;
  } else if (activeSessionId) {
    payload.session_id = activeSessionId;
  }
  return payload;
}

async function sendSessionActivity(moduleKey = activeModuleKey, finished = false) {
  if (!activeUser || !activeSessionId) {
    return;
  }
  const moduleName = moduleUsageLabels[moduleKey] || "";
  try {
    await fetch("/api/session-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: activeUser,
        session_id: activeSessionId,
        elapsed_seconds: sessionElapsedSeconds(),
        module: moduleName,
        finished,
      }),
    });
  } catch {
    // Usage tracking should never block the engineering calculation workflow.
  }
}

function fmt(value, digits = 1) {
  return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : "-";
}

function textOfSelect(id) {
  const select = $(id);
  return select.options[select.selectedIndex]?.textContent || select.value;
}

function labelFromValue(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function textOfMitigationType() {
  const raw = $("mitigationType").value;
  const label = textOfSelect("mitigationType");
  return label === raw ? labelFromValue(raw) : label;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function reportRows(rows) {
  return rows
    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join("");
}

function readAxleLoads() {
  return Array.from(document.querySelectorAll(".axle-load-input")).map((input) => Number(input.value));
}

function readTirePressures() {
  return Array.from(document.querySelectorAll(".tire-pressure-input")).map((input) => Number(input.value));
}

function readTireWidths() {
  return Array.from(document.querySelectorAll(".tire-width-input")).map((input) => Number(input.value));
}

function readContactAreas() {
  return Array.from(document.querySelectorAll(".contact-area-input")).map((input) => Number(input.value));
}

function readAxleWidths() {
  return Array.from(document.querySelectorAll(".axle-width-input")).map((input) => Number(input.value));
}

function readAxleSpacings() {
  return Array.from(document.querySelectorAll(".axle-spacing-input")).map((input) => Number(input.value));
}

function readTrackLengths() {
  return Array.from(document.querySelectorAll(".track-length-input")).map((input) => Number(input.value));
}

function totalVehicleWeight() {
  const total = readAxleLoads().reduce((sum, load) => sum + (Number.isFinite(load) ? load : 0), 0);
  $("vehicleWeight").value = Math.round(total);
  return total;
}

function syncAverageTirePressure() {
  const pressures = readTirePressures().filter((pressure) => Number.isFinite(pressure) && pressure > 0);
  if (pressures.length > 0) {
    const average = pressures.reduce((sum, pressure) => sum + pressure, 0) / pressures.length;
    $("tirePressure").value = Math.round(average * 10) / 10;
  }
}

function syncAverageField(values, targetId) {
  const validValues = values.filter((value) => Number.isFinite(value) && value > 0);
  if (validValues.length > 0) {
    const average = validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
    $(targetId).value = Math.round(average * 10) / 10;
  }
}

function presetAxleValues(preset, listKey, fallbackKey) {
  const source = Array.isArray(preset[listKey]) ? preset[listKey] : [];
  if (source.length === preset.axleLoads.length) {
    return source;
  }
  return preset.axleLoads.map(() => preset[fallbackKey]);
}

function presetAxleSpacings(preset) {
  const spacingCount = Math.max(preset.axleLoads.length - 1, 0);
  const source = Array.isArray(preset.axleSpacings) ? preset.axleSpacings : [];
  if (source.length === spacingCount) {
    return source;
  }
  return preset.axleLoads.slice(0, spacingCount).map(() => preset.axleSpacing);
}

function applyVehiclePreset() {
  const preset = vehiclePresets[$("vehiclePreset").value];
  if (!preset) {
    return;
  }
  $("vehicleType").value = preset.vehicleType;
  $("axleCount").value = preset.axleCount;
  $("contactArea").value = preset.contactArea;
  $("tirePressure").value = preset.tirePressure;
  $("axleWidth").value = preset.axleWidth;
  $("tireWidth").value = preset.tireWidth;
  $("axleSpacing").value = preset.axleSpacing;

  axleLoads.length = 0;
  tirePressures.length = 0;
  tireWidths.length = 0;
  contactAreas.length = 0;
  axleWidths.length = 0;
  axleSpacings.length = 0;
  trackLengths.length = 0;
  axleLoads.push(...preset.axleLoads);
  tirePressures.push(...presetAxleValues(preset, "tirePressures", "tirePressure"));
  tireWidths.push(...presetAxleValues(preset, "tireWidths", "tireWidth"));
  contactAreas.push(...presetAxleValues(preset, "contactAreas", "contactArea"));
  axleWidths.push(...presetAxleValues(preset, "axleWidths", "axleWidth"));
  axleSpacings.push(...presetAxleSpacings(preset));
  if (preset.trackLengths) {
    trackLengths.push(...preset.trackLengths);
  }
  renderSchematic();
}

function markVehicleCustom(changedField) {
  if (changedField !== "vehiclePreset") {
    $("vehiclePreset").value = "custom";
  }
}

function renderWheelAxle(index, load, pressure, width, contactArea, axleWidth, axleSpacing, isLastAxle) {
  const visualTireWidth = Math.max(22, Math.min(58, width * 2.4));
  const spacingInput = isLastAxle
    ? ""
    : `
        <label>
          <span>Distance to next axle</span>
          <input class="axle-spacing-input" data-axle="${index}" type="number" min="0.01" step="1" value="${axleSpacing}">
          <small>in</small>
        </label>
      `;
  return `
    <div class="axle-station" style="--tire-width: ${visualTireWidth}px">
      <span class="tyre tyre-left" aria-hidden="true"></span>
      <span class="axle-line" aria-hidden="true"></span>
      <span class="tyre tyre-right" aria-hidden="true"></span>
      <div class="axle-input-box">
        <label>
          <span>Axle ${index + 1} load</span>
          <input class="axle-load-input" data-axle="${index}" type="number" min="1" step="100" value="${load}">
          <small>lb</small>
        </label>
        <label>
          <span>Tyre pressure</span>
          <input class="tire-pressure-input" data-axle="${index}" type="number" min="1" step="1" value="${pressure}">
          <small>psi</small>
        </label>
        <label>
          <span>Contact area per tyre</span>
          <input class="contact-area-input" data-axle="${index}" type="number" min="0.01" step="1" value="${contactArea}">
          <small>in2</small>
        </label>
        <label>
          <span>Axle width</span>
          <input class="axle-width-input" data-axle="${index}" type="number" min="0.01" step="1" value="${axleWidth}">
          <small>in</small>
        </label>
        <label>
          <span>Tyre width</span>
          <input class="tire-width-input" data-axle="${index}" type="number" min="1" step="0.5" value="${width}">
          <small>in</small>
        </label>
        ${spacingInput}
      </div>
    </div>
  `;
}

function renderTrackAxle(index, load, pressure, width, contactArea, axleWidth, axleSpacing, isLastAxle) {
  const visualTrackWidth = Math.max(22, Math.min(58, width * 2.4));
  const length = trackLengths[index] ?? Math.max(24, axleSpacing || valueOf("axleSpacing") || 60);
  const spacingInput = isLastAxle
    ? ""
    : `
        <label>
          <span>Distance to next axle</span>
          <input class="axle-spacing-input" data-axle="${index}" type="number" min="0.01" step="1" value="${axleSpacing}">
          <small>in</small>
        </label>
      `;
  return `
    <div class="axle-station track-station" style="--tire-width: ${visualTrackWidth}px; --track-length: ${Math.max(180, Math.min(320, length * 2.8))}px">
      <span class="track-pad track-left" aria-hidden="true"></span>
      <span class="roller" aria-hidden="true"></span>
      <span class="track-pad track-right" aria-hidden="true"></span>
      <div class="axle-input-box">
        <label>
          <span>Track station ${index + 1} load</span>
          <input class="axle-load-input" data-axle="${index}" type="number" min="1" step="100" value="${load}">
          <small>lb</small>
        </label>
        <label>
          <span>Contact area</span>
          <input class="contact-area-input" data-axle="${index}" type="number" min="0.01" step="1" value="${contactArea}">
          <small>in2 per track pad</small>
        </label>
        <label>
          <span>Axle width</span>
          <input class="axle-width-input" data-axle="${index}" type="number" min="0.01" step="1" value="${axleWidth}">
          <small>in</small>
        </label>
        <label>
          <span>Track width</span>
          <input class="tire-width-input" data-axle="${index}" type="number" min="1" step="0.5" value="${width}">
          <small>in</small>
        </label>
        ${spacingInput}
        <label>
          <span>Track length</span>
          <input class="track-length-input" data-axle="${index}" type="number" min="1" step="1" value="${length}">
          <small>in</small>
        </label>
      </div>
    </div>
  `;
}

function syncAxleLoads() {
  const requested = Math.max(1, Math.round(valueOf("axleCount") || 1));
  while (axleLoads.length < requested) {
    axleLoads.push(axleLoads.length < 4 ? [9000, 9000, 14000, 14000][axleLoads.length] : 10000);
  }
  while (tirePressures.length < requested) {
    tirePressures.push(valueOf("tirePressure") || 85);
  }
  while (tireWidths.length < requested) {
    tireWidths.push(valueOf("tireWidth") || 12);
  }
  while (contactAreas.length < requested) {
    contactAreas.push(valueOf("contactArea") || 180);
  }
  while (axleWidths.length < requested) {
    axleWidths.push(valueOf("axleWidth") || 72);
  }
  const spacingCount = Math.max(requested - 1, 0);
  while (axleSpacings.length < spacingCount) {
    axleSpacings.push(valueOf("axleSpacing") || 60);
  }
  while (trackLengths.length < requested) {
    trackLengths.push(Math.max(24, valueOf("axleSpacing") || 60));
  }
  axleLoads.length = requested;
  tirePressures.length = requested;
  tireWidths.length = requested;
  contactAreas.length = requested;
  axleWidths.length = requested;
  axleSpacings.length = spacingCount;
  trackLengths.length = requested;
}

function syncVehicleMode() {
  const isTrack = $("vehicleType").value === "track";
  if (isTrack) {
    if (activeVehicleType !== "track") {
      savedWheelAxleCount = Math.max(1, Math.round(valueOf("axleCount") || savedWheelAxleCount));
    }
    $("axleCount").value = 1;
    $("axleCount").disabled = true;
    $("axleCountLabel").textContent = "Number of axles";
    $("schematicTitle").textContent = "Track Load Schematic";
    $("schematicHelp").textContent = "Enter the load carried by the track vehicle. The total vehicle weight updates from this box.";
    $("tireWidthLabel").textContent = "Default track width";
    $("schematicControls").classList.add("is-hidden");
    $("tirePressureField").classList.add("is-hidden");
    $("tirePressure").disabled = true;
  } else {
    $("axleCount").disabled = false;
    if (Math.round(valueOf("axleCount") || 0) <= 1) {
      $("axleCount").value = savedWheelAxleCount;
    }
    $("axleCountLabel").textContent = "Number of axles";
    $("schematicTitle").textContent = "Axle Load Schematic";
    $("schematicHelp").textContent = "Enter the load carried by each axle. The total vehicle weight updates from these boxes.";
    $("tireWidthLabel").textContent = "Default tyre width";
    $("schematicControls").classList.add("is-hidden");
    $("tirePressureField").classList.remove("is-hidden");
    $("tirePressure").disabled = false;
  }
  activeVehicleType = $("vehicleType").value;
}

function renderSchematic() {
  syncVehicleMode();
  syncAxleLoads();
  const type = $("vehicleType").value;
  const stations = axleLoads
    .map((load, index) => {
      const isLastAxle = index === axleLoads.length - 1;
      return type === "track"
        ? renderTrackAxle(index, load, tirePressures[index], tireWidths[index], contactAreas[index], axleWidths[index], axleSpacings[index], isLastAxle)
        : renderWheelAxle(index, load, tirePressures[index], tireWidths[index], contactAreas[index], axleWidths[index], axleSpacings[index], isLastAxle);
    })
    .join("");
  $("vehicleSchematic").innerHTML = `
    <div class="vehicle-plan ${type === "track" ? "vehicle-plan-track" : "vehicle-plan-wheel"}" style="--axle-count: ${axleLoads.length}">
      <div class="vehicle-nose" aria-hidden="true"></div>
      <div class="vehicle-body" aria-hidden="true"></div>
      <div class="vehicle-stations">${stations}</div>
    </div>
  `;

  for (const input of document.querySelectorAll(".axle-load-input")) {
    input.addEventListener("input", () => {
      axleLoads[Number(input.dataset.axle)] = Number(input.value);
      totalVehicleWeight();
    });
  }
  for (const input of document.querySelectorAll(".tire-pressure-input")) {
    input.addEventListener("input", () => {
      tirePressures[Number(input.dataset.axle)] = Number(input.value);
      syncAverageTirePressure();
    });
  }
  for (const input of document.querySelectorAll(".tire-width-input")) {
    input.addEventListener("input", () => {
      tireWidths[Number(input.dataset.axle)] = Number(input.value);
      syncAverageField(readTireWidths(), "tireWidth");
      renderSchematic();
    });
  }
  for (const input of document.querySelectorAll(".contact-area-input")) {
    input.addEventListener("input", () => {
      contactAreas[Number(input.dataset.axle)] = Number(input.value);
      syncAverageField(readContactAreas(), "contactArea");
      markVehicleCustom("contactArea");
    });
  }
  for (const input of document.querySelectorAll(".axle-width-input")) {
    input.addEventListener("input", () => {
      axleWidths[Number(input.dataset.axle)] = Number(input.value);
      syncAverageField(readAxleWidths(), "axleWidth");
      markVehicleCustom("axleWidth");
    });
  }
  for (const input of document.querySelectorAll(".axle-spacing-input")) {
    input.addEventListener("input", () => {
      axleSpacings[Number(input.dataset.axle)] = Number(input.value);
      syncAverageField(readAxleSpacings(), "axleSpacing");
      markVehicleCustom("axleSpacing");
    });
  }
  for (const input of document.querySelectorAll(".track-length-input")) {
    input.addEventListener("input", () => {
      trackLengths[Number(input.dataset.axle)] = Number(input.value);
    });
  }
  totalVehicleWeight();
  syncAverageTirePressure();
}

function readPayload() {
  const smys = $("grade").value === "custom" ? valueOf("customSmys") : Number($("grade").value);
  const bendingStrain = calculateBendingStrainMicrostrain();
  return {
    pipe: {
      outside_diameter_in: valueOf("outsideDiameter"),
      wall_thickness_in: valueOf("wallThickness"),
      maop_psig: valueOf("maop"),
      class_location: $("classLocation").value,
      design_factor: valueOf("designFactor"),
      smys_psi: smys,
      youngs_modulus_psi: valueOf("youngsModulus"),
    },
    vehicle: {
      vehicle_type: $("vehicleType").value,
      axle_count: Math.round(valueOf("axleCount")),
      axle_loads_lb: readAxleLoads(),
      tire_pressures_psi: $("vehicleType").value === "track" ? [] : readTirePressures(),
      tire_widths_in: readTireWidths(),
      contact_areas_in2: readContactAreas(),
      axle_widths_in: readAxleWidths(),
      axle_spacings_in: readAxleSpacings(),
      track_lengths_in: readTrackLengths(),
      contact_area_in2: valueOf("contactArea"),
      tire_pressure_psi: $("vehicleType").value === "track" ? 0 : valueOf("tirePressure"),
      axle_width_in: valueOf("axleWidth"),
      tire_width_in: valueOf("tireWidth"),
      axle_spacing_in: valueOf("axleSpacing"),
      crossing_angle_deg: valueOf("crossingAngle"),
      impact_factor: valueOf("impactFactor"),
      scan_step_in: valueOf("scanStep"),
    },
    soil: {
      profile: $("soilProfile").value,
      load_model: $("soilLoadModel").value,
      friction_angle_deg: valueOf("soilFrictionAngle"),
      surface_layer_thickness_in: valueOf("surfaceLayerThickness"),
      surface_layer_unit_weight_pcf: valueOf("surfaceLayerUnitWeight"),
      cover_in: valueOf("cover"),
      unit_weight_pcf: valueOf("soilUnitWeight"),
      modulus_reaction_psi: valueOf("soilModulus"),
      kb: valueOf("kb"),
      kz: valueOf("kz"),
    },
    strain: {
      mode: $("bendingStrainMode").value,
      bending_strain_microstrain: bendingStrain,
      pipe_deflection_in: valueOf("pipeDeflection"),
      deflected_pipe_length_in: valueOf("deflectedPipeLength"),
      basis: $("bendingStrainBasis").value,
    },
    fatigue: {
      enabled: $("fatigueEnabled").value === "on",
      stress_source: $("fatigueStressSource").value,
      manual_stress_range_psi: valueOf("fatigueStressRange"),
      applied_cycles: valueOf("fatigueCycles"),
      exponent: valueOf("fatigueExponent"),
      constant: valueOf("fatigueConstant"),
    },
    mitigation: {
      type: $("mitigationType").value,
      width_in: valueOf("mitigationWidth"),
      length_in: valueOf("mitigationLength"),
      thickness_in: valueOf("mitigationThickness"),
      spread_angle_deg: valueOf("mitigationSpreadAngle"),
      unit_weight_pcf: valueOf("mitigationUnitWeight"),
    },
  };
}

function fieldValues() {
  const values = {};
  for (const id of baseFields) {
    values[id] = $(id).value;
  }
  values.axleLoads = [...axleLoads];
  values.tirePressures = [...tirePressures];
  values.tireWidths = [...tireWidths];
  values.contactAreas = [...contactAreas];
  values.axleWidths = [...axleWidths];
  values.axleSpacings = [...axleSpacings];
  values.trackLengths = [...trackLengths];
  return values;
}

function loadSavedAssessments() {
  try {
    const stored = JSON.parse(localStorage.getItem(userStorageKey()) || "{}");
    if (stored.version === 2 && stored.modules) {
      return stored;
    }
    return {
      version: 2,
      modules: {
        pipeline: stored,
      },
    };
  } catch {
    return { version: 2, modules: {} };
  }
}

function writeSavedAssessments(assessments) {
  localStorage.setItem(userStorageKey(), JSON.stringify(assessments));
}

function savedCalculationsForModule(moduleKey = activeModuleKey) {
  const library = loadSavedAssessments();
  return library.modules?.[moduleKey] || {};
}

function activeModulePage() {
  const pageId = modulePageIds[activeModuleKey];
  return pageId ? $(pageId) : null;
}

function captureModuleFields() {
  const page = activeModulePage();
  if (!page) {
    return {};
  }
  const fields = {};
  for (const control of page.querySelectorAll("input[id], select[id], textarea[id]")) {
    const type = String(control.type || "").toLowerCase();
    if (["button", "submit", "reset", "file", "password"].includes(type) || control.disabled || control.readOnly) {
      continue;
    }
    fields[control.id] = type === "checkbox" || type === "radio" ? control.checked : control.value;
  }
  if (activeModuleKey === "pipeline") {
    fields.__pipelineArrays = {
      axleLoads: [...axleLoads],
      tirePressures: [...tirePressures],
      tireWidths: [...tireWidths],
      contactAreas: [...contactAreas],
      axleWidths: [...axleWidths],
      axleSpacings: [...axleSpacings],
      trackLengths: [...trackLengths],
    };
  }
  return fields;
}

function restoreModuleFields(fields) {
  const changedControls = [];
  for (const [id, value] of Object.entries(fields || {})) {
    if (id.startsWith("__")) {
      continue;
    }
    const control = $(id);
    if (!control) {
      continue;
    }
    const type = String(control.type || "").toLowerCase();
    if (type === "checkbox" || type === "radio") {
      control.checked = Boolean(value);
    } else {
      control.value = value;
    }
    changedControls.push(control);
  }
  if (activeModuleKey === "pipeline" && fields?.__pipelineArrays) {
    const arrays = fields.__pipelineArrays;
    axleLoads.splice(0, axleLoads.length, ...(arrays.axleLoads || []));
    tirePressures.splice(0, tirePressures.length, ...(arrays.tirePressures || []));
    tireWidths.splice(0, tireWidths.length, ...(arrays.tireWidths || []));
    contactAreas.splice(0, contactAreas.length, ...(arrays.contactAreas || []));
    axleWidths.splice(0, axleWidths.length, ...(arrays.axleWidths || []));
    axleSpacings.splice(0, axleSpacings.length, ...(arrays.axleSpacings || []));
    trackLengths.splice(0, trackLengths.length, ...(arrays.trackLengths || []));
  } else if (activeModuleKey === "pipeline") {
    axleLoads.splice(0, axleLoads.length, ...(fields?.axleLoads || axleLoads));
    tirePressures.splice(0, tirePressures.length, ...(fields?.tirePressures || tirePressures));
    tireWidths.splice(0, tireWidths.length, ...(fields?.tireWidths || tireWidths));
    contactAreas.splice(0, contactAreas.length, ...(fields?.contactAreas || contactAreas));
    axleWidths.splice(0, axleWidths.length, ...(fields?.axleWidths || axleWidths));
    axleSpacings.splice(0, axleSpacings.length, ...(fields?.axleSpacings || axleSpacings));
    trackLengths.splice(0, trackLengths.length, ...(fields?.trackLengths || trackLengths));
  }
  for (const control of changedControls) {
    control.dispatchEvent(new Event("change", { bubbles: true }));
    control.dispatchEvent(new Event("input", { bubbles: true }));
  }
  if (activeModuleKey === "pipeline") {
    syncGradeState();
    applySoilProfile();
    syncBendingStrainMode();
    syncFatigueInputs();
    renderSchematic();
  } else if (activeModuleKey === "rstreng") {
    renderRstrengProfileChart(null);
  } else if (activeModuleKey === "sccColony") {
    renderSccColonyVisualization(null);
  } else if (activeModuleKey === "interaction") {
    renderInteractionVisuals(null);
  } else if (activeModuleKey === "iliToFea") {
    renderIliToFeaVisualization(null);
  }
}

function showApplication(username, role, sessionId = "") {
  activeUser = sanitizeUserName(username);
  activeRole = role || "user";
  activeSessionId = sessionId;
  sessionStartedAtMs = Date.now();
  saveActiveSession(activeUser, activeRole, activeSessionId);
  activeModuleKey = "";
  $("currentUser").textContent = activeUser;
  document.body.classList.remove("auth-locked");
  document.body.classList.remove("access-pending");
  $("loginScreen").hidden = true;
  $("expiredPasswordPanel").hidden = true;
  $("passwordPanel").classList.add("is-hidden");
  $("adminModuleOption").hidden = activeRole !== "admin";
  if (activeRole === "admin") {
    $("adminUserName").value = activeUser;
  }
  showModuleHome();
  refreshSavedAssessmentSelect();
  $("statusPill").textContent = "Logged in";
  $("errorBox").hidden = true;
}

async function initializeAccessMode() {
  try {
    const response = await fetch("/api/runtime-config");
    const config = await response.json();
    if (response.ok && config.ok && config.no_login) {
      noLoginMode = true;
      document.body.classList.add("no-login-mode");
      showApplication(config.local_user || "local-user", "user", "");
      $("moduleSelector").hidden = false;
      $("statusPill").textContent = "Local access";
      return;
    }
  } catch {
    // The authenticated version remains the default if runtime configuration is unavailable.
  }
  await restoreActiveSession();
  document.body.classList.remove("access-pending");
}

function updateModuleSelectState(moduleKey = activeModuleKey) {
  $("moduleSelect").value = moduleKey || "";
  $("moduleSelectSummary").textContent = moduleKey
    ? moduleSummaries[moduleKey] || "Module loaded."
    : "Select a module to open its inputs, outputs, and report tools.";
  $("calculationManager").hidden = !modulePageIds[moduleKey];
  if (modulePageIds[moduleKey]) {
    $("assessmentName").value = `Untitled ${moduleUsageLabels[moduleKey] || "calculation"}`;
    refreshSavedAssessmentSelect();
  }
}

function renderHelpInstructions() {
  const visibleKeys = Object.keys(moduleUsageLabels).filter((moduleKey) => moduleKey !== "admin" || activeRole === "admin");
  $("helpModuleInstructions").innerHTML = visibleKeys
    .map((moduleKey) => {
      const items = moduleInstructionNotes[moduleKey] || [];
      return `
        <article class="help-module-note">
          <h3>${escapeHtml(moduleUsageLabels[moduleKey])}</h3>
          <ol>
            ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ol>
        </article>
      `;
    })
    .join("");
}

function openHelpDialog() {
  renderHelpInstructions();
  $("helpDialogOverlay").hidden = false;
}

function closeHelpDialog() {
  $("helpDialogOverlay").hidden = true;
}

async function handleModuleSelection() {
  const moduleKey = $("moduleSelect").value;
  if (!moduleKey) {
    showModuleHome();
    return;
  }
  if (moduleKey !== "iliToFea") {
    $("iliToFeaPage").hidden = true;
  }
  const showModule = moduleShowHandlers[moduleKey];
  if (showModule) {
    await showModule();
  }
}

async function restoreActiveSession() {
  const stored = readActiveSession();
  if (!stored) {
    return;
  }
  try {
    const response = await fetch("/api/session-restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: stored.username, session_id: stored.session_id }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Stored session is no longer active.");
    }
    showApplication(payload.user.username, payload.user.role, payload.session_id || stored.session_id);
    await loadAdminConfig();
    $("moduleSelector").hidden = false;
    $("statusPill").textContent = "Session restored";
  } catch {
    clearActiveSession();
  }
}

function showModuleHome() {
  activeModuleKey = "";
  $("moduleSelector").hidden = false;
  updateModuleSelectState("");
  $("adminPage").hidden = true;
  $("pipelinePage").hidden = true;
  $("corlasPage").hidden = true;
  $("sccColonyPage").hidden = true;
  $("crackGrowthPage").hidden = true;
  $("iliScreeningPage").hidden = true;
  $("annexKPage").hidden = true;
  $("dentPage").hidden = true;
  $("b31gPage").hidden = true;
  $("rstrengPage").hidden = true;
  $("prciDentPage").hidden = true;
  $("interactionPage").hidden = true;
  $("iliToFeaPage").hidden = true;
}

function showPipelineAssessment() {
  activeModuleKey = "pipeline";
  sendSessionActivity("pipeline");
  $("moduleSelector").hidden = false;
  updateModuleSelectState("pipeline");
  $("adminPage").hidden = true;
  $("pipelinePage").hidden = false;
  $("corlasPage").hidden = true;
  $("sccColonyPage").hidden = true;
  $("crackGrowthPage").hidden = true;
  $("iliScreeningPage").hidden = true;
  $("annexKPage").hidden = true;
  $("dentPage").hidden = true;
  $("b31gPage").hidden = true;
  $("rstrengPage").hidden = true;
  $("prciDentPage").hidden = true;
  $("interactionPage").hidden = true;
  $("statusPill").textContent = "Pipeline";
}

function showCorlasAssessment() {
  activeModuleKey = "corlas";
  sendSessionActivity("corlas");
  $("moduleSelector").hidden = false;
  updateModuleSelectState("corlas");
  $("adminPage").hidden = true;
  $("pipelinePage").hidden = true;
  $("corlasPage").hidden = false;
  $("sccColonyPage").hidden = true;
  $("crackGrowthPage").hidden = true;
  $("iliScreeningPage").hidden = true;
  $("annexKPage").hidden = true;
  $("dentPage").hidden = true;
  $("b31gPage").hidden = true;
  $("rstrengPage").hidden = true;
  $("prciDentPage").hidden = true;
  $("interactionPage").hidden = true;
  $("statusPill").textContent = "CorLAS";
}

function showSccColonyAssessment() {
  activeModuleKey = "sccColony";
  sendSessionActivity("sccColony");
  $("moduleSelector").hidden = false;
  updateModuleSelectState("sccColony");
  $("adminPage").hidden = true;
  $("pipelinePage").hidden = true;
  $("corlasPage").hidden = true;
  $("sccColonyPage").hidden = false;
  $("crackGrowthPage").hidden = true;
  $("iliScreeningPage").hidden = true;
  $("annexKPage").hidden = true;
  $("dentPage").hidden = true;
  $("b31gPage").hidden = true;
  $("rstrengPage").hidden = true;
  $("prciDentPage").hidden = true;
  $("interactionPage").hidden = true;
  $("statusPill").textContent = "SCC Colony";
}

function showCrackGrowthAssessment() {
  activeModuleKey = "crackGrowth";
  sendSessionActivity("crackGrowth");
  $("moduleSelector").hidden = false;
  updateModuleSelectState("crackGrowth");
  $("adminPage").hidden = true;
  $("pipelinePage").hidden = true;
  $("corlasPage").hidden = true;
  $("sccColonyPage").hidden = true;
  $("crackGrowthPage").hidden = false;
  $("iliScreeningPage").hidden = true;
  $("annexKPage").hidden = true;
  $("dentPage").hidden = true;
  $("b31gPage").hidden = true;
  $("rstrengPage").hidden = true;
  $("prciDentPage").hidden = true;
  $("interactionPage").hidden = true;
  $("statusPill").textContent = "Crack Growth";
}

function showIliScreeningAssessment() {
  activeModuleKey = "iliScreening";
  sendSessionActivity("iliScreening");
  $("moduleSelector").hidden = false;
  updateModuleSelectState("iliScreening");
  $("adminPage").hidden = true;
  $("pipelinePage").hidden = true;
  $("corlasPage").hidden = true;
  $("sccColonyPage").hidden = true;
  $("crackGrowthPage").hidden = true;
  $("iliScreeningPage").hidden = false;
  $("iliToFeaPage").hidden = true;
  $("annexKPage").hidden = true;
  $("dentPage").hidden = true;
  $("b31gPage").hidden = true;
  $("rstrengPage").hidden = true;
  $("prciDentPage").hidden = true;
  $("interactionPage").hidden = true;
  $("statusPill").textContent = "ILI Screening";
}

function showIliToFeaAssessment() {
  activeModuleKey = "iliToFea";
  sendSessionActivity("iliToFea");
  $("moduleSelector").hidden = false;
  updateModuleSelectState("iliToFea");
  $("adminPage").hidden = true;
  $("pipelinePage").hidden = true;
  $("corlasPage").hidden = true;
  $("sccColonyPage").hidden = true;
  $("crackGrowthPage").hidden = true;
  $("iliScreeningPage").hidden = true;
  $("iliToFeaPage").hidden = false;
  $("annexKPage").hidden = true;
  $("dentPage").hidden = true;
  $("b31gPage").hidden = true;
  $("rstrengPage").hidden = true;
  $("prciDentPage").hidden = true;
  $("interactionPage").hidden = true;
  renderIliToFeaVisualization(latestIliToFeaResult);
  $("statusPill").textContent = "ILI-to-FEA";
}

function showAnnexKAssessment() {
  activeModuleKey = "annexK";
  sendSessionActivity("annexK");
  $("moduleSelector").hidden = false;
  updateModuleSelectState("annexK");
  $("adminPage").hidden = true;
  $("pipelinePage").hidden = true;
  $("corlasPage").hidden = true;
  $("sccColonyPage").hidden = true;
  $("crackGrowthPage").hidden = true;
  $("iliScreeningPage").hidden = true;
  $("annexKPage").hidden = false;
  $("dentPage").hidden = true;
  $("b31gPage").hidden = true;
  $("rstrengPage").hidden = true;
  $("prciDentPage").hidden = true;
  $("interactionPage").hidden = true;
  $("statusPill").textContent = "Annex K ECA";
}

function showDentAssessment() {
  activeModuleKey = "dent";
  sendSessionActivity("dent");
  $("moduleSelector").hidden = false;
  updateModuleSelectState("dent");
  $("adminPage").hidden = true;
  $("pipelinePage").hidden = true;
  $("corlasPage").hidden = true;
  $("sccColonyPage").hidden = true;
  $("crackGrowthPage").hidden = true;
  $("iliScreeningPage").hidden = true;
  $("annexKPage").hidden = true;
  $("dentPage").hidden = false;
  $("b31gPage").hidden = true;
  $("rstrengPage").hidden = true;
  $("prciDentPage").hidden = true;
  $("interactionPage").hidden = true;
  $("statusPill").textContent = "Dent";
}

function showB31gAssessment() {
  activeModuleKey = "b31g";
  sendSessionActivity("b31g");
  $("moduleSelector").hidden = false;
  updateModuleSelectState("b31g");
  $("adminPage").hidden = true;
  $("pipelinePage").hidden = true;
  $("corlasPage").hidden = true;
  $("sccColonyPage").hidden = true;
  $("crackGrowthPage").hidden = true;
  $("iliScreeningPage").hidden = true;
  $("annexKPage").hidden = true;
  $("dentPage").hidden = true;
  $("b31gPage").hidden = false;
  $("rstrengPage").hidden = true;
  $("prciDentPage").hidden = true;
  $("interactionPage").hidden = true;
  $("statusPill").textContent = "Modified B31.G";
}

function showRstrengAssessment() {
  activeModuleKey = "rstreng";
  sendSessionActivity("rstreng");
  $("moduleSelector").hidden = false;
  updateModuleSelectState("rstreng");
  $("adminPage").hidden = true;
  $("pipelinePage").hidden = true;
  $("corlasPage").hidden = true;
  $("sccColonyPage").hidden = true;
  $("crackGrowthPage").hidden = true;
  $("iliScreeningPage").hidden = true;
  $("annexKPage").hidden = true;
  $("dentPage").hidden = true;
  $("b31gPage").hidden = true;
  $("rstrengPage").hidden = false;
  $("prciDentPage").hidden = true;
  $("interactionPage").hidden = true;
  renderRstrengProfileChart(latestRstrengResult);
  $("statusPill").textContent = "RSTRENG";
}

function showPrciDentAssessment() {
  activeModuleKey = "prciDent";
  sendSessionActivity("prciDent");
  $("moduleSelector").hidden = false;
  updateModuleSelectState("prciDent");
  $("adminPage").hidden = true;
  $("pipelinePage").hidden = true;
  $("corlasPage").hidden = true;
  $("sccColonyPage").hidden = true;
  $("crackGrowthPage").hidden = true;
  $("iliScreeningPage").hidden = true;
  $("annexKPage").hidden = true;
  $("dentPage").hidden = true;
  $("b31gPage").hidden = true;
  $("rstrengPage").hidden = true;
  $("prciDentPage").hidden = false;
  $("interactionPage").hidden = true;
  $("statusPill").textContent = "PRCI Dent";
}

function showInteractionAssessment() {
  activeModuleKey = "interaction";
  sendSessionActivity("interaction");
  $("moduleSelector").hidden = false;
  updateModuleSelectState("interaction");
  $("adminPage").hidden = true;
  $("pipelinePage").hidden = true;
  $("corlasPage").hidden = true;
  $("sccColonyPage").hidden = true;
  $("crackGrowthPage").hidden = true;
  $("iliScreeningPage").hidden = true;
  $("annexKPage").hidden = true;
  $("dentPage").hidden = true;
  $("b31gPage").hidden = true;
  $("rstrengPage").hidden = true;
  $("prciDentPage").hidden = true;
  $("interactionPage").hidden = false;
  renderInteractionVisuals(latestInteractionResult);
  $("statusPill").textContent = "FEA Model";
}

async function showAdminManagement() {
  if (activeRole !== "admin") {
    return;
  }
  activeModuleKey = "admin";
  await sendSessionActivity("admin");
  $("moduleSelector").hidden = false;
  updateModuleSelectState("admin");
  $("adminPage").hidden = false;
  $("pipelinePage").hidden = true;
  $("corlasPage").hidden = true;
  $("sccColonyPage").hidden = true;
  $("crackGrowthPage").hidden = true;
  $("iliScreeningPage").hidden = true;
  $("annexKPage").hidden = true;
  $("dentPage").hidden = true;
  $("b31gPage").hidden = true;
  $("rstrengPage").hidden = true;
  $("prciDentPage").hidden = true;
  $("interactionPage").hidden = true;
  $("statusPill").textContent = "Admin";
  await loadAdminConfig();
}

async function loginUser() {
  $("loginError").hidden = true;
  $("expiredPasswordPanel").hidden = true;
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: $("loginUserName").value, password: $("loginPassword").value }),
    });
    const payload = await response.json();
    if (payload.require_password_change) {
      passwordChangeUser = payload.username || $("loginUserName").value;
      $("expiredPasswordPanel").hidden = false;
      $("loginError").textContent = payload.error || "Password expired. Change your password to continue.";
      $("loginError").hidden = false;
      return;
    }
    if (!payload.ok) {
      throw new Error(payload.error || "Login failed.");
    }
    showApplication(payload.user.username, payload.user.role, payload.session_id || "");
    await loadAdminConfig();
    $("moduleSelector").hidden = false;
    $("adminPage").hidden = true;
    $("pipelinePage").hidden = true;
    $("corlasPage").hidden = true;
    $("sccColonyPage").hidden = true;
    $("crackGrowthPage").hidden = true;
    $("iliScreeningPage").hidden = true;
    $("annexKPage").hidden = true;
    $("dentPage").hidden = true;
    $("b31gPage").hidden = true;
    $("rstrengPage").hidden = true;
    $("prciDentPage").hidden = true;
    $("interactionPage").hidden = true;
  } catch (error) {
    $("loginError").textContent = error.message;
    $("loginError").hidden = false;
  }
}

async function submitExpiredPasswordChange() {
  const newPassword = $("expiredNewPassword").value;
  const confirmPassword = $("expiredConfirmPassword").value;
  $("loginError").hidden = true;
  if (newPassword !== confirmPassword) {
    $("loginError").textContent = "New password and confirmation do not match.";
    $("loginError").hidden = false;
    return;
  }
  try {
    const response = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: passwordChangeUser || $("loginUserName").value,
        current_password: $("loginPassword").value,
        new_password: newPassword,
      }),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Unable to change password.");
    }
    $("loginPassword").value = newPassword;
    $("expiredNewPassword").value = "";
    $("expiredConfirmPassword").value = "";
    $("expiredPasswordPanel").hidden = true;
    showApplication(payload.user.username, payload.user.role, payload.session_id || activeSessionId);
    await loadAdminConfig();
  } catch (error) {
    $("loginError").textContent = error.message;
    $("loginError").hidden = false;
  }
}

function logoutUser() {
  if (noLoginMode) {
    showModuleHome();
    $("statusPill").textContent = "Local access";
    return;
  }
  sendSessionActivity(activeModuleKey, true);
  clearActiveSession();
  activeUser = "";
  activeRole = "";
  activeSessionId = "";
  sessionStartedAtMs = 0;
  activeModuleKey = "";
  document.body.classList.add("auth-locked");
  $("loginScreen").hidden = false;
  $("expiredPasswordPanel").hidden = true;
  $("passwordPanel").classList.add("is-hidden");
  $("moduleSelector").hidden = true;
  $("adminModuleOption").hidden = true;
  updateModuleSelectState("");
  closeHelpDialog();
  $("adminPage").hidden = true;
  $("pipelinePage").hidden = true;
  $("corlasPage").hidden = true;
  $("sccColonyPage").hidden = true;
  $("crackGrowthPage").hidden = true;
  $("iliScreeningPage").hidden = true;
  $("annexKPage").hidden = true;
  $("dentPage").hidden = true;
  $("b31gPage").hidden = true;
  $("rstrengPage").hidden = true;
  $("prciDentPage").hidden = true;
  $("interactionPage").hidden = true;
  $("savedAssessmentSelect").innerHTML = "";
  $("statusPill").textContent = "Logged out";
}

function refreshSavedAssessmentSelect() {
  if (!isLoggedIn() || !modulePageIds[activeModuleKey]) {
    return;
  }
  const assessments = savedCalculationsForModule();
  const names = Object.keys(assessments).sort((a, b) => a.localeCompare(b));
  const select = $("savedAssessmentSelect");
  select.innerHTML = "";
  const placeholder = new Option(names.length === 0 ? "No saved calculations" : "Select calculation", "");
  select.add(placeholder);
  for (const name of names) {
    select.add(new Option(name, name));
  }
}

async function loadAdminConfig() {
  if (activeRole !== "admin") {
    return;
  }
  const auth = adminAuthPayload();
  if (!auth.admin_username || (!auth.admin_password && !auth.session_id)) {
    $("adminMessage").textContent = "Open this page as an admin or enter admin credentials to load backend users.";
    return;
  }
  try {
    const response = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(auth),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Unable to load admin configuration.");
    }
    renderAdminUserTable(payload.users);
    $("adminMessage").textContent = `Backend users loaded: ${Array.isArray(payload.users) ? payload.users.length : 0}`;
  } catch (error) {
    $("adminMessage").textContent = error.message;
  }
}

function formatHours(seconds) {
  const hours = Number(seconds || 0) / 3600;
  if (!Number.isFinite(hours) || hours <= 0) {
    return "0.00";
  }
  return hours < 10 ? hours.toFixed(2) : hours.toFixed(1);
}

function formatDateOrEmpty(value, emptyText = "No expiry") {
  return value ? String(value) : emptyText;
}

function renderAdminUserTable(users) {
  const body = $("adminUserTableBody");
  if (!Array.isArray(users) || users.length === 0) {
    body.innerHTML = `<tr><td colspan="8">No backend users found.</td></tr>`;
    return;
  }
  body.innerHTML = users
    .map((user) => {
      const displayName = user.full_name || user.username;
      const modules = Array.isArray(user.modules_used) && user.modules_used.length > 0 ? user.modules_used.join(", ") : "None recorded";
      return `
        <tr>
          <td>${escapeHtml(displayName)}</td>
          <td>${escapeHtml(user.username || "")}</td>
          <td>${escapeHtml(user.role || "user")}</td>
          <td>${escapeHtml(formatDateOrEmpty(user.account_expires_at))}</td>
          <td>${escapeHtml(formatDateOrEmpty(user.password_expires_at, "Not set"))}</td>
          <td>${escapeHtml(String(user.session_count || 0))}</td>
          <td>${escapeHtml(formatHours(user.total_session_seconds))}</td>
          <td>${escapeHtml(modules)}</td>
        </tr>
      `;
    })
    .join("");
}

function formatAdminUsers(users) {
  if (!Array.isArray(users)) {
    return "";
  }
  return users
    .map((user) => {
      if (typeof user === "string") {
        return user;
      }
      const expires = user.account_expires_at ? `expires ${user.account_expires_at}` : "no login expiry";
      const passwordExpires = user.password_expires_at ? `password ${user.password_expires_at}` : "password expiry not set";
      const name = user.full_name ? `${user.full_name}, ` : "";
      const email = user.email ? `${user.email}, ` : "";
      return `${user.username} (${name}${email}${user.role}, ${expires}, ${passwordExpires})`;
    })
    .join("; ");
}

async function saveAdminUser() {
  try {
    const auth = adminAuthPayload();
    const response = await fetch("/api/admin/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...auth,
        username: $("adminTargetUser").value,
        full_name: $("adminTargetFullName").value,
        email: $("adminTargetEmail").value,
        password: $("adminTargetPassword").value,
        role: $("adminTargetRole").value,
        account_expires_at: $("adminAccountExpiresAt").value,
      }),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Unable to save user.");
    }
    $("adminTargetPassword").value = "";
    renderAdminUserTable(payload.users);
    $("adminMessage").textContent = `Updated users: ${formatAdminUsers(payload.users)}`;
  } catch (error) {
    $("adminMessage").textContent = error.message;
  }
}

async function deleteAdminUser() {
  const username = $("adminTargetUser").value.trim();
  if (!username) {
    $("adminMessage").textContent = "Enter the user to delete.";
    return;
  }
  const confirmed = window.confirm(`Delete user "${username}"? Saved assessments for that browser profile will not be removed automatically.`);
  if (!confirmed) {
    $("adminMessage").textContent = "Delete cancelled.";
    return;
  }
  try {
    const auth = adminAuthPayload();
    const response = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...auth,
        username,
      }),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Unable to delete user.");
    }
    renderAdminUserTable(payload.users);
    $("adminMessage").textContent = `Updated users: ${formatAdminUsers(payload.users)}`;
  } catch (error) {
    $("adminMessage").textContent = error.message;
  }
}

function showPasswordPanel() {
  $("passwordPanel").classList.remove("is-hidden");
  $("passwordMessage").textContent = "Enter your current password and a new password.";
}

function hidePasswordPanel() {
  $("passwordPanel").classList.add("is-hidden");
  $("currentPassword").value = "";
  $("newPassword").value = "";
  $("confirmPassword").value = "";
}

async function changeCurrentUserPassword() {
  const newPassword = $("newPassword").value;
  if (newPassword !== $("confirmPassword").value) {
    $("passwordMessage").textContent = "New password and confirmation do not match.";
    return;
  }
  try {
    const response = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: activeUser,
        current_password: $("currentPassword").value,
        new_password: newPassword,
      }),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Unable to change password.");
    }
    $("passwordMessage").textContent = `Password updated. Next expiration: ${payload.user.password_expires_at}.`;
    $("currentPassword").value = "";
    $("newPassword").value = "";
    $("confirmPassword").value = "";
    $("statusPill").textContent = "Password changed";
  } catch (error) {
    $("passwordMessage").textContent = error.message;
  }
}

function saveAssessment() {
  const name = $("assessmentName").value.trim();
  if (!name) {
    showError("Calculation name is required before saving.");
    return;
  }
  if (!modulePageIds[activeModuleKey]) {
    showError("Open a calculation module before saving.");
    return;
  }
  const library = loadSavedAssessments();
  library.modules ||= {};
  library.modules[activeModuleKey] ||= {};
  library.modules[activeModuleKey][name] = {
    savedAt: new Date().toISOString(),
    moduleKey: activeModuleKey,
    fields: captureModuleFields(),
  };
  writeSavedAssessments(library);
  refreshSavedAssessmentSelect();
  $("savedAssessmentSelect").value = name;
  $("statusPill").textContent = "Saved";
  $("calculationManagerNote").textContent = `${moduleUsageLabels[activeModuleKey]} calculation saved for ${activeUser}.`;
  $("errorBox").hidden = true;
}

function loadAssessment() {
  const name = $("savedAssessmentSelect").value;
  if (!name) {
    showError("Select a saved calculation to load.");
    return;
  }
  const assessments = savedCalculationsForModule();
  if (!assessments[name]) {
    showError("Saved calculation was not found.");
    refreshSavedAssessmentSelect();
    return;
  }
  $("assessmentName").value = name;
  restoreModuleFields(assessments[name].fields);
  $("statusPill").textContent = "Loaded";
  $("calculationManagerNote").textContent = `${name} loaded. Run the module calculation to refresh results.`;
  $("errorBox").hidden = true;
}

function deleteAssessment() {
  const name = $("savedAssessmentSelect").value;
  if (!name) {
    showError("Select a saved calculation to delete.");
    return;
  }
  const library = loadSavedAssessments();
  const assessments = library.modules?.[activeModuleKey] || {};
  if (!assessments[name]) {
    showError("Saved calculation was not found.");
    refreshSavedAssessmentSelect();
    return;
  }
  const confirmed = window.confirm(`Delete saved calculation "${name}"? This action cannot be undone.`);
  if (!confirmed) {
    $("statusPill").textContent = "Ready";
    return;
  }
  delete assessments[name];
  writeSavedAssessments(library);
  refreshSavedAssessmentSelect();
  $("statusPill").textContent = "Deleted";
  $("calculationManagerNote").textContent = `${name} was deleted.`;
  $("errorBox").hidden = true;
}

function currentSmysPsi() {
  const selectedGrade = $("grade").value;
  const selectedSmys = selectedGrade === "custom" ? 0 : Number(selectedGrade);
  return selectedSmys > 0 ? selectedSmys : valueOf("customSmys");
}

function buildAssessmentStatus(result, mitigation = null) {
  const mop = result.mop;
  const pipeMeta = result.vehicle.pipe;
  const smys = Math.max(currentSmysPsi(), 1e-9);
  const mitigationApplied = Boolean(mitigation && mitigation.applied);
  const assessmentStress = mitigationApplied ? mitigation.assessment : mop.assessment_stress_psi;
  const assessmentPercent = (100 * assessmentStress) / smys;
  const passes = assessmentPercent <= pipeMeta.hoop_limit_percent_smys;
  const bendingStrainIncluded = Math.abs(Number(mop.pre_existing_bending_strain_microstrain) || 0) > 0.000001;
  const strainPhrase = bendingStrainIncluded ? " including pre-existing bending strain" : "";
  const limitPhrase =
    `CSA Z662 Class ${pipeMeta.class_location} limit: ${fmt(pipeMeta.hoop_limit_percent_smys, 1)}% SMYS (${fmt(pipeMeta.hoop_limit_psi)} psi).`;
  const detail = mitigationApplied
    ? `${fmt(assessmentPercent, 2)}% of SMYS at MAOP after ${textOfMitigationType()} mitigation${strainPhrase}. ` +
      `Unmitigated: ${fmt(mop.assessment_percent_smys, 2)}% of SMYS. ${limitPhrase}`
    : `${fmt(mop.assessment_percent_smys, 2)}% of SMYS at MAOP${strainPhrase}. ${limitPhrase}`;
  return {
    passes,
    statusText: passes ? "PASS" : "FAIL",
    assessmentStress,
    assessmentPercent,
    detail,
    mitigationApplied,
  };
}

function setAssessmentStatus(result, mitigation = null) {
  const status = buildAssessmentStatus(result, mitigation);
  $("totalHoop").textContent = `${fmt(status.assessmentStress)} psi`;
  $("smysMeter").value = Math.min(status.assessmentPercent, 100);
  $("smysText").textContent = `${fmt(status.assessmentPercent, 2)}% of SMYS`;
  $("passFailBox").className = `pass-fail-box ${status.passes ? "pass-fail-pass" : "pass-fail-fail"}`;
  $("passFailStatus").textContent = status.statusText;
  $("passFailDetail").textContent = status.detail;
  return status;
}

function setOutput(result) {
  latestResult = result;
  const mop = result.mop;
  const zero = result.zero_pressure;
  const mitigation = calculateMitigationResult(result);
  setAssessmentStatus(result, mitigation);
  $("liveHoop").textContent = `${fmt(mop.live_hoop_bending_psi)} psi`;
  $("hoopSubtotal").textContent = `${fmt(mop.total_hoop_stress_psi)} psi`;
  $("bendingStrainStress").textContent = `${fmt(mop.pre_existing_bending_stress_psi)} psi`;
  $("totalBendingStrain").textContent = `${fmt(mop.pre_existing_bending_strain_microstrain, 1)} microstrain`;
  $("soilHoop").textContent = `${fmt(mop.soil_hoop_bending_psi)} psi`;
  $("pressureHoop").textContent = `${fmt(mop.pressure_hoop_psi)} psi`;
  $("livePressure").textContent = `${fmt(result.critical_position.live_pressure_psi, 3)} psi`;
  $("criticalPosition").textContent = `${fmt(result.critical_position.vehicle_position_in, 2)} in`;
  $("zeroPressureTotal").textContent = `${fmt(zero.total_hoop_stress_psi)} psi`;
  $("pointLoadCount").textContent = `${result.vehicle.point_load_count}`;
  $("loadPerPoint").textContent = `${fmt(result.vehicle.average_point_load_lb)} lb`;
  $("contactPressure").textContent = `${fmt(result.vehicle.contact_pressure_psi, 1)} psi`;
  setFatigueOutput(calculateFatigueResult(mop.live_hoop_bending_psi));
  setMitigationOutput(mitigation);
}

function calculateMitigationResult(result) {
  const type = $("mitigationType").value;
  const width = valueOf("mitigationWidth");
  const length = valueOf("mitigationLength");
  const thickness = valueOf("mitigationThickness");
  const spreadAngle = valueOf("mitigationSpreadAngle");
  const unitWeight = valueOf("mitigationUnitWeight");
  if (type === "none" || width <= 0 || length <= 0) {
    return {
      applied: false,
      factor: 1,
      liveHoop: result.mop.live_hoop_bending_psi,
      hoopStress: result.mop.total_hoop_stress_psi,
      assessment: result.mop.assessment_stress_psi,
    };
  }
  const payload = readPayload();
  const media = mitigationMedia[type] || mitigationMedia.custom;
  const contactAreas = payload.vehicle.contact_areas_in2 || [payload.vehicle.contact_area_in2 || 1];
  const loadedContactArea =
    payload.vehicle.vehicle_type === "track"
      ? contactAreas.reduce((sum, area) => sum + Math.max(area, 0), 0)
      : contactAreas.reduce((sum, area) => sum + Math.max(area, 0) * 2, 0);
  const spread = Math.max(thickness, 0) * Math.tan((Math.max(0, Math.min(spreadAngle, 89)) * Math.PI) / 180);
  const effectiveWidth = Math.max(width + 2 * spread, 1);
  const effectiveLength = Math.max(length + 2 * spread, 1);
  const effectiveArea = effectiveWidth * effectiveLength;
  const areaRatio = Math.max(0, Math.min(1, Math.max(loadedContactArea, 1) / effectiveArea));
  const stiffnessAreaFactor = Math.pow(areaRatio, Math.max(media.stiffness, 0.05));
  const pipeInfluenceWidth = Math.max(payload.pipe.outside_diameter_in + 2 * payload.soil.cover_in, payload.pipe.outside_diameter_in);
  const pipeInfluenceLength = pipeInfluenceWidth;
  const coverageFactor = Math.max(
    0,
    Math.min(1, width / pipeInfluenceWidth) * Math.min(1, length / pipeInfluenceLength),
  );
  const bypassFactor = Math.max(0, Math.min(1, media.bypass * coverageFactor));
  const transferredLiveFactor = Math.max(
    media.minFactor,
    Math.min(1, stiffnessAreaFactor * media.transferability * (1 - bypassFactor)),
  );
  const selfWeightPressurePsi = Math.max(0, unitWeight) * Math.max(0, thickness) / 1728;
  const livePressure = Math.max(result.critical_position.live_pressure_psi, 1e-9);
  const selfWeightHoop = (selfWeightPressurePsi / livePressure) * result.mop.live_hoop_bending_psi;
  const liveHoop = result.mop.live_hoop_bending_psi * transferredLiveFactor + selfWeightHoop;
  const hoopStress = result.mop.total_hoop_stress_psi - result.mop.live_hoop_bending_psi + liveHoop;
  const assessment = result.mop.assessment_stress_psi - result.mop.live_hoop_bending_psi + liveHoop;
  return {
    applied: true,
    factor: transferredLiveFactor,
    liveHoop,
    hoopStress,
    assessment,
    percentSmys: (100 * hoopStress) / Math.max(currentSmysPsi(), 1e-9),
    effectiveArea,
    effectiveWidth,
    effectiveLength,
    loadedContactArea,
    areaRatio,
    stiffnessAreaFactor,
    bypassFactor,
    coverageFactor,
    selfWeightPressurePsi,
    selfWeightHoop,
    mediaDescription: media.description,
  };
}

function setMitigationOutput(mitigation) {
  if (!mitigation.applied) {
    $("mitigatedAssessment").textContent = "Not applied";
    $("mitigatedLiveHoop").textContent = `${fmt(mitigation.liveHoop)} psi`;
    $("mitigatedStressRatio").textContent = "0% SMYS";
    $("mitigationLoadFactor").textContent = "1";
    $("mitigationSummary").textContent = "No mitigation is included.";
    return;
  }
  const smys = currentSmysPsi();
  const percent = smys > 0 ? (100 * mitigation.assessment) / smys : 0;
  $("mitigatedAssessment").textContent = `${fmt(mitigation.assessment)} psi`;
  $("mitigatedLiveHoop").textContent = `${fmt(mitigation.liveHoop)} psi`;
  $("mitigatedStressRatio").textContent = `${fmt(percent, 2)}% SMYS`;
  $("mitigationLoadFactor").textContent = fmt(mitigation.factor, 4);
  $("mitigationSummary").textContent =
    `Mitigation applied using ${textOfMitigationType()}: concentrated contact area ${fmt(mitigation.loadedContactArea, 1)} in2 is distributed over ${fmt(mitigation.effectiveArea, 1)} in2. ` +
    `Medium model: ${mitigation.mediaDescription}; bypass ${fmt(mitigation.bypassFactor * 100, 1)}%, live-load transfer factor ${fmt(mitigation.factor, 4)}. ` +
    `Mitigation self-weight adds ${fmt(mitigation.selfWeightHoop, 1)} psi hoop stress.`;
}

function refreshMitigationScenario() {
  if (!latestResult) {
    return;
  }
  const mitigation = calculateMitigationResult(latestResult);
  setMitigationOutput(mitigation);
  setAssessmentStatus(latestResult, mitigation);
}

function calculateFatigueResult(calculatedStressRangePsi = 0) {
  const enabled = $("fatigueEnabled").value === "on";
  const source = $("fatigueStressSource").value;
  const stressRange = source === "manual" ? valueOf("fatigueStressRange") : calculatedStressRangePsi;
  const appliedCycles = valueOf("fatigueCycles");
  const exponent = valueOf("fatigueExponent");
  const constant = valueOf("fatigueConstant");
  if (!enabled) {
    return {
      enabled,
      status: "Not checked",
      stressRangePsi: 0,
      appliedCycles,
      allowableCycles: 0,
      damageRatio: 0,
    };
  }
  if (stressRange <= 0 || appliedCycles <= 0 || exponent <= 0 || constant <= 0) {
    return {
      enabled,
      status: "Incomplete",
      stressRangePsi: stressRange,
      appliedCycles,
      allowableCycles: 0,
      damageRatio: 0,
    };
  }
  const allowableCycles = constant / stressRange ** exponent;
  const damageRatio = appliedCycles / allowableCycles;
  return {
    enabled,
    status: damageRatio <= 1 ? "PASS" : "FAIL",
    stressRangePsi: stressRange,
    appliedCycles,
    allowableCycles,
    damageRatio,
  };
}

function setFatigueOutput(fatigue) {
  $("fatigueStatus").textContent = fatigue.status;
  $("fatigueDamage").textContent = fmt(fatigue.damageRatio, 4);
  $("fatigueAllowableCycles").textContent = `${fmt(fatigue.allowableCycles, 0)} cycles`;
  $("fatigueStressRangeOutput").textContent = `${fmt(fatigue.stressRangePsi, 1)} psi`;
  if (fatigue.status === "FAIL") {
    $("fatigueSummary").textContent =
      `Fatigue FAIL: applied cycles exceed allowable cycles. Damage ratio ${fmt(fatigue.damageRatio, 4)}.`;
  } else if (fatigue.status === "PASS") {
    $("fatigueSummary").textContent =
      `Fatigue PASS: applied cycles are within allowable cycles. Damage ratio ${fmt(fatigue.damageRatio, 4)}.`;
  } else if (fatigue.status === "Incomplete") {
    $("fatigueSummary").textContent = "Enter a positive stress range, cycle count, S-N exponent, and fatigue constant.";
  } else {
    $("fatigueSummary").textContent = "Fatigue check is not included.";
  }
}

function buildReportData() {
  const payload = readPayload();
  const result = latestResult;
  const mop = result.mop;
  const zero = result.zero_pressure;
  const pipeMeta = result.vehicle.pipe;
  const generatedAt = new Date().toLocaleString();
  const loadRows = payload.vehicle.axle_loads_lb.map((load, index) => {
    const label = payload.vehicle.vehicle_type === "track" ? `Track station ${index + 1}` : `Axle ${index + 1}`;
    const widthLabel = payload.vehicle.vehicle_type === "track" ? "Track width" : "Tyre width";
    const length = payload.vehicle.track_lengths_in[index];
    const pieces = [`${fmt(load, 0)} lb`, `${widthLabel}: ${fmt(payload.vehicle.tire_widths_in[index], 1)} in`];
    if (payload.vehicle.vehicle_type !== "track") {
      pieces.splice(1, 0, `Tyre pressure: ${fmt(payload.vehicle.tire_pressures_psi[index], 1)} psi`);
    }
    if (payload.vehicle.vehicle_type === "track") {
      pieces.push(`Track length: ${fmt(length, 1)} in`);
    }
    return [label, pieces.join(" | ")];
  });

  const fatigue = calculateFatigueResult(mop.live_hoop_bending_psi);
  const mitigation = calculateMitigationResult(result);
  const assessmentStatus = buildAssessmentStatus(result, mitigation);
  return {
    title: "Pipeline Crossing Assessment Report",
    assessmentName: $("assessmentName").value || "Untitled assessment",
    generatedAt,
    passes: assessmentStatus.passes,
    statusText: assessmentStatus.statusText,
    passFailDetail: assessmentStatus.detail,
    sections: [
      {
        title: "Calculated Outputs",
        rows: [
          ["Assessment stress used for PASS/FAIL", `${fmt(assessmentStatus.assessmentStress)} psi`],
          ["Assessment stress ratio used for PASS/FAIL", `${fmt(assessmentStatus.assessmentPercent, 2)}% of SMYS`],
          ["Mitigation included in PASS/FAIL", mitigation.applied ? textOfMitigationType() : "No"],
          ["Unmitigated assessment stress at MAOP", `${fmt(mop.assessment_stress_psi)} psi`],
          ["Unmitigated assessment stress ratio", `${fmt(mop.assessment_percent_smys, 2)}% of SMYS`],
          ["CSA Z662 class limit", `${fmt(pipeMeta.hoop_limit_percent_smys, 1)}% SMYS (${fmt(pipeMeta.hoop_limit_psi)} psi)`],
          ["Live load hoop", `${fmt(mop.live_hoop_bending_psi)} psi`],
          ["Hoop stress subtotal", `${fmt(mop.total_hoop_stress_psi)} psi`],
          ["Bending strain stress", `${fmt(mop.pre_existing_bending_stress_psi)} psi`],
          ["Total bending strain", `${fmt(mop.pre_existing_bending_strain_microstrain, 1)} microstrain`],
          ["Soil hoop", `${fmt(mop.soil_hoop_bending_psi)} psi`],
          ["Pressure hoop", `${fmt(mop.pressure_hoop_psi)} psi`],
          ["Live pressure at pipe", `${fmt(result.critical_position.live_pressure_psi, 3)} psi`],
          ["Critical vehicle position", `${fmt(result.critical_position.vehicle_position_in, 2)} in`],
          ["Zero-pressure total", `${fmt(zero.total_hoop_stress_psi)} psi`],
          ["Point loads used", result.vehicle.point_load_count],
          ["Approx. load per point", `${fmt(result.vehicle.average_point_load_lb)} lb`],
          ["Contact pressure check", `${fmt(result.vehicle.contact_pressure_psi, 1)} psi`],
          ["Fatigue status", fatigue.status],
          ["Fatigue stress range", `${fmt(fatigue.stressRangePsi, 1)} psi`],
          ["Applied fatigue cycles", `${fmt(fatigue.appliedCycles, 0)} cycles`],
          ["Allowable fatigue cycles", `${fmt(fatigue.allowableCycles, 0)} cycles`],
          ["Fatigue damage ratio", fmt(fatigue.damageRatio, 4)],
          ["Mitigated assessment", mitigation.applied ? `${fmt(mitigation.assessment)} psi` : "Not applied"],
          ["Mitigated live-load hoop", mitigation.applied ? `${fmt(mitigation.liveHoop)} psi` : "Not applied"],
          ["Mitigation load factor", fmt(mitigation.factor, 4)],
          ["Mitigation effective area", mitigation.applied ? `${fmt(mitigation.effectiveArea, 1)} in2` : "Not applied"],
          ["Mitigation bypass", mitigation.applied ? `${fmt(mitigation.bypassFactor * 100, 1)}%` : "Not applied"],
          ["Mitigation self-weight hoop", mitigation.applied ? `${fmt(mitigation.selfWeightHoop, 1)} psi` : "Not applied"],
        ],
      },
      {
        title: "Pipeline Inputs",
        rows: [
          ["Outside diameter", `${fmt(payload.pipe.outside_diameter_in, 3)} in`],
          ["Wall thickness", `${fmt(payload.pipe.wall_thickness_in, 3)} in`],
          ["MAOP", `${fmt(payload.pipe.maop_psig, 0)} psig`],
          ["Class location", textOfSelect("classLocation")],
          ["Design factor", payload.pipe.design_factor],
          ["Grade / SMYS", `${textOfSelect("grade")} / ${fmt(payload.pipe.smys_psi, 0)} psi`],
          ["Young's modulus", `${fmt(payload.pipe.youngs_modulus_psi, 0)} psi`],
        ],
      },
      {
        title: "Vehicle Inputs",
        rows: [
          ["Vehicle preset", textOfSelect("vehiclePreset")],
          ["Vehicle type", textOfSelect("vehicleType")],
          ["Number of axles/stations", payload.vehicle.axle_count],
          ["Vehicle weight", `${fmt(valueOf("vehicleWeight"), 0)} lb`],
          ["Contact area", `${fmt(payload.vehicle.contact_area_in2, 1)} in2 per tire/track pad`],
          ["Axle width", `${fmt(payload.vehicle.axle_width_in, 1)} in`],
          ["Distance between axles", `${fmt(payload.vehicle.axle_spacing_in, 1)} in`],
          ["Crossing angle", `${fmt(payload.vehicle.crossing_angle_deg, 1)} deg`],
          ["Impact factor", payload.vehicle.impact_factor],
        ],
      },
      { title: "Axle / Track Loads", rows: loadRows },
      {
        title: "Soil Inputs",
        rows: [
          ["Soil profile", textOfSelect("soilProfile")],
          ["Soil load equation", textOfSelect("soilLoadModel")],
          ["Soil friction angle", `${fmt(payload.soil.friction_angle_deg, 1)} deg`],
          ["Surface layer thickness", `${fmt(payload.soil.surface_layer_thickness_in, 1)} in`],
          ["Surface layer unit weight", `${fmt(payload.soil.surface_layer_unit_weight_pcf, 1)} pcf`],
          ["Depth of cover", `${fmt(payload.soil.cover_in, 1)} in`],
          ["Soil unit weight", `${fmt(payload.soil.unit_weight_pcf, 1)} pcf`],
          ["Modulus of soil reaction", `${fmt(payload.soil.modulus_reaction_psi, 1)} psi`],
          ["Kb", payload.soil.kb],
          ["Kz", payload.soil.kz],
          ["Scan increment", `${fmt(payload.vehicle.scan_step_in, 1)} in`],
        ],
      },
      {
        title: "Pre-existing Bending Strain Inputs",
        rows: [
          ["Input mode", textOfSelect("bendingStrainMode")],
          ["Bending strain", `${fmt(payload.strain.bending_strain_microstrain, 1)} microstrain`],
          ["Pipe deflection", `${fmt(payload.strain.pipe_deflection_in, 2)} in`],
          ["Deflected pipe length", `${fmt(payload.strain.deflected_pipe_length_in, 1)} in`],
          ["Stress basis", textOfSelect("bendingStrainBasis")],
        ],
      },
      {
        title: "Fatigue Inputs",
        rows: [
          ["Fatigue check", textOfSelect("fatigueEnabled")],
          ["Stress range source", textOfSelect("fatigueStressSource")],
          ["Manual stress range", `${fmt(payload.fatigue.manual_stress_range_psi, 1)} psi`],
          ["Applied cycles", `${fmt(payload.fatigue.applied_cycles, 0)} cycles`],
          ["S-N exponent", payload.fatigue.exponent],
          ["Fatigue constant C", payload.fatigue.constant],
        ],
      },
      {
        title: "Surface Loading Mitigation Inputs",
        rows: [
          ["Mitigation type", textOfSelect("mitigationType")],
          ["Mitigation width", `${fmt(payload.mitigation.width_in, 1)} in`],
          ["Mitigation length", `${fmt(payload.mitigation.length_in, 1)} in`],
          ["Mitigation thickness", `${fmt(payload.mitigation.thickness_in, 2)} in`],
          ["Load spread angle", `${fmt(payload.mitigation.spread_angle_deg, 1)} deg`],
          ["Mitigation unit weight", `${fmt(payload.mitigation.unit_weight_pcf, 1)} pcf`],
        ],
      },
    ],
  };
}

function pdfText(value) {
  return String(value)
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapPdfText(value, maxChars) {
  const words = String(value).replace(/[^\x20-\x7E]/g, "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (!word) {
      continue;
    }
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines.length ? lines : [""];
}

function buildPdfBlob(report = buildReportData()) {
  const pages = [[]];
  let y = 752;
  const statusText = report.statusText || (report.passes ? "PASS" : "FAIL");
  const statusPasses = report.passes !== false;

  const current = () => pages[pages.length - 1];
  const addPage = () => {
    pages.push([]);
    y = 752;
  };
  const ensureSpace = (height) => {
    if (y - height < 54) {
      addPage();
    }
  };
  const addText = (text, x, size = 10, font = "F1") => {
    current().push(`BT /${font} ${size} Tf ${x} ${y} Td (${pdfText(text)}) Tj ET`);
    y -= size + 5;
  };
  const addWrapped = (text, x, maxChars, size = 10, font = "F1") => {
    for (const line of wrapPdfText(text, maxChars)) {
      addText(line, x, size, font);
    }
  };
  const addSection = (section) => {
    ensureSpace(44);
    y -= 8;
    addText(section.title, 54, 14, "F2");
    current().push(`0.85 0.89 0.92 RG 0.8 w 54 ${y + 8} m 558 ${y + 8} l S`);
    y -= 4;
    for (const [label, value] of section.rows) {
      const rowLines = wrapPdfText(`${label}: ${value}`, 86);
      ensureSpace(rowLines.length * 15 + 4);
      for (const line of rowLines) {
        addText(line, 66, 10, "F1");
      }
      y -= 1;
    }
  };

  addText(report.title || "Pipeline Crossing Assessment Report", 54, 20, "F2");
  addText(`Assessment: ${report.assessmentName}`, 54, 11, "F1");
  addText(`Generated: ${report.generatedAt}`, 54, 11, "F1");
  y -= 8;

  const boxY = y - 72;
  current().push(`${statusPasses ? "0.08 0.45 0.24" : "0.86 0.15 0.15"} RG 2 w 54 ${boxY} 504 76 re S`);
  addText("ASSESSMENT RESULT", 72, 10, "F2");
  addText(statusText, 72, statusText.length > 18 ? 18 : 26, "F2");
  addWrapped(report.passFailDetail, 72, 80, 10, "F1");
  y = boxY - 12;

  for (const section of report.sections) {
    addSection(section);
  }

  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  const pageRefs = [];
  for (const pageCommands of pages) {
    const pageId = objects.length;
    const contentId = pageId + 1;
    const stream = pageCommands.join("\n");
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    pageRefs.push(`${pageId} 0 R`);
  }
  objects[2] = `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pageRefs.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 1; i < objects.length; i += 1) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function reportFileName() {
  const cleanName = ($("assessmentName").value || "pipeline-crossing-assessment")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${cleanName || "pipeline-crossing-assessment"}-report.pdf`;
}

function reportFileNameFromTitle(title) {
  const cleanName = String(title || "assessment-report")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const baseName = cleanName || "assessment";
  return `${baseName.endsWith("-report") ? baseName : `${baseName}-report`}.pdf`;
}

function reportAssessmentName() {
  return $("assessmentName").value || "Untitled assessment";
}

function inputRow(label, id, unit = "") {
  const value = $(id).value;
  return [label, unit ? `${value} ${unit}` : value];
}

function selectRow(label, id) {
  return [label, textOfSelect(id)];
}

function outputRow(label, id) {
  return [label, $(id).textContent || "-"];
}

function htmlToPlainText(value) {
  const text = String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || "-";
}

function criteriaRowsFromList(id) {
  const list = $(id);
  if (typeof list.querySelectorAll === "function") {
    const items = Array.from(list.querySelectorAll("li"))
      .map((item) => item.textContent.trim())
      .filter(Boolean);
    if (items.length) {
      return items.map((item, index) => [`Criterion ${index + 1}`, item]);
    }
  }
  const matches = Array.from(String(list.innerHTML || "").matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
    .map((match) => htmlToPlainText(match[1]))
    .filter((text) => text && text !== "-");
  return matches.length ? matches.map((item, index) => [`Criterion ${index + 1}`, item]) : [["Criteria", htmlToPlainText(list.textContent)]];
}

function buildCorlasReportData() {
  return {
    title: "CorLAS Failure Pressure Calculation Report",
    assessmentName: reportAssessmentName(),
    generatedAt: new Date().toLocaleString(),
    passes: $("corlasStatus").textContent !== "Check inputs",
    statusText: $("corlasStatus").textContent === "Not calculated" ? "CALCULATED" : $("corlasStatus").textContent,
    passFailDetail: `P(fracture): ${$("corlasFracturePressure").textContent}; P(failure): ${$("corlasFailurePressure").textContent}.`,
    sections: [
      {
        title: "Pipe Geometry",
        rows: [inputRow("Outside diameter", "corlasDiameter", "mm"), inputRow("Wall thickness", "corlasWallThickness", "mm")],
      },
      {
        title: "Crack Dimensions",
        rows: [
          inputRow("Crack depth", "corlasCrackDepth", "mm"),
          inputRow("Crack length", "corlasCrackLength", "mm"),
          selectRow("Crack location", "corlasCrackLocation"),
          selectRow("Crack profile", "corlasCrackProfile"),
        ],
      },
      {
        title: "Material Properties",
        rows: [
          inputRow("Yield strength", "corlasYieldStrength", "MPa"),
          inputRow("Ultimate tensile strength", "corlasTensileStrength", "MPa"),
          inputRow("Elastic modulus", "corlasElasticModulus", "MPa"),
          inputRow("CVN", "corlasCvn", "J"),
          selectRow("Jc calculation method", "corlasToughnessMethod"),
          inputRow("Charpy net area", "corlasCharpyArea", "in2"),
          inputRow("Fracture toughness, Jc", "corlasFractureToughness"),
        ],
      },
      {
        title: "Solver Controls",
        rows: [
          inputRow("Flow stress coefficient", "corlasFlowCoefficient"),
          inputRow("Pressure step", "corlasPressureStep", "MPa"),
          inputRow("Maximum iterations", "corlasMaxIterations"),
        ],
      },
      {
        title: "Outputs",
        rows: [
          outputRow("P(fracture)", "corlasFracturePressure"),
          outputRow("P(fracture), psi", "corlasFracturePressurePsi"),
          outputRow("P(collapse)", "corlasCollapsePressure"),
          outputRow("P(failure)", "corlasFailurePressure"),
          outputRow("Jt", "corlasJt"),
          outputRow("Flow stress", "corlasFlowStress"),
          outputRow("Folias factor", "corlasFoliasFactor"),
          outputRow("Local stress", "corlasLocalStress"),
        ],
      },
    ],
  };
}

function buildAnnexKReportData() {
  const status = $("ecaStatus").textContent;
  return {
    title: "CSA Z662 Annex K ECA Report",
    assessmentName: reportAssessmentName(),
    generatedAt: new Date().toLocaleString(),
    passes: !status.includes("REJECT") && status !== "Check inputs",
    statusText: status,
    passFailDetail: $("ecaDisposition").textContent,
    sections: [
      {
        title: "Geometry and Material Inputs",
        rows: [
          inputRow("Outside diameter", "ecaDiameter", "mm"),
          inputRow("Wall thickness", "ecaWallThickness", "mm"),
          inputRow("SMYS", "ecaSmys", "MPa"),
          inputRow("Weld yield strength", "ecaWeldYield", "MPa"),
          inputRow("Base yield strength", "ecaBaseYield", "MPa"),
          inputRow("Elastic modulus", "ecaElasticModulus", "MPa"),
          inputRow("Poisson ratio", "ecaPoisson"),
          inputRow("Thermal coefficient", "ecaThermalCoeff", "1/C"),
          inputRow("Kmat", "ecaKmat", "MPa*m^0.5"),
        ],
      },
      {
        title: "Loads and Flaw Inputs",
        rows: [
          inputRow("Pressure", "ecaPressure", "MPa"),
          inputRow("Temperature change", "ecaDeltaT", "C"),
          inputRow("External bending moment", "ecaBendingMoment", "kN*m"),
          inputRow("High-low misalignment", "ecaMisalignment", "mm"),
          inputRow("Measured flaw height", "ecaFlawHeight", "mm"),
          inputRow("Measured flaw length", "ecaFlawLength", "mm"),
          inputRow("NDE height allowance", "ecaHeightAllowance", "mm"),
          inputRow("NDE length allowance", "ecaLengthAllowance", "mm"),
          selectRow("Service type", "ecaServiceType"),
          inputRow("Longitudinal strain demand", "ecaLongitudinalStrain", "%"),
          inputRow("Residual stress factor", "ecaResidualFactor"),
        ],
      },
      {
        title: "Outputs",
        rows: [
          outputRow("Effective flaw height", "ecaEffectiveHeight"),
          outputRow("Effective flaw length", "ecaEffectiveLength"),
          outputRow("Misalignment SCF", "ecaScf"),
          outputRow("Hoop stress", "ecaHoopStress"),
          outputRow("Restrained axial stress", "ecaAxialStress"),
          outputRow("Strength mismatch ratio", "ecaMismatch"),
          outputRow("Load ratio, Lr", "ecaLr"),
          outputRow("Fracture ratio, Kr", "ecaKr"),
          outputRow("FAD boundary", "ecaFadBoundary"),
          outputRow("Assessment level", "ecaAssessmentLevel"),
          outputRow("Gateway checks", "ecaGatewayChecks"),
        ],
      },
    ],
  };
}

function buildDentReportData() {
  const status = $("dentStatus").textContent;
  return {
    title: "Statistical Dent Assessment Report",
    assessmentName: reportAssessmentName(),
    generatedAt: new Date().toLocaleString(),
    passes: status !== "REPAIR REQUIRED" && status !== "Check inputs",
    statusText: status,
    passFailDetail: $("dentDisposition").textContent,
    sections: [
      {
        title: "Pipe and Dent Inputs",
        rows: [
          inputRow("Pipe outside diameter", "dentOd", "in"),
          inputRow("Wall thickness", "dentWallThickness", "in"),
          inputRow("Mean circumferential radius", "dentCircRadius", "in"),
          inputRow("Mean longitudinal radius", "dentLongRadius", "in"),
          inputRow("Dent depth", "dentDepth", "in"),
          inputRow("Dent length", "dentLength", "in"),
        ],
      },
      {
        title: "Statistical Simulation Inputs",
        rows: [
          inputRow("Measurement error fraction", "dentMeasurementError"),
          inputRow("Strain limit", "dentStrainLimit"),
          inputRow("Number of simulations", "dentSimulationCount"),
          inputRow("Random seed", "dentSeed"),
        ],
      },
      {
        title: "Outputs",
        rows: [
          outputRow("Mean peak strain", "dentMeanStrain"),
          outputRow("Std dev strain", "dentStdStrain"),
          outputRow("95th percentile strain", "dentP95Strain"),
          outputRow("Probability above limit", "dentProbability"),
          outputRow("Dent depth / OD", "dentDepthPercent"),
          outputRow("Exceedance count", "dentExceedCount"),
          outputRow("Framework notes", "dentFrameworkNotes"),
          ["Distribution plot", htmlToPlainText($("dentChartSummary").textContent)],
        ],
      },
    ],
  };
}

function buildB31gReportData() {
  const status = $("b31gStatus").textContent;
  return {
    title: "Modified B31.G Calculation Report",
    assessmentName: reportAssessmentName(),
    generatedAt: new Date().toLocaleString(),
    passes: status === "PASS",
    statusText: status,
    passFailDetail: $("b31gDisposition").textContent,
    sections: [
      {
        title: "Pipe and Defect Inputs",
        rows: [
          inputRow("Outside diameter", "b31gDiameter", "mm"),
          inputRow("Wall thickness", "b31gWallThickness", "mm"),
          inputRow("MAOP", "b31gMaop", "MPa"),
          inputRow("SMYS", "b31gSmys", "MPa"),
          inputRow("SMTS", "b31gSmts", "MPa"),
          inputRow("Assessment factor", "b31gAssessmentFactor"),
          inputRow("Defect depth", "b31gDepth", "mm"),
          inputRow("Defect length", "b31gLength", "mm"),
          selectRow("Flow stress cap", "b31gCapFlow"),
        ],
      },
      {
        title: "Outputs",
        rows: [
          outputRow("Failure pressure", "b31gFailurePressure"),
          outputRow("Allowable pressure", "b31gAllowablePressure"),
          outputRow("MAOP / allowable", "b31gPressureRatio"),
          outputRow("Folias factor", "b31gFolias"),
          outputRow("z parameter", "b31gZ"),
          outputRow("Flow stress", "b31gFlowStress"),
          outputRow("Failure stress", "b31gFailureStress"),
          outputRow("Depth / thickness", "b31gDepthRatio"),
          outputRow("Folias equation", "b31gFoliasEquation"),
        ],
      },
    ],
  };
}

function buildRstrengReportData() {
  const status = $("rstrengStatus").textContent;
  return {
    title: "RSTRENG Effective Area Calculation Report",
    assessmentName: reportAssessmentName(),
    generatedAt: new Date().toLocaleString(),
    passes: status === "PASS",
    statusText: status,
    passFailDetail: $("rstrengDisposition").textContent,
    sections: [
      {
        title: "Pipe Inputs",
        rows: [
          inputRow("Outside diameter", "rstrengDiameter", "mm"),
          inputRow("Wall thickness", "rstrengWallThickness", "mm"),
          inputRow("MAOP", "rstrengMaop", "MPa"),
          inputRow("SMYS", "rstrengSmys", "MPa"),
          inputRow("SMTS", "rstrengSmts", "MPa"),
          inputRow("Assessment factor", "rstrengAssessmentFactor"),
          selectRow("Flow stress cap", "rstrengCapFlow"),
        ],
      },
      {
        title: "Depth Profile Inputs",
        rows: [
          inputRow("Stations", "rstrengStations", "mm"),
          inputRow("Depths", "rstrengDepths", "mm"),
        ],
      },
      {
        title: "Outputs",
        rows: [
          outputRow("Failure pressure", "rstrengFailurePressure"),
          outputRow("Allowable pressure", "rstrengAllowablePressure"),
          outputRow("MAOP / allowable", "rstrengPressureRatio"),
          outputRow("Governing segment", "rstrengSegment"),
          outputRow("Effective area", "rstrengEffectiveArea"),
          outputRow("Area ratio", "rstrengAreaRatio"),
          outputRow("Max depth / thickness", "rstrengMaxDepthRatio"),
          outputRow("Average depth", "rstrengAverageDepth"),
          outputRow("Folias factor", "rstrengFolias"),
          outputRow("z parameter", "rstrengZ"),
          outputRow("Flow stress", "rstrengFlowStress"),
          outputRow("Failure stress", "rstrengFailureStress"),
        ],
      },
    ],
  };
}

function buildSccColonyReportData() {
  const status = $("sccStatus").textContent;
  return {
    title: "SCC Crack Colony Assessment Report",
    assessmentName: reportAssessmentName(),
    generatedAt: new Date().toLocaleString(),
    passes: status === "ACCEPTABLE",
    statusText: status,
    passFailDetail: $("sccDisposition").textContent,
    sections: [
      {
        title: "Pipe and Material Inputs",
        rows: [
          inputRow("Outside diameter", "sccDiameter", "mm"),
          inputRow("Wall thickness", "sccWallThickness", "mm"),
          inputRow("MAOP", "sccMaop", "MPa"),
          inputRow("SMYS", "sccSmys", "MPa"),
          inputRow("SMTS", "sccSmts", "MPa"),
          inputRow("Fracture toughness", "sccToughness", "MPa*m^0.5"),
          inputRow("Assessment factor", "sccAssessmentFactor"),
          selectRow("Crack orientation", "sccOrientation"),
          inputRow("Geometry factor", "sccGeometryFactor"),
        ],
      },
      {
        title: "Colony Geometry Inputs",
        rows: [
          inputRow("Crack depths", "sccDepths", "mm"),
          inputRow("Crack lengths", "sccLengths", "mm"),
          inputRow("Axial spacings", "sccSpacings", "mm"),
        ],
      },
      {
        title: "Pressure Cycling Inputs",
        rows: [
          inputRow("Pressure cycle range", "sccPressureRange", "MPa"),
          inputRow("Paris C", "sccParisC"),
          inputRow("Paris m", "sccParisM"),
        ],
      },
      {
        title: "Outputs",
        rows: [
          outputRow("Failure pressure", "sccFailurePressure"),
          outputRow("Allowable pressure", "sccAllowablePressure"),
          outputRow("MAOP / allowable", "sccPressureRatio"),
          outputRow("Colony class", "sccColonyClass"),
          outputRow("Interaction factor", "sccInteractionFactor"),
          outputRow("Crack count", "sccCrackCount"),
          outputRow("Equivalent depth", "sccEquivalentDepth"),
          outputRow("Equivalent length", "sccEquivalentLength"),
          outputRow("Depth / thickness", "sccDepthRatio"),
          outputRow("K ratio at MAOP", "sccKr"),
          outputRow("Collapse pressure", "sccCollapsePressure"),
          outputRow("Fracture pressure", "sccFracturePressure"),
          outputRow("Folias factor", "sccFolias"),
          outputRow("Remaining cycles", "sccRemainingCycles"),
          outputRow("Crack growth status", "sccCrackGrowthStatus"),
        ],
      },
    ],
  };
}

function buildCrackGrowthReportData() {
  const status = $("crackGrowthStatus").textContent;
  return {
    title: "Crack Growth Fatigue Life Report",
    assessmentName: reportAssessmentName(),
    generatedAt: new Date().toLocaleString(),
    passes: status === "PASS" || status === "NO GROWTH",
    statusText: status,
    passFailDetail: $("crackGrowthDisposition").textContent,
    sections: [
      {
        title: "Crack and Loading Inputs",
        rows: [
          inputRow("Initial crack size", "crackGrowthInitialCrack", "mm"),
          inputRow("Critical crack size", "crackGrowthCriticalCrack", "mm"),
          inputRow("Stress range", "crackGrowthStressRange", "MPa"),
          inputRow("Geometry factor", "crackGrowthGeometryFactor"),
          inputRow("Threshold delta K", "crackGrowthThresholdK", "MPa*m^0.5"),
        ],
      },
      {
        title: "Paris Law Inputs",
        rows: [
          inputRow("Paris C", "crackGrowthParisC"),
          inputRow("Paris m", "crackGrowthParisM"),
          inputRow("Integration increment", "crackGrowthIncrement", "mm"),
          inputRow("Applied cycles", "crackGrowthAppliedCycles"),
          inputRow("Life factor", "crackGrowthLifeFactor"),
        ],
      },
      {
        title: "Outputs",
        rows: [
          outputRow("Estimated life", "crackGrowthEstimatedCycles"),
          outputRow("Factored life", "crackGrowthFactoredCycles"),
          outputRow("Applied cycles", "crackGrowthAppliedCyclesOutput"),
          outputRow("Remaining cycles", "crackGrowthRemainingCycles"),
          outputRow("Damage ratio", "crackGrowthDamageRatio"),
          outputRow("Initial delta K", "crackGrowthInitialDeltaK"),
          outputRow("Critical delta K", "crackGrowthCriticalDeltaK"),
          outputRow("Initial growth rate", "crackGrowthInitialRate"),
          outputRow("Critical growth rate", "crackGrowthCriticalRate"),
          outputRow("Integration steps", "crackGrowthSteps"),
        ],
      },
    ],
  };
}

function buildIliScreeningReportData() {
  const status = $("iliStatus").textContent;
  return {
    title: "ILI Feature Screening and Ranking Report",
    assessmentName: reportAssessmentName(),
    generatedAt: new Date().toLocaleString(),
    passes: status === "ACCEPTABLE" || status === "MONITOR",
    statusText: status,
    passFailDetail: $("iliDisposition").textContent,
    sections: [
      {
        title: "Pipe and Screening Criteria",
        rows: [
          inputRow("Outside diameter", "iliDiameter", "mm"),
          inputRow("Wall thickness", "iliWallThickness", "mm"),
          inputRow("MAOP", "iliMaop", "MPa"),
          inputRow("SMYS", "iliSmys", "MPa"),
          inputRow("Assessment factor", "iliAssessmentFactor"),
          inputRow("Immediate action ratio", "iliRepairRatio"),
          inputRow("High-priority ratio", "iliMonitorRatio"),
          inputRow("Depth watch threshold", "iliDepthWatch", "% wall"),
          selectRow("Class location", "iliClassLocation"),
          inputRow("Prediction horizon", "iliPredictionYears", "years"),
          inputRow("Annual corrosion growth", "iliGrowthRate", "% wall/year"),
        ],
      },
      {
        title: "Methods and Fatigue Inputs",
        rows: [
          selectRow("Primary calculation method", "iliPrimaryMethod"),
          ["Screening methods", selectedValues("iliScreeningMethods").map(labelFromValue).join(", ") || "-"],
          inputRow("Fracture toughness", "iliToughness", "MPa*m^0.5"),
          selectRow("Include fatigue", "iliFatigueEnabled"),
          inputRow("Stress range", "iliStressRange", "MPa"),
          inputRow("Existing bending strain", "iliBendingStrain", "%"),
          inputRow("Cycles per year", "iliCyclesPerYear"),
          inputRow("Applied cycles", "iliAppliedCycles"),
          inputRow("Paris C", "iliParisC"),
          inputRow("Paris m", "iliParisM"),
        ],
      },
      {
        title: "ILI Feature Inputs",
        rows: [
          inputRow("Feature IDs", "iliFeatureIds"),
          inputRow("Feature types", "iliFeatureTypes"),
          inputRow("Depths", "iliDepths", "% wall"),
          inputRow("Lengths", "iliLengths", "mm"),
          inputRow("Clock positions", "iliClockPositions"),
          inputRow("Distances", "iliDistances", "m"),
          inputRow("Reported failure pressures", "iliReportedPressures", "MPa"),
        ],
      },
      {
        title: "Ranking Summary",
        rows: [
          outputRow("Feature count", "iliFeatureCount"),
          outputRow("Immediate action", "iliImmediateCount"),
          outputRow("High priority", "iliHighCount"),
          outputRow("Monitor", "iliMonitorCount"),
          outputRow("Most conservative method", "iliConservativeMethod"),
          outputRow("Highest risk feature", "iliHighestRiskFeature"),
          outputRow("Predicted failures", "iliPredictedFailures"),
          outputRow("Risk class", "iliRiskClass"),
          ["Ranked feature table", htmlToPlainText($("iliRankingTableBody").textContent)],
        ],
      },
    ],
  };
}

function buildPrciDentReportData() {
  const status = $("prciDentStatus").textContent;
  return {
    title: "PRCI Level 2 Dent Assessment Report",
    assessmentName: reportAssessmentName(),
    generatedAt: new Date().toLocaleString(),
    passes: status === "ACCEPTABLE",
    statusText: status,
    passFailDetail: $("prciDentResult").textContent,
    sections: [
      {
        title: "Pipeline Information",
        rows: [
          inputRow("Pipe OD", "prciDentOd", "mm"),
          inputRow("Wall thickness", "prciDentWallThickness", "mm"),
          inputRow("Operating pressure", "prciDentPressure", "MPa"),
          inputRow("SMYS", "prciDentSmys", "MPa"),
        ],
      },
      {
        title: "Dent Information",
        rows: [inputRow("Dent depth", "prciDentDepth", "mm"), inputRow("Dent radius", "prciDentRadius", "mm")],
      },
      {
        title: "Fatigue Screening Inputs",
        rows: [inputRow("Stress cycles", "prciDentCycles"), inputRow("Stress concentration factor", "prciDentScf")],
      },
      {
        title: "Fatigue Crack Growth Inputs",
        rows: [
          selectRow("Include crack growth", "prciDentCrackGrowthEnabled"),
          inputRow("Initial crack size", "prciDentInitialCrack", "mm"),
          inputRow("Critical crack size", "prciDentCriticalCrack", "mm"),
          inputRow("Stress range", "prciDentStressRange", "MPa"),
          inputRow("Paris C", "prciDentParisC"),
          inputRow("Paris m", "prciDentParisM"),
          inputRow("Integration increment", "prciDentCrackIncrement", "mm"),
        ],
      },
      {
        title: "Outputs",
        rows: [
          outputRow("Dent depth", "prciDentDepthPercent"),
          outputRow("Hoop stress", "prciDentHoopStress"),
          outputRow("Bending strain", "prciDentBendingStrain"),
          outputRow("Equivalent stress", "prciDentEquivalentStress"),
          outputRow("Fatigue life", "prciDentFatigueLife"),
          outputRow("Remaining strength factor", "prciDentRsf"),
          outputRow("Crack growth life", "prciDentCrackGrowthLife"),
          outputRow("Crack growth status", "prciDentCrackGrowthStatus"),
        ],
      },
      { title: "Repair / Acceptance Criteria", rows: criteriaRowsFromList("prciDentCriteriaList") },
    ],
  };
}

function buildInteractionReportData() {
  const status = $("interactionStatus").textContent;
  return {
    title: "Interacting Anomalies FEA Model Report",
    assessmentName: reportAssessmentName(),
    generatedAt: new Date().toLocaleString(),
    passes: status === "ACCEPTABLE",
    statusText: status,
    passFailDetail: $("interactionDisposition").textContent,
    sections: [
      {
        title: "Pipe, Material, and Loading Inputs",
        rows: [
          inputRow("Outside diameter", "interactionOd", "mm"),
          inputRow("Wall thickness", "interactionWallThickness", "mm"),
          inputRow("MAOP", "interactionMaop", "MPa"),
          inputRow("SMYS", "interactionSmys", "MPa"),
          inputRow("SMTS", "interactionSmts", "MPa"),
          inputRow("Elastic modulus", "interactionElasticModulus", "MPa"),
          inputRow("Fracture toughness, Kmat", "interactionToughness", "MPa*m^0.5"),
          inputRow("Model length", "interactionLengthFactor", "D"),
          inputRow("Secondary stress", "interactionSecondaryStress", "MPa"),
          inputRow("Residual stress fraction", "interactionResidualStress", "x SMYS"),
          inputRow("Pressure cycle range", "interactionPressureRange", "MPa"),
          inputRow("Paris C", "interactionParisC"),
          inputRow("Paris m", "interactionParisM"),
        ],
      },
      {
        title: "Anomaly A1 Inputs",
        rows: [
          selectRow("Type", "interactionA1Type"),
          selectRow("Surface", "interactionA1Surface"),
          inputRow("Axial location", "interactionA1X", "mm"),
          inputRow("Clock position", "interactionA1Theta", "deg"),
          inputRow("Axial length", "interactionA1Length", "mm"),
          inputRow("Circumferential width", "interactionA1Width", "mm"),
          inputRow("Depth", "interactionA1Depth", "mm"),
          inputRow("Crack orientation", "interactionA1Orientation", "deg"),
        ],
      },
      {
        title: "Anomaly A2 Inputs",
        rows: [
          selectRow("Type", "interactionA2Type"),
          selectRow("Surface", "interactionA2Surface"),
          inputRow("Axial location", "interactionA2X", "mm"),
          inputRow("Clock position", "interactionA2Theta", "deg"),
          inputRow("Axial length", "interactionA2Length", "mm"),
          inputRow("Circumferential width", "interactionA2Width", "mm"),
          inputRow("Depth", "interactionA2Depth", "mm"),
          inputRow("Crack orientation", "interactionA2Orientation", "deg"),
        ],
      },
      {
        title: "Uncertainty, Mesh, and Solver Inputs",
        rows: [
          selectRow("Input treatment", "interactionSizingCase"),
          inputRow("Depth tolerance", "interactionDepthTolerance", "mm"),
          inputRow("Length tolerance", "interactionLengthTolerance", "mm"),
          inputRow("Width tolerance", "interactionWidthTolerance", "mm"),
          selectRow("Mesh refinement", "interactionMeshRefinement"),
          selectRow("Solver strategy", "interactionSolverStrategy"),
        ],
      },
      {
        title: "Interaction Outputs",
        rows: [
          outputRow("Interaction factor", "interactionFactor"),
          outputRow("Interaction class", "interactionClass"),
          outputRow("Pfail combined", "interactionCombinedPressure"),
          outputRow("Weakest isolated Pfail", "interactionWeakestPressure"),
          outputRow("Safety factor", "interactionSafetyFactor"),
          outputRow("Safety category", "interactionSafetyCategory"),
          outputRow("Axial edge spacing", "interactionAxialSpacing"),
          outputRow("Circumferential spacing", "interactionCircSpacing"),
          outputRow("Normalized lambda x", "interactionLambdaX"),
          outputRow("Normalized lambda theta", "interactionLambdaTheta"),
          outputRow("Max equivalent strain", "interactionMaxStrain"),
          outputRow("K max", "interactionKMax"),
          outputRow("Remaining cycles", "interactionRemainingCycles"),
          outputRow("Critical location", "interactionCriticalLocation"),
          outputRow("Model length", "interactionModelLength"),
          outputRow("Estimated solid elements", "interactionElementCount"),
        ],
      },
      { title: "FEA Boundary Conditions and Notes", rows: criteriaRowsFromList("interactionBoundaryList") },
    ],
  };
}

function buildIliToFeaReportData() {
  const status = $("iliToFeaStatus").textContent;
  return {
    title: "Automated ILI-to-FEA Defect Assessment Report",
    assessmentName: reportAssessmentName(),
    generatedAt: new Date().toLocaleString(),
    passes: status === "ACCEPTABLE",
    statusText: status,
    passFailDetail: $("iliToFeaDisposition").textContent,
    sections: [
      {
        title: "ILI Feature Data",
        rows: [
          selectRow("Geometry source", "iliToFeaGeometrySource"),
          inputRow("Feature IDs", "iliToFeaIds"),
          inputRow("Feature types", "iliToFeaTypes"),
          inputRow("Depths", "iliToFeaDepths", "% wall"),
          inputRow("Axial lengths", "iliToFeaLengths", "mm"),
          inputRow("Circumferential widths", "iliToFeaWidths", "mm"),
          inputRow("Clock positions", "iliToFeaClocks"),
          inputRow("ILI distances", "iliToFeaDistances", "m"),
          inputRow("Crack orientations", "iliToFeaOrientations", "deg"),
          inputRow("Surfaces", "iliToFeaSurfaces"),
          inputRow("Nearest weld types", "iliToFeaWeldTypes"),
          inputRow("Weld centerline offsets", "iliToFeaWeldOffsets", "mm"),
          inputRow("Reported failure pressures", "iliToFeaReportedPressures", "MPa"),
        ],
      },
      {
        title: "Raw Inspection Data",
        rows: [
          inputRow("MFL samples", "iliToFeaMflRaw"),
          inputRow("Crack samples", "iliToFeaCrackRaw"),
          inputRow("Caliper samples", "iliToFeaCaliperRaw"),
        ],
      },
      {
        title: "Pipe and Loading Inputs",
        rows: [
          inputRow("Outside diameter", "iliToFeaOd", "mm"),
          inputRow("Wall thickness", "iliToFeaWallThickness", "mm"),
          inputRow("Current MAOP", "iliToFeaMaop", "MPa"),
          inputRow("SMYS", "iliToFeaSmys", "MPa"),
          inputRow("SMTS", "iliToFeaSmts", "MPa"),
          inputRow("Elastic modulus", "iliToFeaElasticModulus", "MPa"),
          inputRow("Fracture toughness", "iliToFeaToughness", "MPa*m^0.5"),
          inputRow("Assessment factor", "iliToFeaAssessmentFactor"),
          inputRow("Pressure cycle range", "iliToFeaPressureRange", "MPa"),
          inputRow("Cycles per year", "iliToFeaCyclesPerYear"),
          inputRow("Applied cycles", "iliToFeaAppliedCycles"),
          inputRow("Bending strain", "iliToFeaBendingStrain", "%"),
          selectRow("Pipe weld type", "iliToFeaPipeWeldType"),
          inputRow("Spiral seam turns", "iliToFeaSpiralTurns"),
          inputRow("Weld yield strength", "iliToFeaWeldYield", "MPa"),
          inputRow("Weld fracture toughness", "iliToFeaWeldToughness", "MPa*m^0.5"),
          inputRow("Weld residual stress", "iliToFeaWeldResidualFactor", "fraction of weld yield"),
          inputRow("Weld cap width", "iliToFeaWeldWidth", "mm"),
          inputRow("HAZ width per side", "iliToFeaHazWidth", "mm"),
        ],
      },
      {
        title: "Model Generation Rules",
        rows: [
          inputRow("Interaction distance", "iliToFeaInteractionDistance", "mm"),
          selectRow("ILI sizing treatment", "iliToFeaSizingCase"),
          selectRow("Mesh refinement", "iliToFeaMeshRefinement"),
          selectRow("Solver strategy", "iliToFeaSolver"),
          selectRow("Screening method", "iliToFeaScreeningMethod"),
          selectRow("Class location", "iliToFeaClassLocation"),
          selectRow("ML surrogate", "iliToFeaSurrogateModel"),
          selectRow("Reliability module", "iliToFeaReliabilityEnabled"),
          inputRow("Reliability samples", "iliToFeaReliabilitySamples"),
          inputRow("Depth uncertainty COV", "iliToFeaDepthCov"),
          inputRow("Pressure uncertainty COV", "iliToFeaPressureCov"),
          inputRow("Surrogate model error COV", "iliToFeaModelErrorCov"),
          inputRow("B31.8 strain limit", "iliToFeaStrainLimit"),
        ],
      },
      {
        title: "Governing Assessment",
        rows: [
          outputRow("Translated features", "iliToFeaFeatureCount"),
          outputRow("FEA interaction models", "iliToFeaModelCount"),
          outputRow("Maximum MOP", "iliToFeaMaximumMop"),
          outputRow("MOP utilization", "iliToFeaUtilization"),
          outputRow("Governing source", "iliToFeaGoverningSource"),
          outputRow("Failure mode", "iliToFeaFailureMode"),
          outputRow("Minimum fatigue life", "iliToFeaFatigueLife"),
          outputRow("Critical feature", "iliToFeaCriticalFeature"),
          outputRow("Raw inspection samples", "iliToFeaRawSamples"),
          outputRow("Generated raw-data mesh", "iliToFeaRawMesh"),
          outputRow("Crack mesh voids", "iliToFeaCrackVoids"),
          outputRow("Local mesh density", "iliToFeaMeshDensity"),
          outputRow("ML surrogate", "iliToFeaSurrogateOutput"),
          outputRow("Probability of failure", "iliToFeaProbabilityFailure"),
          outputRow("Reliability index", "iliToFeaReliabilityIndex"),
          outputRow("Maximum strain", "iliToFeaMaximumStrain"),
          outputRow("B31.8 / API RP 1183", "iliToFeaStrainAcceptance"),
          outputRow("Weld-coincident features", "iliToFeaWeldFeatureCount"),
        ],
      },
      {
        title: "Translated ILI Geometry",
        rows: [["Feature model table", htmlToPlainText($("iliToFeaFeatureTable").textContent)]],
      },
      {
        title: "Generated FEA Models",
        rows: [["FEA model table", htmlToPlainText($("iliToFeaModelTable").textContent)]],
      },
    ],
  };
}

function buildModuleReportData(moduleKey) {
  const builders = {
    corlas: buildCorlasReportData,
    annexK: buildAnnexKReportData,
    dent: buildDentReportData,
    b31g: buildB31gReportData,
    rstreng: buildRstrengReportData,
    sccColony: buildSccColonyReportData,
    crackGrowth: buildCrackGrowthReportData,
    iliScreening: buildIliScreeningReportData,
    iliToFea: buildIliToFeaReportData,
    prciDent: buildPrciDentReportData,
    interaction: buildInteractionReportData,
  };
  if (!builders[moduleKey]) {
    throw new Error("Report is not available for this module.");
  }
  return builders[moduleKey]();
}

function setReportLink(url, filename) {
  const link = $("reportDownloadLink");
  link.href = url;
  link.download = filename;
  link.hidden = false;
  link.textContent = `Download ${filename}`;
}

function writePopupDocument(popup, html) {
  if (!popup) {
    return;
  }
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
}

function openReportPopup() {
  const popup = window.open("", "pipelineCrossingReport", "width=760,height=640,resizable=yes,scrollbars=yes");
  if (!popup) {
    return null;
  }
  writePopupDocument(
    popup,
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Creating report</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; color: #122033; background: #f4f7fb; }
    main { max-width: 620px; margin: 56px auto; padding: 32px; background: #fff; border: 1px solid #d7e0ea; border-radius: 8px; }
    h1 { margin: 0 0 12px; font-size: 28px; }
    p { margin: 0; color: #4b5b70; line-height: 1.5; }
  </style>
</head>
<body>
  <main>
    <h1>Creating report</h1>
    <p>The PDF report is being generated. This window will update when it is ready.</p>
  </main>
</body>
</html>`,
  );
  return popup;
}

function updateReportPopup(popup, payload) {
  if (!popup) {
    return;
  }
  const filename = payload.filename || reportFileName();
  const absoluteUrl = new URL(payload.url, window.location.href).href;
  const title = escapeHtml(filename);
  writePopupDocument(
    popup,
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Report ready</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; color: #122033; background: #f4f7fb; }
    main { max-width: 660px; margin: 42px auto; padding: 32px; background: #fff; border: 1px solid #d7e0ea; border-radius: 8px; }
    h1 { margin: 0 0 10px; font-size: 30px; }
    p { margin: 0 0 20px; color: #4b5b70; line-height: 1.5; }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; margin: 22px 0; }
    a, button { border: 0; border-radius: 6px; background: #0b7f88; color: #fff; cursor: pointer; display: inline-block; font: 700 15px Arial, sans-serif; padding: 13px 18px; text-decoration: none; }
    button.secondary { background: #163a5b; }
    .note { border: 1px solid #bfd4e7; border-radius: 8px; background: #f8fbfe; color: #3c5065; padding: 14px; }
    #message { min-height: 24px; margin-top: 16px; font-weight: 700; color: #0d5f67; }
    iframe { width: 100%; height: 300px; border: 1px solid #d7e0ea; border-radius: 6px; background: #fff; }
  </style>
</head>
<body>
  <main>
    <h1>Report ready</h1>
    <p>Your assessment report has been created as <strong>${title}</strong>.</p>
    <div class="actions">
      <button id="saveAsButton" type="button">Save PDF As...</button>
      <a id="downloadLink" href="${escapeHtml(absoluteUrl)}" download="${title}">Download report PDF</a>
      <button id="closeButton" class="secondary" type="button">Close</button>
    </div>
    <p class="note">Use <strong>Save PDF As...</strong> to choose a folder and filename when your browser supports it. If that option is unavailable, use the download link.</p>
    <p id="message" role="status"></p>
    <iframe title="PDF report preview" src="${escapeHtml(absoluteUrl)}"></iframe>
  </main>
  <script>
    const reportUrl = ${JSON.stringify(absoluteUrl)};
    const filename = ${JSON.stringify(filename)};
    const message = document.getElementById("message");
    document.getElementById("closeButton").addEventListener("click", () => window.close());
    function downloadBlob(blob) {
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
    document.getElementById("saveAsButton").addEventListener("click", async () => {
      try {
        message.textContent = "Preparing PDF...";
        const response = await fetch(reportUrl);
        if (!response.ok) {
          throw new Error("The report PDF could not be downloaded.");
        }
        const blob = await response.blob();
        if (!blob.size) {
          throw new Error("The generated PDF is empty.");
        }
        if (!window.showSaveFilePicker) {
          downloadBlob(blob);
          message.textContent = "Direct folder selection is not available here. The PDF download has started.";
          return;
        }
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: "PDF document", accept: { "application/pdf": [".pdf"] } }],
        });
        try {
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          message.textContent = "Report saved.";
        } catch (writeError) {
          downloadBlob(blob);
          message.textContent = "This browser blocked direct saving in this window. The PDF download has started instead.";
        }
      } catch (error) {
        message.textContent = error.name === "AbortError" ? "Save cancelled." : error.message;
      }
    });
  </script>
</body>
</html>`,
  );
}

function showReportPopupError(popup, message) {
  if (!popup) {
    return;
  }
  writePopupDocument(
    popup,
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Report error</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; color: #122033; background: #f4f7fb; }
    main { max-width: 620px; margin: 56px auto; padding: 32px; background: #fff; border: 1px solid #efb7b7; border-radius: 8px; }
    h1 { margin: 0 0 12px; color: #9b1c1c; font-size: 28px; }
    p { margin: 0; color: #4b5b70; line-height: 1.5; }
  </style>
</head>
<body>
  <main>
    <h1>Report could not be created</h1>
    <p>${escapeHtml(message)}</p>
  </main>
</body>
</html>`,
  );
}

function ensureReportDialog() {
  let overlay = document.getElementById("reportDialogOverlay");
  if (!overlay) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="reportDialogOverlay" class="report-dialog-overlay" hidden>
        <section class="report-dialog" role="dialog" aria-modal="true" aria-labelledby="reportDialogTitle">
          <button id="reportDialogClose" class="report-dialog-close" type="button" aria-label="Close report dialog">x</button>
          <h2 id="reportDialogTitle">Creating report</h2>
          <p id="reportDialogMessage">The PDF report is being generated.</p>
          <div id="reportDialogActions" class="report-dialog-actions" hidden>
            <button id="reportSaveAsButton" type="button">Save PDF As...</button>
            <a id="reportDialogDownload" class="report-dialog-link" href="#" download>Download report PDF</a>
          </div>
          <p id="reportDialogStatus" class="report-dialog-status" role="status"></p>
          <iframe id="reportDialogPreview" title="PDF report preview" hidden></iframe>
        </section>
      </div>`,
    );
    overlay = document.getElementById("reportDialogOverlay");
    $("reportDialogClose").addEventListener("click", () => {
      overlay.hidden = true;
    });
  }
  return overlay;
}

function showReportDialogCreating() {
  const overlay = ensureReportDialog();
  $("reportDialogTitle").textContent = "Creating report";
  $("reportDialogMessage").textContent = "The PDF report is being generated. The save options will appear here when it is ready.";
  $("reportDialogActions").hidden = true;
  $("reportDialogStatus").textContent = "";
  $("reportDialogPreview").hidden = true;
  $("reportDialogPreview").removeAttribute("src");
  overlay.hidden = false;
}

function downloadReportBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

async function saveReportAs(url, filename, statusElement) {
  try {
    statusElement.textContent = "Preparing PDF...";
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("The report PDF could not be downloaded.");
    }
    const blob = await response.blob();
    if (!blob.size) {
      throw new Error("The generated PDF is empty.");
    }
    if (!window.showSaveFilePicker) {
      downloadReportBlob(blob, filename);
      statusElement.textContent = "Direct folder selection is not available here. The PDF download has started.";
      return;
    }
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: "PDF document", accept: { "application/pdf": [".pdf"] } }],
    });
    try {
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      statusElement.textContent = "Report saved.";
    } catch (writeError) {
      downloadReportBlob(blob, filename);
      statusElement.textContent = "This browser blocked direct saving in this page. The PDF download has started instead.";
    }
  } catch (error) {
    statusElement.textContent = error.name === "AbortError" ? "Save cancelled." : error.message;
  }
}

function updateReportDialog(payload) {
  const overlay = ensureReportDialog();
  const filename = payload.filename || reportFileName();
  const absoluteUrl = new URL(payload.url, window.location.href).href;
  const statusElement = $("reportDialogStatus");
  $("reportDialogTitle").textContent = "Report ready";
  $("reportDialogMessage").textContent = `Your assessment report has been created as ${filename}.`;
  $("reportDialogActions").hidden = false;
  $("reportDialogDownload").href = absoluteUrl;
  $("reportDialogDownload").download = filename;
  $("reportDialogPreview").src = absoluteUrl;
  $("reportDialogPreview").hidden = false;
  statusElement.textContent = "Use Save PDF As... to choose a folder and filename, or use the download link.";
  $("reportSaveAsButton").onclick = () => saveReportAs(absoluteUrl, filename, statusElement);
  overlay.hidden = false;
}

function showReportDialogError(message) {
  const overlay = ensureReportDialog();
  $("reportDialogTitle").textContent = "Report could not be created";
  $("reportDialogMessage").textContent = message;
  $("reportDialogActions").hidden = true;
  $("reportDialogStatus").textContent = "";
  $("reportDialogPreview").hidden = true;
  $("reportDialogPreview").removeAttribute("src");
  overlay.hidden = false;
}

async function ensureCalculatedForReport() {
  if (latestResult) {
    return true;
  }
  $("statusPill").textContent = "Calculating";
  const response = await fetch("/api/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(readPayload()),
  });
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error || "Calculation failed.");
  }
  setOutput(payload.result);
  $("errorBox").hidden = true;
  return true;
}

async function createReport() {
  showReportDialogCreating();
  $("reportButton").disabled = true;
  $("calculateButton").disabled = true;
  try {
    await ensureCalculatedForReport();
    $("statusPill").textContent = "Creating PDF";
    const response = await fetch("/api/report-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...readPayload(), assessment_name: $("assessmentName").value || "Untitled assessment" }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Report generation failed.");
    }
    if (!payload.bytes || payload.bytes <= 0) {
      throw new Error("Report PDF was empty. Please run the calculation again and retry.");
    }
    setReportLink(payload.url, payload.filename || reportFileName());
    updateReportDialog(payload);
    $("statusPill").textContent = "Report ready";
    $("errorBox").hidden = true;
  } catch (error) {
    showReportDialogError(error.message);
    showError(error.message);
  } finally {
    $("reportButton").disabled = false;
    $("calculateButton").disabled = false;
  }
}

async function ensureModuleCalculatedForReport(moduleKey) {
  const calculators = {
    corlas: { run: calculateCorlas, errorBox: "corlasErrorBox" },
    annexK: { run: calculateAnnexK, errorBox: "ecaErrorBox" },
    dent: { run: calculateDent, errorBox: "dentErrorBox" },
    b31g: { run: calculateB31g, errorBox: "b31gErrorBox" },
    rstreng: { run: calculateRstreng, errorBox: "rstrengErrorBox" },
    sccColony: { run: calculateSccColony, errorBox: "sccErrorBox" },
    crackGrowth: { run: calculateCrackGrowth, errorBox: "crackGrowthErrorBox" },
    iliScreening: { run: calculateIliScreening, errorBox: "iliErrorBox" },
    iliToFea: { run: calculateIliToFea, errorBox: "iliToFeaErrorBox" },
    prciDent: { run: calculatePrciDent, errorBox: "prciDentErrorBox" },
    interaction: { run: calculateInteraction, errorBox: "interactionErrorBox" },
  };
  const calculator = calculators[moduleKey];
  if (!calculator) {
    throw new Error("Report is not available for this module.");
  }
  await calculator.run();
  const errorBox = $(calculator.errorBox);
  if (!errorBox.hidden) {
    throw new Error(errorBox.textContent || "Calculation failed.");
  }
}

async function createModuleReport(moduleKey) {
  const buttonIds = {
    corlas: "corlasReportButton",
    annexK: "ecaReportButton",
    dent: "dentReportButton",
    b31g: "b31gReportButton",
    rstreng: "rstrengReportButton",
    sccColony: "sccColonyReportButton",
    crackGrowth: "crackGrowthReportButton",
    iliScreening: "iliScreeningReportButton",
    iliToFea: "iliToFeaReportButton",
    prciDent: "prciDentReportButton",
    interaction: "interactionReportButton",
  };
  const button = $(buttonIds[moduleKey]);
  showReportDialogCreating();
  button.disabled = true;
  $("statusPill").textContent = "Creating PDF";
  try {
    await ensureModuleCalculatedForReport(moduleKey);
    const report = buildModuleReportData(moduleKey);
    const blob = buildPdfBlob(report);
    if (!blob.size) {
      throw new Error("Report PDF was empty. Please run the calculation again and retry.");
    }
    const filename = reportFileNameFromTitle(report.title);
    const url = URL.createObjectURL(blob);
    setReportLink(url, filename);
    updateReportDialog({ url, filename, bytes: blob.size });
    $("statusPill").textContent = "Report ready";
  } catch (error) {
    showReportDialogError(error.message);
    $("statusPill").textContent = "Check inputs";
  } finally {
    button.disabled = false;
  }
}

function showError(message) {
  $("errorBox").textContent = message;
  $("errorBox").hidden = false;
  $("statusPill").textContent = "Check inputs";
}

function readCorlasPayload() {
  return {
    geometry: {
      outside_diameter_mm: valueOf("corlasDiameter"),
      wall_thickness_mm: valueOf("corlasWallThickness"),
    },
    crack: {
      depth_mm: valueOf("corlasCrackDepth"),
      length_mm: valueOf("corlasCrackLength"),
      location: $("corlasCrackLocation").value,
      profile: $("corlasCrackProfile").value,
    },
    material: {
      yield_strength_mpa: valueOf("corlasYieldStrength"),
      tensile_strength_mpa: valueOf("corlasTensileStrength"),
      elastic_modulus_mpa: valueOf("corlasElasticModulus"),
      cvn_j: valueOf("corlasCvn"),
      fracture_toughness_method: $("corlasToughnessMethod").value,
      charpy_area_in2: valueOf("corlasCharpyArea"),
      fracture_toughness_j: valueOf("corlasFractureToughness"),
    },
    solver: {
      flow_stress_coefficient: valueOf("corlasFlowCoefficient"),
      pressure_step_mpa: valueOf("corlasPressureStep"),
      max_iterations: valueOf("corlasMaxIterations"),
    },
  };
}

function readAnnexKPayload() {
  return {
    geometry: {
      outside_diameter_mm: valueOf("ecaDiameter"),
      wall_thickness_mm: valueOf("ecaWallThickness"),
    },
    material: {
      smys_mpa: valueOf("ecaSmys"),
      weld_yield_strength_mpa: valueOf("ecaWeldYield"),
      base_yield_strength_mpa: valueOf("ecaBaseYield"),
      elastic_modulus_mpa: valueOf("ecaElasticModulus"),
      poisson_ratio: valueOf("ecaPoisson"),
      thermal_coefficient_per_c: valueOf("ecaThermalCoeff"),
      kmat_mpa_sqrt_m: valueOf("ecaKmat"),
    },
    loads: {
      pressure_mpa: valueOf("ecaPressure"),
      temperature_change_c: valueOf("ecaDeltaT"),
      bending_moment_kn_m: valueOf("ecaBendingMoment"),
    },
    flaw: {
      misalignment_mm: valueOf("ecaMisalignment"),
      measured_height_mm: valueOf("ecaFlawHeight"),
      measured_length_mm: valueOf("ecaFlawLength"),
      height_nde_allowance_mm: valueOf("ecaHeightAllowance"),
      length_nde_allowance_mm: valueOf("ecaLengthAllowance"),
    },
    assessment: {
      service_type: $("ecaServiceType").value,
      longitudinal_strain_percent: valueOf("ecaLongitudinalStrain"),
      residual_stress_factor: valueOf("ecaResidualFactor"),
    },
  };
}

function readDentPayload() {
  return {
    pipe: {
      outside_diameter_in: valueOf("dentOd"),
      wall_thickness_in: valueOf("dentWallThickness"),
    },
    dent: {
      circumferential_radius_in: valueOf("dentCircRadius"),
      longitudinal_radius_in: valueOf("dentLongRadius"),
      depth_in: valueOf("dentDepth"),
      length_in: valueOf("dentLength"),
    },
    simulation: {
      measurement_error_fraction: valueOf("dentMeasurementError"),
      strain_limit: valueOf("dentStrainLimit"),
      num_simulations: valueOf("dentSimulationCount"),
      seed: valueOf("dentSeed"),
    },
  };
}

function renderDentDistributionChart(result) {
  const chart = $("dentDistributionChart");
  const summary = $("dentChartSummary");
  const output = result?.outputs || {};
  const distribution = Array.isArray(output.distribution) ? output.distribution : [];
  const points = distribution
    .map((point) => ({
      strainPercent: Number(point.peak_strain) * 100,
      probabilityPercent: Number(point.cumulative_probability) * 100,
    }))
    .filter((point) => Number.isFinite(point.strainPercent) && Number.isFinite(point.probabilityPercent));

  if (points.length < 2) {
    chart.innerHTML = "";
    summary.textContent = "Run calculation to plot the simulated strain distribution.";
    return;
  }

  const width = 680;
  const height = 340;
  const margin = { top: 24, right: 24, bottom: 64, left: 70 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const strainLimitPercent = Number(result?.inputs?.strain_limit ?? valueOf("dentStrainLimit")) * 100;
  const p95Percent = Number(output.p95_strain) * 100;
  const xValues = points.map((point) => point.strainPercent);
  if (Number.isFinite(strainLimitPercent)) {
    xValues.push(strainLimitPercent);
  }
  if (Number.isFinite(p95Percent)) {
    xValues.push(p95Percent);
  }
  let xMin = Math.min(...xValues);
  let xMax = Math.max(...xValues);
  const xPadding = Math.max((xMax - xMin) * 0.08, 0.25);
  xMin = Math.max(0, xMin - xPadding);
  xMax += xPadding;
  if (xMax <= xMin) {
    xMax = xMin + 1;
  }
  const xScale = (value) => margin.left + ((value - xMin) / (xMax - xMin)) * plotWidth;
  const yScale = (value) => margin.top + (1 - value / 100) * plotHeight;
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xScale(point.strainPercent).toFixed(2)} ${yScale(point.probabilityPercent).toFixed(2)}`)
    .join(" ");
  const yTicks = [0, 25, 50, 75, 100];
  const xTicks = Array.from({ length: 5 }, (_, index) => xMin + ((xMax - xMin) * index) / 4);
  const limitLine =
    Number.isFinite(strainLimitPercent) && strainLimitPercent >= xMin && strainLimitPercent <= xMax
      ? `<line class="limit-line" x1="${xScale(strainLimitPercent).toFixed(2)}" y1="${margin.top}" x2="${xScale(strainLimitPercent).toFixed(2)}" y2="${margin.top + plotHeight}"></line>
         <text x="${xScale(strainLimitPercent).toFixed(2)}" y="${margin.top + 14}" text-anchor="middle">Limit ${fmt(strainLimitPercent, 2)}%</text>`
      : "";
  const p95Marker =
    Number.isFinite(p95Percent) && p95Percent >= xMin && p95Percent <= xMax
      ? `<circle class="p95-marker" cx="${xScale(p95Percent).toFixed(2)}" cy="${yScale(95).toFixed(2)}" r="6"></circle>
         <text x="${xScale(p95Percent).toFixed(2)}" y="${yScale(95) - 12}" text-anchor="middle">P95 ${fmt(p95Percent, 2)}%</text>`
      : "";

  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" aria-hidden="true">
      <title>Peak Strain Cumulative Distribution (Monte Carlo)</title>
      <rect x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}" fill="#ffffff" rx="6"></rect>
      ${yTicks
        .map(
          (tick) => `
            <line class="gridline" x1="${margin.left}" y1="${yScale(tick).toFixed(2)}" x2="${margin.left + plotWidth}" y2="${yScale(tick).toFixed(2)}"></line>
            <text x="${margin.left - 12}" y="${yScale(tick) + 4}" text-anchor="end">${tick}%</text>
          `
        )
        .join("")}
      ${xTicks
        .map(
          (tick) => `
            <line class="gridline" x1="${xScale(tick).toFixed(2)}" y1="${margin.top}" x2="${xScale(tick).toFixed(2)}" y2="${margin.top + plotHeight}"></line>
            <text x="${xScale(tick).toFixed(2)}" y="${margin.top + plotHeight + 24}" text-anchor="middle">${fmt(tick, 2)}%</text>
          `
        )
        .join("")}
      <line class="axis-line" x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}"></line>
      <line class="axis-line" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}"></line>
      ${limitLine}
      <path class="cdf-line" d="${path}"></path>
      ${p95Marker}
      <text class="axis-label" x="${margin.left + plotWidth / 2}" y="${height - 18}" text-anchor="middle">Calculated Total Strain</text>
      <text class="axis-label" transform="translate(20 ${margin.top + plotHeight / 2}) rotate(-90)" text-anchor="middle">Probability (Percentile)</text>
      <text class="chart-note" x="${margin.left}" y="${height - 2}">Distribution points are sorted simulation results decimated for plotting.</text>
    </svg>
  `;
  summary.textContent = `${points.length} plotted percentile points. Limit ${fmt(strainLimitPercent, 2)}%, P95 ${fmt(p95Percent, 2)}%.`;
}

function setDentOutput(result) {
  const output = result.outputs;
  $("dentStatus").textContent = output.status;
  $("dentDisposition").textContent = `Disposition: ${output.disposition}`;
  $("dentAssessmentBox").className = output.status === "REPAIR REQUIRED" ? "pass-fail-box pass-fail-fail" : "pass-fail-box pass-fail-pass";
  $("dentMeanStrain").textContent = `${fmt(output.mean_peak_strain * 100, 2)}%`;
  $("dentStdStrain").textContent = `${fmt(output.std_dev_strain * 100, 2)}%`;
  $("dentP95Strain").textContent = `${fmt(output.p95_strain * 100, 2)}%`;
  $("dentProbability").textContent = `${fmt(output.probability_exceedance * 100, 2)}%`;
  $("dentDepthPercent").textContent = `${fmt(output.depth_percent_od * 100, 2)}%`;
  $("dentExceedCount").textContent = fmt(output.exceed_count, 0);
  $("dentFrameworkNotes").textContent = output.framework_notes.join(" ");
  renderDentDistributionChart(result);
  $("dentErrorBox").hidden = true;
}

async function calculateDent() {
  $("calculateDentButton").disabled = true;
  $("statusPill").textContent = "Calculating dent";
  try {
    const response = await fetch("/api/dent-assessment-calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readDentPayload()),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Dent assessment failed.");
    }
    setDentOutput(payload.result);
    $("statusPill").textContent = "Dent calculated";
  } catch (error) {
    $("dentErrorBox").textContent = error.message;
    $("dentErrorBox").hidden = false;
    $("dentStatus").textContent = "Check inputs";
    $("dentDisposition").textContent = "Dent assessment did not complete.";
    $("dentAssessmentBox").className = "pass-fail-box pass-fail-fail";
    renderDentDistributionChart(null);
    $("statusPill").textContent = "Check inputs";
  } finally {
    $("calculateDentButton").disabled = false;
  }
}

function readB31gPayload() {
  return {
    pipe: {
      outside_diameter_mm: valueOf("b31gDiameter"),
      wall_thickness_mm: valueOf("b31gWallThickness"),
      maop_mpa: valueOf("b31gMaop"),
      smys_mpa: valueOf("b31gSmys"),
      smts_mpa: valueOf("b31gSmts"),
    },
    defect: {
      depth_mm: valueOf("b31gDepth"),
      length_mm: valueOf("b31gLength"),
    },
    assessment: {
      assessment_factor: valueOf("b31gAssessmentFactor"),
      cap_flow_stress_to_smts: $("b31gCapFlow").value === "yes",
    },
  };
}

function setB31gOutput(result) {
  const output = result.outputs;
  $("b31gStatus").textContent = output.status;
  $("b31gDisposition").textContent = output.disposition;
  $("b31gAssessmentBox").className = output.status === "PASS" ? "pass-fail-box pass-fail-pass" : "pass-fail-box pass-fail-fail";
  $("b31gFailurePressure").textContent = `${fmt(output.failure_pressure_mpa, 3)} MPa`;
  $("b31gAllowablePressure").textContent = `${fmt(output.allowable_pressure_mpa, 3)} MPa`;
  $("b31gPressureRatio").textContent = fmt(output.maop_to_allowable_ratio, 3);
  $("b31gFolias").textContent = fmt(output.folias_factor, 4);
  $("b31gZ").textContent = fmt(output.z_parameter, 3);
  $("b31gFlowStress").textContent = `${fmt(output.flow_stress_mpa, 1)} MPa`;
  $("b31gFailureStress").textContent = `${fmt(output.failure_stress_mpa, 1)} MPa`;
  $("b31gDepthRatio").textContent = `${fmt(output.depth_ratio * 100, 2)}%`;
  $("b31gFoliasEquation").textContent = output.folias_equation;
  $("b31gErrorBox").hidden = true;
}

async function calculateB31g() {
  $("calculateB31gButton").disabled = true;
  $("statusPill").textContent = "Calculating B31.G";
  try {
    const response = await fetch("/api/modified-b31g-calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readB31gPayload()),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Modified B31.G calculation failed.");
    }
    setB31gOutput(payload.result);
    $("statusPill").textContent = "B31.G calculated";
  } catch (error) {
    $("b31gErrorBox").textContent = error.message;
    $("b31gErrorBox").hidden = false;
    $("b31gStatus").textContent = "Check inputs";
    $("b31gDisposition").textContent = "Modified B31.G calculation did not complete.";
    $("b31gAssessmentBox").className = "pass-fail-box pass-fail-fail";
    $("statusPill").textContent = "Check inputs";
  } finally {
    $("calculateB31gButton").disabled = false;
  }
}

function parseNumberList(value, label) {
  const values = String(value || "")
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number);
  if (!values.length || values.some((item) => !Number.isFinite(item))) {
    throw new Error(`${label} must contain comma-separated numeric values.`);
  }
  return values;
}

function parseStringList(value, label) {
  const values = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!values.length) {
    throw new Error(`${label} must contain comma-separated values.`);
  }
  return values;
}

function selectedValues(id) {
  const field = $(id);
  if (field.selectedOptions) {
    return Array.from(field.selectedOptions).map((option) => option.value);
  }
  return String(field.value || "")
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readSccColonyPayload() {
  return {
    pipe: {
      outside_diameter_mm: valueOf("sccDiameter"),
      wall_thickness_mm: valueOf("sccWallThickness"),
      maop_mpa: valueOf("sccMaop"),
      smys_mpa: valueOf("sccSmys"),
      smts_mpa: valueOf("sccSmts"),
      fracture_toughness_mpa_sqrt_m: valueOf("sccToughness"),
      assessment_factor: valueOf("sccAssessmentFactor"),
    },
    colony: {
      orientation: $("sccOrientation").value,
      geometry_factor: valueOf("sccGeometryFactor"),
      depths_mm: parseNumberList($("sccDepths").value, "Crack depths"),
      lengths_mm: parseNumberList($("sccLengths").value, "Crack lengths"),
      axial_spacings_mm: parseNumberList($("sccSpacings").value, "Axial spacings"),
    },
    fatigue: {
      pressure_range_mpa: valueOf("sccPressureRange"),
      paris_c: valueOf("sccParisC"),
      paris_m: valueOf("sccParisM"),
    },
  };
}

function renderSccColonyVisualization(result = null) {
  const chart = $("sccColonyVisualization");
  const summary = $("sccColonyVisualSummary");
  let payload;
  try {
    payload = readSccColonyPayload();
  } catch (error) {
    chart.innerHTML = "";
    summary.textContent = error.message;
    return;
  }
  const depths = payload.colony.depths_mm;
  const lengths = payload.colony.lengths_mm;
  const spacings = payload.colony.axial_spacings_mm.length ? payload.colony.axial_spacings_mm : Array(Math.max(depths.length - 1, 0)).fill(0);
  const wallThickness = payload.pipe.wall_thickness_mm;
  if (depths.length !== lengths.length || spacings.length !== Math.max(depths.length - 1, 0)) {
    chart.innerHTML = "";
    summary.textContent = "Depths and lengths need one value per crack; spacings need one fewer value.";
    return;
  }
  const starts = [];
  let cursor = 0;
  for (let index = 0; index < lengths.length; index += 1) {
    starts.push(cursor);
    cursor += lengths[index] + (spacings[index] || 0);
  }
  const colonyLength = Math.max(cursor, 1);
  const width = 760;
  const height = 300;
  const margin = { top: 42, right: 42, bottom: 58, left: 74 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const horizontalInset = Math.min(28, Math.max(18, plotW * 0.04));
  const colonyPlotW = plotW - horizontalInset * 2;
  const xScale = (x) => margin.left + horizontalInset + (x / colonyLength) * colonyPlotW;
  const yScale = (depth) => margin.top + (depth / wallThickness) * plotH;
  const wallY = margin.top + plotH;
  const crackMarkup = depths
    .map((depth, index) => {
      const x = xScale(starts[index]);
      const w = Math.max(xScale(starts[index] + lengths[index]) - x, 4);
      const y = margin.top;
      const h = Math.max(yScale(Math.min(depth, wallThickness)) - margin.top, 3);
      return `
        <g>
          <title>${escapeHtml(`Crack ${index + 1}: depth ${fmt(depth, 2)} mm, length ${fmt(lengths[index], 1)} mm`)}</title>
          <rect class="scc-crack-shape" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"></rect>
          <line class="scc-wall-line" x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${wallY}"></line>
          <text x="${x + w / 2}" y="${Math.max(22, y - 12)}" text-anchor="middle">C${index + 1}</text>
        </g>
      `;
    })
    .join("");
  const equivalentLength = result?.outputs?.equivalent_length_mm;
  const equivalentDepth = result?.outputs?.equivalent_depth_mm;
  const equivalentMarkup =
    Number.isFinite(equivalentLength) && Number.isFinite(equivalentDepth)
      ? `<rect class="scc-equivalent-band" x="${xScale(0)}" y="${margin.top}" width="${Math.min((equivalentLength / colonyLength) * plotW, plotW)}" height="${Math.min(
          (equivalentDepth / wallThickness) * plotH,
          plotH,
        )}" rx="10"><title>Equivalent crack: ${fmt(equivalentDepth, 2)} mm deep x ${fmt(equivalentLength, 1)} mm long</title></rect>`
      : "";
  const maxDepth = Math.max(...depths);
  summary.textContent = `${depths.length} cracks, colony span ${fmt(colonyLength, 1)} mm, deepest crack ${fmt(maxDepth, 2)} mm (${fmt(
    (maxDepth / wallThickness) * 100,
    1,
  )}% wall).`;
  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="SCC crack colony layout">
      <text x="${margin.left}" y="24">Axial SCC crack colony layout from input depths, lengths, and spacings</text>
      <rect class="pipe-wall-band" x="${margin.left}" y="${margin.top}" width="${plotW}" height="${plotH}"></rect>
      <rect class="remaining-wall-band" x="${margin.left}" y="${wallY}" width="${plotW}" height="18"></rect>
      ${equivalentMarkup}
      ${crackMarkup}
      <line class="scc-axis" x1="${margin.left}" y1="${wallY}" x2="${margin.left + plotW}" y2="${wallY}"></line>
      <text x="${margin.left + plotW / 2}" y="${height - 18}" text-anchor="middle">Axial distance along colony (mm)</text>
      <text transform="translate(22 ${margin.top + plotH / 2}) rotate(-90)" text-anchor="middle">Crack depth into wall (mm)</text>
      <text x="${margin.left + plotW}" y="${wallY + 34}" text-anchor="end">Wall thickness ${fmt(wallThickness, 2)} mm</text>
    </svg>
  `;
}

function setSccColonyOutput(result) {
  const output = result.outputs;
  $("sccStatus").textContent = output.status;
  $("sccDisposition").textContent = output.disposition;
  $("sccAssessmentBox").className = output.status === "ACCEPTABLE" ? "pass-fail-box pass-fail-pass" : "pass-fail-box pass-fail-fail";
  $("sccFailurePressure").textContent = `${fmt(output.failure_pressure_mpa, 3)} MPa`;
  $("sccAllowablePressure").textContent = `${fmt(output.allowable_pressure_mpa, 3)} MPa`;
  $("sccPressureRatio").textContent = fmt(output.maop_to_allowable_ratio, 3);
  $("sccColonyClass").textContent = output.colony_class;
  $("sccInteractionFactor").textContent = fmt(output.interaction_factor, 3);
  $("sccCrackCount").textContent = fmt(output.crack_count, 0);
  $("sccEquivalentDepth").textContent = `${fmt(output.equivalent_depth_mm, 3)} mm`;
  $("sccEquivalentLength").textContent = `${fmt(output.equivalent_length_mm, 1)} mm`;
  $("sccDepthRatio").textContent = `${fmt(output.depth_ratio * 100, 2)}%`;
  $("sccKr").textContent = fmt(output.kr_at_maop, 3);
  $("sccCollapsePressure").textContent = `${fmt(output.collapse_pressure_mpa, 3)} MPa`;
  $("sccFracturePressure").textContent = `${fmt(output.fracture_pressure_mpa, 3)} MPa`;
  $("sccFolias").textContent = fmt(output.folias_factor, 4);
  $("sccRemainingCycles").textContent =
    output.remaining_cycles === null || output.remaining_cycles === undefined ? "Not checked" : `${fmt(output.remaining_cycles, 0)} cycles`;
  $("sccCrackGrowthStatus").textContent = output.crack_growth_status;
  renderSccColonyVisualization(result);
  $("sccErrorBox").hidden = true;
}

async function calculateSccColony() {
  $("calculateSccColonyButton").disabled = true;
  $("statusPill").textContent = "Calculating SCC colony";
  try {
    const response = await fetch("/api/scc-colony-calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readSccColonyPayload()),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "SCC colony assessment failed.");
    }
    setSccColonyOutput(payload.result);
    $("statusPill").textContent = "SCC colony calculated";
  } catch (error) {
    $("sccErrorBox").textContent = error.message;
    $("sccErrorBox").hidden = false;
    $("sccStatus").textContent = "Check inputs";
    $("sccDisposition").textContent = "SCC colony assessment did not complete.";
    $("sccAssessmentBox").className = "pass-fail-box pass-fail-fail";
    $("statusPill").textContent = "Check inputs";
  } finally {
    $("calculateSccColonyButton").disabled = false;
  }
}

function readCrackGrowthPayload() {
  return {
    crack: {
      initial_crack_mm: valueOf("crackGrowthInitialCrack"),
      critical_crack_mm: valueOf("crackGrowthCriticalCrack"),
    },
    loading: {
      stress_range_mpa: valueOf("crackGrowthStressRange"),
      geometry_factor: valueOf("crackGrowthGeometryFactor"),
      threshold_delta_k_mpa_sqrt_m: valueOf("crackGrowthThresholdK"),
    },
    assessment: {
      paris_c: valueOf("crackGrowthParisC"),
      paris_m: valueOf("crackGrowthParisM"),
      increment_mm: valueOf("crackGrowthIncrement"),
      applied_cycles: valueOf("crackGrowthAppliedCycles"),
      life_factor: valueOf("crackGrowthLifeFactor"),
    },
  };
}

function cycleText(value) {
  return value === null || value === undefined ? "Not limited" : `${fmt(value, 0)} cycles`;
}

function growthRateText(value) {
  return Number.isFinite(value) ? `${Number(value).toExponential(3)} mm/cycle` : "-";
}

function setCrackGrowthOutput(result) {
  const output = result.outputs;
  $("crackGrowthStatus").textContent = output.status;
  $("crackGrowthDisposition").textContent = output.disposition;
  $("crackGrowthAssessmentBox").className =
    output.status === "PASS" || output.status === "NO GROWTH" ? "pass-fail-box pass-fail-pass" : "pass-fail-box pass-fail-fail";
  $("crackGrowthEstimatedCycles").textContent = cycleText(output.estimated_cycles);
  $("crackGrowthFactoredCycles").textContent = cycleText(output.factored_cycles);
  $("crackGrowthAppliedCyclesOutput").textContent = `${fmt(output.applied_cycles, 0)} cycles`;
  $("crackGrowthRemainingCycles").textContent = cycleText(output.remaining_cycles);
  $("crackGrowthDamageRatio").textContent = fmt(output.damage_ratio, 4);
  $("crackGrowthInitialDeltaK").textContent = `${fmt(output.initial_delta_k_mpa_sqrt_m, 3)} MPa*m^0.5`;
  $("crackGrowthCriticalDeltaK").textContent = `${fmt(output.critical_delta_k_mpa_sqrt_m, 3)} MPa*m^0.5`;
  $("crackGrowthInitialRate").textContent = growthRateText(output.initial_growth_rate_mm_per_cycle);
  $("crackGrowthCriticalRate").textContent = growthRateText(output.critical_growth_rate_mm_per_cycle);
  $("crackGrowthSteps").textContent = fmt(output.integration_steps, 0);
  $("crackGrowthErrorBox").hidden = true;
}

async function calculateCrackGrowth() {
  $("calculateCrackGrowthButton").disabled = true;
  $("statusPill").textContent = "Calculating crack growth";
  try {
    const response = await fetch("/api/crack-growth-calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readCrackGrowthPayload()),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Crack growth calculation failed.");
    }
    setCrackGrowthOutput(payload.result);
    $("statusPill").textContent = "Crack growth calculated";
  } catch (error) {
    $("crackGrowthErrorBox").textContent = error.message;
    $("crackGrowthErrorBox").hidden = false;
    $("crackGrowthStatus").textContent = "Check inputs";
    $("crackGrowthDisposition").textContent = "Crack growth fatigue life calculation did not complete.";
    $("crackGrowthAssessmentBox").className = "pass-fail-box pass-fail-fail";
    $("statusPill").textContent = "Check inputs";
  } finally {
    $("calculateCrackGrowthButton").disabled = false;
  }
}

function readIliScreeningPayload() {
  const featureIds = parseStringList($("iliFeatureIds").value, "Feature IDs");
  const featureMethods = Object.fromEntries(
    featureIds.filter((featureId) => iliFeatureMethodOverrides.has(featureId)).map((featureId) => [featureId, iliFeatureMethodOverrides.get(featureId)]),
  );
  return {
    pipe: {
      outside_diameter_mm: valueOf("iliDiameter"),
      wall_thickness_mm: valueOf("iliWallThickness"),
      maop_mpa: valueOf("iliMaop"),
      smys_mpa: valueOf("iliSmys"),
      assessment_factor: valueOf("iliAssessmentFactor"),
    },
    criteria: {
      repair_pressure_ratio: valueOf("iliRepairRatio"),
      monitor_pressure_ratio: valueOf("iliMonitorRatio"),
      depth_watch_percent: valueOf("iliDepthWatch"),
      primary_method: $("iliPrimaryMethod").value,
      screening_methods: selectedValues("iliScreeningMethods"),
      fracture_toughness_mpa_sqrt_m: valueOf("iliToughness"),
      feature_methods: featureMethods,
    },
    fatigue: {
      enabled: $("iliFatigueEnabled").value === "yes",
      stress_range_mpa: valueOf("iliStressRange"),
      bending_strain_percent: valueOf("iliBendingStrain"),
      cycles_per_year: valueOf("iliCyclesPerYear"),
      applied_cycles: valueOf("iliAppliedCycles"),
      paris_c: valueOf("iliParisC"),
      paris_m: valueOf("iliParisM"),
    },
    risk: {
      class_location: $("iliClassLocation").value,
      prediction_years: valueOf("iliPredictionYears"),
      annual_growth_percent: valueOf("iliGrowthRate"),
    },
    features: {
      ids: featureIds,
      types: parseStringList($("iliFeatureTypes").value, "Feature types"),
      depths_percent: parseNumberList($("iliDepths").value, "Depths"),
      lengths_mm: parseNumberList($("iliLengths").value, "Lengths"),
      clock_positions: parseStringList($("iliClockPositions").value, "Clock positions"),
      distances_m: parseNumberList($("iliDistances").value, "Distances"),
      reported_failure_pressures_mpa: parseNumberList($("iliReportedPressures").value, "Reported failure pressures"),
    },
  };
}

function renderIliRankingTable(features) {
  const rows = features.map(
    (feature) => {
      const selectedMethod = iliFeatureMethodOverrides.get(feature.feature_id) || feature.calculation_method_key;
      const methodOptions = iliCalculationMethods
        .map(
          (method) =>
            `<option value="${escapeHtml(method.value)}"${method.value === selectedMethod ? " selected" : ""}${
              method.requiresReportedPressure && !feature.reported_failure_pressure_mpa ? " disabled" : ""
            }>${escapeHtml(
              method.label,
            )}</option>`,
        )
        .join("");
      return `
      <tr>
        <td>${fmt(feature.rank, 0)}</td>
        <td>${escapeHtml(feature.feature_id)}</td>
        <td>${escapeHtml(labelFromValue(feature.feature_type))}</td>
        <td>${fmt(feature.distance_m, 1)} m<br><small>${escapeHtml(feature.clock_position)}</small></td>
        <td>${fmt(feature.depth_percent, 1)}%</td>
        <td>${fmt(feature.length_mm, 1)} mm</td>
        <td>
          <select class="ili-feature-method-select" data-feature-id="${escapeHtml(feature.feature_id)}" aria-label="Calculation method for ${escapeHtml(
            feature.feature_id,
          )}">
            ${methodOptions}
          </select>
        </td>
        <td>${fmt(feature.maop_to_allowable_ratio, 3)}</td>
        <td>${feature.fatigue_life_years === null || feature.fatigue_life_years === undefined ? "-" : `${fmt(feature.fatigue_life_years, 1)} yr`}</td>
        <td>${feature.predicted_failure_years === null || feature.predicted_failure_years === undefined ? "No" : `${fmt(feature.predicted_failure_years, 1)} yr`}</td>
        <td>${escapeHtml(feature.risk_class || "-")}</td>
        <td>${escapeHtml(feature.priority)}</td>
        <td>${escapeHtml(feature.recommended_action)}</td>
      </tr>
    `;
    },
  );
  $("iliRankingTableBody").innerHTML = rows.length ? rows.join("") : '<tr><td colspan="13">No ranked features returned.</td></tr>';
}

function handleIliFeatureMethodChange(event) {
  const select = event.target.closest(".ili-feature-method-select");
  if (!select) {
    return;
  }
  iliFeatureMethodOverrides.set(select.dataset.featureId, select.value);
  select.classList.add("ili-feature-method-pending");
  select.title = "Pending method change. Re-run ILI Features to apply.";
  $("calculateIliScreeningButton").textContent = "Re-run ILI Features";
  $("statusPill").textContent = "Method changes pending";
}

function setIliScreeningOutput(result) {
  const output = result.outputs;
  $("iliStatus").textContent = output.status;
  $("iliDisposition").textContent = output.disposition;
  $("iliAssessmentBox").className =
    output.status === "ACTION REQUIRED" || output.status === "REVIEW REQUIRED" ? "pass-fail-box pass-fail-fail" : "pass-fail-box pass-fail-pass";
  $("iliFeatureCount").textContent = fmt(output.feature_count, 0);
  $("iliImmediateCount").textContent = fmt(output.immediate_count, 0);
  $("iliHighCount").textContent = fmt(output.high_count, 0);
  $("iliMonitorCount").textContent = fmt(output.monitor_count, 0);
  $("iliConservativeMethod").textContent = output.most_conservative_method || "-";
  $("iliHighestRiskFeature").textContent = output.highest_risk_feature || "-";
  $("iliPredictedFailures").textContent = fmt(output.predicted_failure_count || 0, 0);
  $("iliRiskClass").textContent = output.risk_class || "-";
  renderIliRankingTable(output.ranked_features || []);
  $("iliErrorBox").hidden = true;
}

function splitIliFileLine(line) {
  const delimiter = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
  return line.split(delimiter).map((item) => item.trim().replace(/^"|"$/g, ""));
}

function normalizeIliHeader(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[%()./\\-]/g, " ")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function valueFromIliRow(row, headers, candidates, fallbackIndex) {
  for (const candidate of candidates) {
    const index = headers.indexOf(candidate);
    if (index >= 0 && row[index] !== undefined && row[index] !== "") {
      return row[index];
    }
  }
  return row[fallbackIndex] || "";
}

function importIliFeatureText(text, filename = "file") {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  if (!lines.length) {
    throw new Error("The uploaded ILI feature file is empty.");
  }
  const firstRow = splitIliFileLine(lines[0]);
  const normalizedFirst = firstRow.map(normalizeIliHeader);
  const hasHeader = normalizedFirst.some((item) => ["id", "feature_id", "type", "feature_type", "depth", "depth_percent"].includes(item));
  const headers = hasHeader ? normalizedFirst : [];
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const imported = {
    ids: [],
    types: [],
    depths: [],
    lengths: [],
    clocks: [],
    distances: [],
    pressures: [],
  };
  for (const line of dataLines) {
    const row = splitIliFileLine(line);
    if (row.length < 6) {
      continue;
    }
    imported.ids.push(valueFromIliRow(row, headers, ["id", "feature_id", "feature"], 0));
    imported.types.push(valueFromIliRow(row, headers, ["type", "feature_type", "anomaly_type"], 1));
    imported.depths.push(valueFromIliRow(row, headers, ["depth", "depth_percent", "depth_pct", "depth_wall"], 2));
    imported.lengths.push(valueFromIliRow(row, headers, ["length", "length_mm", "axial_length"], 3));
    imported.clocks.push(valueFromIliRow(row, headers, ["clock", "clock_position", "clock_positions"], 4));
    imported.distances.push(valueFromIliRow(row, headers, ["distance", "distance_m", "odometer", "chainage"], 5));
    imported.pressures.push(valueFromIliRow(row, headers, ["pressure", "failure_pressure", "failure_pressure_mpa", "pfail"], 6) || "0");
  }
  if (!imported.ids.length) {
    throw new Error("No feature rows were found. Expected columns: id, type, depth, length, clock, distance, pressure.");
  }
  $("iliFeatureIds").value = imported.ids.join(", ");
  $("iliFeatureTypes").value = imported.types.join(", ");
  $("iliDepths").value = imported.depths.join(", ");
  $("iliLengths").value = imported.lengths.join(", ");
  $("iliClockPositions").value = imported.clocks.join(", ");
  $("iliDistances").value = imported.distances.join(", ");
  $("iliReportedPressures").value = imported.pressures.join(", ");
  $("iliFileStatus").textContent = `Loaded ${imported.ids.length} features from ${filename}.`;
}

async function handleIliFeatureFile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    $("iliFileStatus").textContent = "No file loaded.";
    return;
  }
  try {
    if (file.name.toLowerCase().endsWith(".xlsx")) {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/ili-feature-import", { method: "POST", body: formData });
      const payload = await response.json();
      if (!payload.ok) {
        throw new Error(payload.error || "Excel import failed.");
      }
      $("iliFeatureIds").value = payload.features.ids.join(", ");
      $("iliFeatureTypes").value = payload.features.types.join(", ");
      $("iliDepths").value = payload.features.depths_percent.join(", ");
      $("iliLengths").value = payload.features.lengths_mm.join(", ");
      $("iliClockPositions").value = payload.features.clock_positions.join(", ");
      $("iliDistances").value = payload.features.distances_m.join(", ");
      $("iliReportedPressures").value = payload.features.reported_failure_pressures_mpa.join(", ");
      $("iliFileStatus").textContent = `Loaded ${payload.count} features from ${payload.filename}.`;
    } else {
      importIliFeatureText(await file.text(), file.name);
    }
    $("iliErrorBox").hidden = true;
  } catch (error) {
    $("iliFileStatus").textContent = "File import failed.";
    $("iliErrorBox").textContent = error.message;
    $("iliErrorBox").hidden = false;
  }
}

async function calculateIliScreening() {
  $("calculateIliScreeningButton").disabled = true;
  $("statusPill").textContent = "Ranking ILI features";
  try {
    const response = await fetch("/api/ili-screening-calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readIliScreeningPayload()),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "ILI feature screening failed.");
    }
    setIliScreeningOutput(payload.result);
    $("calculateIliScreeningButton").textContent = "Rank ILI Features";
    $("statusPill").textContent = "ILI features ranked";
  } catch (error) {
    $("iliErrorBox").textContent = error.message;
    $("iliErrorBox").hidden = false;
    $("iliStatus").textContent = "Check inputs";
    $("iliDisposition").textContent = "ILI feature screening did not complete.";
    $("iliAssessmentBox").className = "pass-fail-box pass-fail-fail";
    $("statusPill").textContent = "Check inputs";
  } finally {
    $("calculateIliScreeningButton").disabled = false;
  }
}

function readIliToFeaPayload() {
  const optionalNumberList = (id, label) => {
    const value = $(id).value.trim();
    return value ? parseNumberList(value, label) : [];
  };
  const optionalStringList = (id, label) => {
    const value = $(id).value.trim();
    return value ? parseStringList(value, label) : [];
  };
  const parseRawRows = (id, label, valueKeys) => {
    const lines = $(id).value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
    return lines.map((line, index) => {
      const values = splitIliFileLine(line);
      if (values.length < 3 + valueKeys.length) {
        throw new Error(`${label} row ${index + 1} needs ${3 + valueKeys.length} comma-separated values.`);
      }
      const hasLocationMetadata = values.length >= 5 + valueKeys.length;
      const valueStart = hasLocationMetadata ? 5 : 3;
      const row = {
        feature_id: values[0],
        distance_m: hasLocationMetadata ? Number(values[1]) : 0,
        clock_position: hasLocationMetadata ? values[2] : "",
        axial_offset_mm: Number(values[hasLocationMetadata ? 3 : 1]),
        circumferential_offset_mm: Number(values[hasLocationMetadata ? 4 : 2]),
      };
      valueKeys.forEach((key, valueIndex) => {
        row[key] = Number(values[valueIndex + valueStart]);
      });
      if (label === "Crack data") {
        row.orientation_deg = Number(values[valueStart + valueKeys.length] || 0);
        row.crack_id = values[valueStart + valueKeys.length + 1] || "";
        row.anomaly_type = values[valueStart + valueKeys.length + 2] || "";
      }
      if (
        Object.entries(row).some(
          ([key, value]) => !["feature_id", "clock_position", "crack_id", "anomaly_type"].includes(key) && !Number.isFinite(value),
        )
      ) {
        throw new Error(`${label} row ${index + 1} contains a non-numeric measurement.`);
      }
      return row;
    });
  };
  return {
    pipe: {
      outside_diameter_mm: valueOf("iliToFeaOd"),
      wall_thickness_mm: valueOf("iliToFeaWallThickness"),
      maop_mpa: valueOf("iliToFeaMaop"),
      smys_mpa: valueOf("iliToFeaSmys"),
      smts_mpa: valueOf("iliToFeaSmts"),
      elastic_modulus_mpa: valueOf("iliToFeaElasticModulus"),
      fracture_toughness_mpa_sqrt_m: valueOf("iliToFeaToughness"),
      assessment_factor: valueOf("iliToFeaAssessmentFactor"),
    },
    loading: {
      pressure_range_mpa: valueOf("iliToFeaPressureRange"),
      cycles_per_year: valueOf("iliToFeaCyclesPerYear"),
      applied_cycles: valueOf("iliToFeaAppliedCycles"),
      bending_strain_percent: valueOf("iliToFeaBendingStrain"),
      secondary_stress_mpa: 0,
      residual_stress_fraction: 0.2,
      paris_c: 1e-12,
      paris_m: 3,
    },
    weld: {
      pipe_weld_type: $("iliToFeaPipeWeldType").value,
      spiral_turns: valueOf("iliToFeaSpiralTurns"),
      yield_strength_mpa: valueOf("iliToFeaWeldYield"),
      fracture_toughness_mpa_sqrt_m: valueOf("iliToFeaWeldToughness"),
      residual_stress_factor: valueOf("iliToFeaWeldResidualFactor"),
      cap_width_mm: valueOf("iliToFeaWeldWidth"),
      haz_width_mm: valueOf("iliToFeaHazWidth"),
    },
    model: {
      geometry_source: $("iliToFeaGeometrySource").value,
      interaction_distance_mm: valueOf("iliToFeaInteractionDistance"),
      model_length_factor: 8,
      mesh_refinement: $("iliToFeaMeshRefinement").value,
      solver_strategy: $("iliToFeaSolver").value,
      sizing_case: $("iliToFeaSizingCase").value,
      screening_method: $("iliToFeaScreeningMethod").value,
      class_location: $("iliToFeaClassLocation").value,
      surrogate_model: $("iliToFeaSurrogateModel").value,
      reliability_enabled: $("iliToFeaReliabilityEnabled").value === "on",
      reliability_samples: valueOf("iliToFeaReliabilitySamples"),
      depth_cov: valueOf("iliToFeaDepthCov"),
      pressure_cov: valueOf("iliToFeaPressureCov"),
      model_error_cov: valueOf("iliToFeaModelErrorCov"),
      strain_limit: valueOf("iliToFeaStrainLimit"),
      prediction_years: 5,
      annual_growth_percent: 1,
      depth_tolerance_mm: 0.5,
      length_tolerance_mm: 10,
      width_tolerance_mm: 10,
    },
    features: {
      ids: optionalStringList("iliToFeaIds", "Feature IDs"),
      types: optionalStringList("iliToFeaTypes", "Feature types"),
      depths_percent: optionalNumberList("iliToFeaDepths", "Depths"),
      lengths_mm: optionalNumberList("iliToFeaLengths", "Lengths"),
      widths_mm: optionalNumberList("iliToFeaWidths", "Widths"),
      clock_positions: parseStringList($("iliToFeaClocks").value, "Clock positions"),
      distances_m: parseNumberList($("iliToFeaDistances").value, "Distances"),
      orientations_deg: optionalNumberList("iliToFeaOrientations", "Orientations"),
      surfaces: optionalStringList("iliToFeaSurfaces", "Surfaces"),
      weld_types: optionalStringList("iliToFeaWeldTypes", "Nearest weld types"),
      weld_offsets_mm: optionalNumberList("iliToFeaWeldOffsets", "Weld centerline offsets"),
      reported_failure_pressures_mpa: optionalNumberList("iliToFeaReportedPressures", "Reported failure pressures"),
    },
    raw_data: {
      mfl_samples: parseRawRows("iliToFeaMflRaw", "MFL data", ["depth_percent"]),
      crack_samples: parseRawRows("iliToFeaCrackRaw", "Crack data", ["depth_mm", "opening_mm"]),
      caliper_samples: parseRawRows("iliToFeaCaliperRaw", "Caliper data", ["radial_deformation_mm"]),
    },
  };
}

function applyIliToFeaImportedFeatures(features, filename) {
  const count = features.ids.length;
  $("iliToFeaIds").value = features.ids.join(", ");
  $("iliToFeaTypes").value = features.types.join(", ");
  $("iliToFeaDepths").value = features.depths_percent.join(", ");
  $("iliToFeaLengths").value = features.lengths_mm.join(", ");
  $("iliToFeaClocks").value = features.clock_positions.join(", ");
  $("iliToFeaDistances").value = features.distances_m.join(", ");
  $("iliToFeaWeldTypes").value = Array(count).fill("none").join(", ");
  $("iliToFeaWeldOffsets").value = Array(count).fill("0").join(", ");
  $("iliToFeaReportedPressures").value = features.reported_failure_pressures_mpa.join(", ");
  $("iliToFeaWidths").value = "";
  $("iliToFeaOrientations").value = Array(count).fill(0).join(", ");
  $("iliToFeaSurfaces").value = Array(count).fill("external").join(", ");
  $("iliToFeaFileStatus").textContent = `Loaded ${count} features from ${filename}. Widths will be inferred where blank.`;
}

async function handleIliToFeaFile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  try {
    if (file.name.toLowerCase().endsWith(".xlsx")) {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/ili-feature-import", { method: "POST", body: formData });
      const payload = await response.json();
      if (!payload.ok) {
        throw new Error(payload.error || "Excel import failed.");
      }
      applyIliToFeaImportedFeatures(payload.features, payload.filename);
    } else {
      const lines = String(await file.text())
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));
      const firstRow = splitIliFileLine(lines[0] || "");
      const normalizedFirst = firstRow.map(normalizeIliHeader);
      const hasHeader = normalizedFirst.some((item) => ["id", "feature_id", "type", "feature_type", "depth", "depth_percent"].includes(item));
      const headers = hasHeader ? normalizedFirst : [];
      const dataLines = hasHeader ? lines.slice(1) : lines;
      const imported = {
        ids: [],
        types: [],
        depths_percent: [],
        lengths_mm: [],
        clock_positions: [],
        distances_m: [],
        reported_failure_pressures_mpa: [],
      };
      for (const line of dataLines) {
        const row = splitIliFileLine(line);
        if (row.length < 6) continue;
        imported.ids.push(valueFromIliRow(row, headers, ["id", "feature_id", "feature"], 0));
        imported.types.push(valueFromIliRow(row, headers, ["type", "feature_type"], 1));
        imported.depths_percent.push(Number(valueFromIliRow(row, headers, ["depth", "depth_percent", "depth_pct"], 2)));
        imported.lengths_mm.push(Number(valueFromIliRow(row, headers, ["length", "length_mm"], 3)));
        imported.clock_positions.push(valueFromIliRow(row, headers, ["clock", "clock_position"], 4));
        imported.distances_m.push(Number(valueFromIliRow(row, headers, ["distance", "distance_m"], 5)));
        imported.reported_failure_pressures_mpa.push(Number(valueFromIliRow(row, headers, ["pressure", "failure_pressure", "failure_pressure_mpa"], 6)) || 0);
      }
      if (!imported.ids.length) {
        throw new Error("No valid ILI feature rows were found.");
      }
      applyIliToFeaImportedFeatures(imported, file.name);
    }
    $("iliToFeaErrorBox").hidden = true;
  } catch (error) {
    $("iliToFeaFileStatus").textContent = "File import failed.";
    $("iliToFeaErrorBox").textContent = error.message;
    $("iliToFeaErrorBox").hidden = false;
  }
}

const iliRawToolConfig = {
  mfl: { inputId: "iliToFeaMflRaw", statusId: "iliToFeaMflStatus" },
  crack: { inputId: "iliToFeaCrackRaw", statusId: "iliToFeaCrackStatus" },
  caliper: { inputId: "iliToFeaCaliperRaw", statusId: "iliToFeaCaliperStatus" },
};

function formatIliRawSamples(tool, samples) {
  return samples
    .map((sample) => {
      const prefix = [
        sample.feature_id,
        sample.distance_m || 0,
        sample.clock_position || "12:00",
        sample.axial_offset_mm || 0,
        sample.circumferential_offset_mm || 0,
      ];
      if (tool === "mfl") return [...prefix, sample.depth_percent].join(",");
      if (tool === "caliper") return [...prefix, sample.radial_deformation_mm].join(",");
      return [
        ...prefix,
        sample.depth_mm,
        sample.opening_mm || 0,
        sample.orientation_deg || 0,
        sample.crack_id || "",
        sample.anomaly_type || "crack",
      ].join(",");
    })
    .join("\n");
}

async function handleIliRawToolFile(event, tool) {
  const file = event.target.files?.[0];
  if (!file) return;
  const config = iliRawToolConfig[tool];
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`/api/ili-raw-import?tool=${encodeURIComponent(tool)}`, { method: "POST", body: formData });
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || `${tool.toUpperCase()} import failed.`);
    $(config.inputId).value = formatIliRawSamples(tool, payload.samples);
    $(config.statusId).textContent = `Loaded ${payload.count} rows from ${payload.filename}.`;
    $("iliToFeaGeometrySource").value = "auto";
    $("iliToFeaGeometrySourceNote").textContent =
      "Raw tool geometry will govern matching features; the summarized feature list remains available as metadata.";
    $("iliToFeaErrorBox").hidden = true;
  } catch (error) {
    $(config.statusId).textContent = "Import failed.";
    $("iliToFeaErrorBox").textContent = error.message;
    $("iliToFeaErrorBox").hidden = false;
  }
}

function renderIliToFeaVisualization(result = null) {
  const chart = $("iliToFeaVisualization");
  const features = result?.translated_features || [];
  if (!features.length) {
    chart.innerHTML = '<div class="visual-empty-state">Run the automated assessment to generate the developed-pipe feature map and interaction links.</div>';
    return;
  }
  const width = 920;
  const height = 330;
  const pipe = { x: 70, y: 58, w: 790, h: 210 };
  const distances = features.map((feature) => feature.axial_location_mm);
  const maximumDistance = Math.max(...distances, 1);
  const xScale = (value) => pipe.x + 24 + (value / maximumDistance) * (pipe.w - 48);
  const yScale = (theta) => pipe.y + 18 + ((((theta % 360) + 360) % 360) / 360) * (pipe.h - 36);
  const colors = { metal_loss: "#c56b28", crack: "#b42318", dent: "#6d45ad", weld: "#0b7f88", mixed: "#334155" };
  const pipeRadiusMm = Math.max(Number(result.inputs?.outside_diameter_mm || 762) / 2, 1);
  const weldKeys = new Set();
  const weldLocations = features
    .map((feature) => {
      const weldType = feature.weld_type || "none";
      if (weldType === "none") return "";
      const offset = Number(feature.weld_offset_mm || 0);
      if (weldType === "girth_weld") {
        const weldX = xScale(feature.axial_location_mm - offset);
        const key = `girth:${Math.round(weldX)}`;
        if (weldKeys.has(key)) return "";
        weldKeys.add(key);
        return `
          <g class="ili-fea-weld-location">
            <title>${escapeHtml(`Girth weld near ${feature.id}; anomaly offset ${fmt(offset, 1)} mm`)}</title>
            <line class="weld-haz-band" x1="${weldX}" y1="${pipe.y + 5}" x2="${weldX}" y2="${pipe.y + pipe.h - 5}"></line>
            <line class="weld-centerline" x1="${weldX}" y1="${pipe.y + 5}" x2="${weldX}" y2="${pipe.y + pipe.h - 5}"></line>
          </g>`;
      }
      const offsetDegrees = (offset / pipeRadiusMm) * (180 / Math.PI);
      const weldTheta = feature.clock_position_deg + offsetDegrees;
      if (weldType === "longitudinal_seam") {
        const weldY = yScale(weldTheta);
        const key = `longitudinal:${Math.round(weldY)}`;
        if (weldKeys.has(key)) return "";
        weldKeys.add(key);
        return `
          <g class="ili-fea-weld-location">
            <title>${escapeHtml(`Longitudinal seam near ${feature.id}; anomaly offset ${fmt(offset, 1)} mm`)}</title>
            <line class="weld-haz-band" x1="${pipe.x + 5}" y1="${weldY}" x2="${pipe.x + pipe.w - 5}" y2="${weldY}"></line>
            <line class="weld-centerline" x1="${pipe.x + 5}" y1="${weldY}" x2="${pipe.x + pipe.w - 5}" y2="${weldY}"></line>
          </g>`;
      }
      const key = `spiral:${feature.manufacturing_process || "pipe"}`;
      if (weldKeys.has(key)) return "";
      weldKeys.add(key);
      const segments = [];
      let activeSegment = [];
      for (let pointIndex = 0; pointIndex <= 72; pointIndex += 1) {
        const axial = (maximumDistance * pointIndex) / 72;
        const theta =
          weldTheta +
          ((axial - feature.axial_location_mm) / maximumDistance) * 360 * Number(feature.spiral_turns || result.inputs?.spiral_turns || 1.5);
        const point = [xScale(axial), yScale(theta)];
        if (activeSegment.length && Math.abs(point[1] - activeSegment[activeSegment.length - 1][1]) > pipe.h * 0.55) {
          segments.push(activeSegment);
          activeSegment = [];
        }
        activeSegment.push(point);
      }
      if (activeSegment.length) segments.push(activeSegment);
      const paths = segments
        .map((segment) => `M ${segment.map(([x, y]) => `${x} ${y}`).join(" L ")}`)
        .map((path) => `<path class="weld-haz-band" d="${path}"></path><path class="weld-centerline" d="${path}"></path>`)
        .join("");
      return `<g class="ili-fea-weld-location"><title>${escapeHtml(`Spiral seam near ${feature.id}; anomaly offset ${fmt(offset, 1)} mm`)}</title>${paths}</g>`;
    })
    .join("");
  const pairLinks = (result.fea_models || [])
    .map((model) => {
      const first = features.find((feature) => feature.id === model.feature_ids[0]);
      const second = features.find((feature) => feature.id === model.feature_ids[1]);
      if (!first || !second) return "";
      return `<line class="ili-fea-interaction-link" x1="${xScale(first.axial_location_mm)}" y1="${yScale(first.clock_position_deg)}" x2="${xScale(
        second.axial_location_mm,
      )}" y2="${yScale(second.clock_position_deg)}"><title>${escapeHtml(model.model_id)}: ${escapeHtml(model.interaction_classification)}</title></line>`;
    })
    .join("");
  const markers = features
    .map((feature, index) => {
      const x = xScale(feature.axial_location_mm);
      const y = yScale(feature.clock_position_deg);
      const labelY = index % 2 === 0 ? Math.max(20, y - 18) : Math.min(height - 18, y + 28);
      const weldRing =
        feature.weld_zone && feature.weld_zone !== "base_metal"
          ? `<circle class="weld-coincident-ring" cx="${x}" cy="${y}" r="${13 + feature.depth_percent / 12}"></circle>`
          : "";
      return `
        <g class="ili-fea-feature">
          <title>${escapeHtml(`${feature.id}: ${feature.type}, ${fmt(feature.depth_percent, 1)}%t, ${fmt(feature.length_mm, 0)} x ${fmt(feature.width_mm, 0)} mm; ${labelFromValue(feature.weld_zone || "base_metal")}`)}</title>
          ${weldRing}
          <circle cx="${x}" cy="${y}" r="${8 + feature.depth_percent / 12}" fill="${colors[feature.type] || colors.mixed}"></circle>
          <line x1="${x}" y1="${y}" x2="${x}" y2="${labelY > y ? labelY - 13 : labelY + 4}"></line>
          <text x="${x}" y="${labelY}" text-anchor="middle">${escapeHtml(feature.id)}</text>
        </g>
      `;
    })
    .join("");
  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="ILI features translated to developed pipe FEA coordinates">
      <text x="${pipe.x}" y="28">Developed pipe map: weld and HAZ locations relative to ILI anomalies</text>
      <g class="ili-fea-map-legend">
        <line class="weld-centerline" x1="687" y1="25" x2="719" y2="25"></line>
        <text x="727" y="29">Weld centerline / HAZ</text>
      </g>
      <rect class="pipe-shell" x="${pipe.x}" y="${pipe.y}" width="${pipe.w}" height="${pipe.h}" rx="10"></rect>
      <line class="pipe-axis" x1="${pipe.x + 18}" y1="${pipe.y + pipe.h / 2}" x2="${pipe.x + pipe.w - 18}" y2="${pipe.y + pipe.h / 2}"></line>
      ${weldLocations}
      ${pairLinks}
      ${markers}
      <text x="${pipe.x}" y="${height - 18}">Relative axial distance from first ILI feature</text>
      <text x="${pipe.x + pipe.w}" y="${height - 18}" text-anchor="end">${fmt(maximumDistance / 1000, 2)} m span</text>
    </svg>
  `;
}

function setIliToFeaOutput(result) {
  latestIliToFeaResult = result;
  const output = result.outputs;
  $("iliToFeaStatus").textContent = output.status;
  $("iliToFeaDisposition").textContent = output.disposition;
  $("iliToFeaAssessmentBox").className = output.status === "ACCEPTABLE" ? "pass-fail-box pass-fail-pass" : "pass-fail-box pass-fail-fail";
  $("iliToFeaFeatureCount").textContent = fmt(output.feature_count, 0);
  $("iliToFeaModelCount").textContent = fmt(output.interaction_model_count, 0);
  $("iliToFeaMaximumMop").textContent = `${fmt(output.maximum_mop_mpa, 3)} MPa`;
  $("iliToFeaUtilization").textContent = fmt(output.mop_utilization, 3);
  $("iliToFeaGoverningSource").textContent = output.governing_source;
  $("iliToFeaFailureMode").textContent = output.governing_failure_mode;
  $("iliToFeaFatigueLife").textContent =
    output.minimum_fatigue_life_years === null || output.minimum_fatigue_life_years === undefined
      ? "Not calculated"
      : `${fmt(output.minimum_fatigue_life_years, 1)} yr`;
  $("iliToFeaCriticalFeature").textContent = output.critical_feature;
  $("iliToFeaRawSamples").textContent = fmt(output.raw_sample_count, 0);
  $("iliToFeaRawMesh").textContent = `${fmt(output.raw_mesh_nodes, 0)} nodes / ${fmt(output.raw_mesh_elements, 0)} elements`;
  $("iliToFeaCrackVoids").textContent = `${fmt(output.removed_crack_elements, 0)} removed elements`;
  $("iliToFeaMeshDensity").textContent = `${fmt(output.mesh_density_ratio, 1)}x remote`;
  $("iliToFeaSurrogateOutput").textContent =
    output.surrogate_minimum_mop_mpa === null || output.surrogate_minimum_mop_mpa === undefined
      ? `${output.surrogate_model} - outside applicable defect type`
      : `${output.surrogate_model}: ${fmt(output.surrogate_minimum_mop_mpa, 3)} MPa advisory MOP`;
  $("iliToFeaProbabilityFailure").textContent =
    output.reliability_enabled === false
      ? "Deactivated"
      : output.probability_of_failure === null || output.probability_of_failure === undefined
      ? "Not applicable"
      : `${fmt(output.probability_of_failure * 100, 3)}%`;
  $("iliToFeaReliabilityIndex").textContent =
    output.reliability_enabled === false
      ? "Deactivated"
      : output.reliability_index_beta === null || output.reliability_index_beta === undefined
      ? "Not applicable"
      : fmt(output.reliability_index_beta, 3);
  $("iliToFeaMaximumStrain").textContent = `${fmt(output.maximum_strain_percent, 3)}%`;
  $("iliToFeaStrainAcceptance").textContent = `${output.b31_8_strain_status} / ${output.api_rp_1183_status}`;
  $("iliToFeaWeldFeatureCount").textContent = fmt(output.weld_feature_count || 0, 0);
  $("iliToFeaFeatureTable").innerHTML = result.translated_features
    .map(
      (feature) => `<tr>
        <td>${escapeHtml(feature.id)}</td><td>${escapeHtml(labelFromValue(feature.type))}</td>
        <td>${fmt(feature.axial_location_mm, 1)} mm</td><td>${escapeHtml(feature.clock_position)} / ${fmt(feature.clock_position_deg, 1)} deg</td>
        <td>${fmt(feature.depth_mm, 2)} mm (${fmt(feature.depth_percent, 1)}%)</td>
        <td>${fmt(feature.length_mm, 1)} x ${fmt(feature.width_mm, 1)} mm</td>
        <td>${escapeHtml(labelFromValue(feature.geometry_source))}<br><small>${fmt(feature.effective_geometry.minimum_remaining_ligament_mm, 2)} mm ligament</small></td>
        <td>${escapeHtml(feature.surface)}</td>
        <td>${escapeHtml(labelFromValue(feature.weld_type || "none"))}<br><small>${escapeHtml(labelFromValue(feature.weld_zone || "base_metal"))}; ${fmt(feature.weld_offset_mm || 0, 1)} mm offset; ${escapeHtml(labelFromValue(feature.manufacturing_process || "n/a"))}</small></td>
      </tr>`,
    )
    .join("");
  $("iliToFeaModelTable").innerHTML = result.fea_models.length
    ? result.fea_models
        .map(
          (model) => `<tr>
            <td>${escapeHtml(model.model_id)}</td><td>${model.feature_ids.map(escapeHtml).join(" + ")}</td>
            <td>${escapeHtml(model.interaction_classification)}</td><td>${fmt(model.interaction_factor, 3)}</td>
            <td>${fmt(model.combined_failure_pressure_mpa, 3)} MPa</td><td>${fmt(model.maximum_mop_mpa, 3)} MPa</td>
            <td>${model.fatigue_life_years === null || model.fatigue_life_years === undefined ? "-" : `${fmt(model.fatigue_life_years, 1)} yr`}</td>
            <td>${fmt(model.mesh.estimated_solid_elements, 0)} elements<br><small>${escapeHtml(model.mesh.refinement)}</small></td>
            <td>${escapeHtml(model.governing_failure_mode)}</td>
          </tr>`,
        )
        .join("")
    : '<tr><td colspan="9">No feature pairs met the interaction-distance rule; isolated assessments govern.</td></tr>';
  renderIliToFeaVisualization(result);
  if (typeof window.renderIliFea3D === "function") {
    window.renderIliFea3D(result);
  }
  $("iliToFeaErrorBox").hidden = true;
}

async function calculateIliToFea() {
  $("calculateIliToFeaButton").disabled = true;
  $("statusPill").textContent = "Building ILI-to-FEA models";
  try {
    const response = await fetch("/api/ili-to-fea-calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readIliToFeaPayload()),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Automated ILI-to-FEA assessment failed.");
    }
    setIliToFeaOutput(payload.result);
    $("statusPill").textContent = "ILI-to-FEA assessment complete";
  } catch (error) {
    $("iliToFeaErrorBox").textContent = error.message;
    $("iliToFeaErrorBox").hidden = false;
    $("iliToFeaStatus").textContent = "Check inputs";
    $("iliToFeaDisposition").textContent = "The automated model workflow did not complete.";
    $("iliToFeaAssessmentBox").className = "pass-fail-box pass-fail-fail";
    $("statusPill").textContent = "Check inputs";
  } finally {
    $("calculateIliToFeaButton").disabled = false;
  }
}

function readRstrengPayload() {
  const stations = parseNumberList($("rstrengStations").value, "Stations");
  const depths = parseNumberList($("rstrengDepths").value, "Depths");
  if (stations.length !== depths.length) {
    throw new Error("Stations and depths must contain the same number of values.");
  }
  return {
    pipe: {
      outside_diameter_mm: valueOf("rstrengDiameter"),
      wall_thickness_mm: valueOf("rstrengWallThickness"),
      maop_mpa: valueOf("rstrengMaop"),
      smys_mpa: valueOf("rstrengSmys"),
      smts_mpa: valueOf("rstrengSmts"),
    },
    assessment: {
      assessment_factor: valueOf("rstrengAssessmentFactor"),
      cap_flow_stress_to_smts: $("rstrengCapFlow").value === "yes",
    },
    profile: stations.map((station, index) => ({
      station_mm: station,
      depth_mm: depths[index],
    })),
  };
}

function renderRstrengProfileChart(result = latestRstrengResult) {
  const chart = $("rstrengProfileChart");
  const summary = $("rstrengProfileSummary");
  let payload;
  try {
    payload = readRstrengPayload();
  } catch (error) {
    chart.innerHTML = "";
    summary.textContent = error.message;
    return;
  }

  const points = payload.profile
    .map((point) => ({
      station: Number(point.station_mm),
      depth: Number(point.depth_mm),
    }))
    .filter((point) => Number.isFinite(point.station) && Number.isFinite(point.depth))
    .sort((a, b) => a.station - b.station);
  const wallThickness = Number(payload.pipe.wall_thickness_mm);
  if (points.length < 2 || !Number.isFinite(wallThickness) || wallThickness <= 0) {
    chart.innerHTML = "";
    summary.textContent = "Enter at least two profile points and a positive wall thickness.";
    return;
  }

  const width = 720;
  const height = 350;
  const margin = { top: 26, right: 26, bottom: 86, left: 74 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const stationMin = Math.min(...points.map((point) => point.station));
  const stationMax = Math.max(...points.map((point) => point.station));
  const maxDepth = Math.max(...points.map((point) => point.depth), wallThickness);
  if (stationMax <= stationMin) {
    chart.innerHTML = "";
    summary.textContent = "Stations must span a positive length.";
    return;
  }

  const yMax = Math.max(wallThickness, maxDepth) * 1.08;
  const xScale = (station) => margin.left + ((station - stationMin) / (stationMax - stationMin)) * plotWidth;
  const yScale = (depth) => margin.top + (depth / yMax) * plotHeight;
  const topY = margin.top;
  const wallY = yScale(wallThickness);
  const bottomY = margin.top + plotHeight;
  const profilePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${xScale(point.station)} ${yScale(point.depth)}`).join(" ");
  const lossPolygon = [
    `${xScale(points[0].station)},${topY}`,
    ...points.map((point) => `${xScale(point.station)},${yScale(point.depth)}`),
    `${xScale(points[points.length - 1].station)},${topY}`,
  ].join(" ");
  const governing = result?.outputs?.controlling_segment || null;
  const governingRect =
    governing && Number.isFinite(Number(governing.start_station_mm)) && Number.isFinite(Number(governing.end_station_mm))
      ? `<rect class="governing-segment" x="${xScale(Number(governing.start_station_mm))}" y="${topY}" width="${Math.max(
          xScale(Number(governing.end_station_mm)) - xScale(Number(governing.start_station_mm)),
          1,
        )}" height="${wallY - topY}"><title>Governing segment: ${fmt(Number(governing.start_station_mm), 1)} to ${fmt(
          Number(governing.end_station_mm),
          1,
        )} mm</title></rect>`
      : "";

  const xTicks = [stationMin, stationMin + (stationMax - stationMin) / 2, stationMax];
  const yTicks = [0, wallThickness / 2, wallThickness];
  const tickMarkup = [
    ...xTicks.map(
      (tick) => `
        <line class="gridline" x1="${xScale(tick)}" y1="${topY}" x2="${xScale(tick)}" y2="${bottomY}"></line>
        <text x="${xScale(tick)}" y="${bottomY + 20}" text-anchor="middle">${fmt(tick, 1)}</text>
      `,
    ),
    ...yTicks.map(
      (tick) => `
        <line class="gridline" x1="${margin.left}" y1="${yScale(tick)}" x2="${margin.left + plotWidth}" y2="${yScale(tick)}"></line>
        <text x="${margin.left - 10}" y="${yScale(tick) + 4}" text-anchor="end">${fmt(tick, 1)}</text>
      `,
    ),
  ].join("");
  const pointMarkup = points
    .map(
      (point) => `
        <circle class="profile-point" cx="${xScale(point.station)}" cy="${yScale(point.depth)}" r="4">
          <title>${fmt(point.station, 1)} mm station, ${fmt(point.depth, 2)} mm depth</title>
        </circle>
      `,
    )
    .join("");
  const deepest = points.reduce((max, point) => (point.depth > max.depth ? point : max), points[0]);
  const governingSummary = governing
    ? ` Governing segment: ${fmt(Number(governing.start_station_mm), 1)} to ${fmt(Number(governing.end_station_mm), 1)} mm.`
    : "";
  summary.textContent = `${points.length} points, ${fmt(stationMax - stationMin, 1)} mm profile length, deepest point ${fmt(
    deepest.depth,
    2,
  )} mm at ${fmt(deepest.station, 1)} mm.${governingSummary}`;
  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Corrosion depth profile">
      <rect class="pipe-wall" x="${margin.left}" y="${topY}" width="${plotWidth}" height="${wallY - topY}"></rect>
      <rect class="remaining-wall" x="${margin.left}" y="${wallY}" width="${plotWidth}" height="${Math.max(bottomY - wallY, 0)}"></rect>
      ${tickMarkup}
      ${governingRect}
      <polygon class="metal-loss-area" points="${lossPolygon}"></polygon>
      <path class="profile-line" d="${profilePath}"></path>
      <line class="wall-limit-line" x1="${margin.left}" y1="${wallY}" x2="${margin.left + plotWidth}" y2="${wallY}"></line>
      ${pointMarkup}
      <line class="axis-line" x1="${margin.left}" y1="${topY}" x2="${margin.left}" y2="${bottomY}"></line>
      <line class="axis-line" x1="${margin.left}" y1="${bottomY}" x2="${margin.left + plotWidth}" y2="${bottomY}"></line>
      <text class="axis-label" x="${margin.left + plotWidth / 2}" y="${height - 38}" text-anchor="middle">Station along corrosion profile (mm)</text>
      <text class="axis-label" transform="translate(20 ${margin.top + plotHeight / 2}) rotate(-90)" text-anchor="middle">Metal-loss depth (mm)</text>
      <text x="${margin.left + plotWidth - 6}" y="${wallY - 8}" text-anchor="end">wall thickness ${fmt(wallThickness, 2)} mm</text>
      <text class="chart-note" x="${margin.left}" y="${height - 20}">
        <tspan x="${margin.left}" dy="0">Orange area: measured metal loss.</tspan>
        <tspan x="${margin.left}" dy="15">Shaded band: governing effective-area segment after calculation.</tspan>
      </text>
    </svg>
  `;
}

function setRstrengOutput(result) {
  const output = result.outputs;
  const segment = output.controlling_segment;
  const wallThickness = Number(result.inputs.wall_thickness_mm);
  latestRstrengResult = result;
  $("rstrengStatus").textContent = output.status;
  $("rstrengDisposition").textContent = output.disposition;
  $("rstrengAssessmentBox").className = output.status === "PASS" ? "pass-fail-box pass-fail-pass" : "pass-fail-box pass-fail-fail";
  $("rstrengFailurePressure").textContent = `${fmt(segment.failure_pressure_mpa, 3)} MPa`;
  $("rstrengAllowablePressure").textContent = `${fmt(output.allowable_pressure_mpa, 3)} MPa`;
  $("rstrengPressureRatio").textContent = fmt(output.maop_to_allowable_ratio, 3);
  $("rstrengSegment").textContent = `${fmt(segment.start_station_mm, 1)} to ${fmt(segment.end_station_mm, 1)} mm`;
  $("rstrengEffectiveArea").textContent = `${fmt(segment.effective_area_mm2, 2)} mm2`;
  $("rstrengAreaRatio").textContent = `${fmt(segment.area_ratio * 100, 2)}%`;
  $("rstrengMaxDepthRatio").textContent = `${fmt((segment.max_depth_mm / wallThickness) * 100, 2)}%`;
  $("rstrengAverageDepth").textContent = `${fmt(segment.average_depth_mm, 2)} mm`;
  $("rstrengFolias").textContent = fmt(segment.folias_factor, 4);
  $("rstrengZ").textContent = fmt(segment.z_parameter, 3);
  $("rstrengFlowStress").textContent = `${fmt(output.flow_stress_mpa, 1)} MPa`;
  $("rstrengFailureStress").textContent = `${fmt(segment.failure_stress_mpa, 1)} MPa`;
  renderRstrengProfileChart(result);
  $("rstrengErrorBox").hidden = true;
}

async function calculateRstreng() {
  $("calculateRstrengButton").disabled = true;
  $("statusPill").textContent = "Calculating RSTRENG";
  try {
    const response = await fetch("/api/rstreng-calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readRstrengPayload()),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "RSTRENG calculation failed.");
    }
    setRstrengOutput(payload.result);
    $("statusPill").textContent = "RSTRENG calculated";
  } catch (error) {
    $("rstrengErrorBox").textContent = error.message;
    $("rstrengErrorBox").hidden = false;
    $("rstrengStatus").textContent = "Check inputs";
    $("rstrengDisposition").textContent = "RSTRENG calculation did not complete.";
    $("rstrengAssessmentBox").className = "pass-fail-box pass-fail-fail";
    $("statusPill").textContent = "Check inputs";
  } finally {
    $("calculateRstrengButton").disabled = false;
  }
}

function readInteractionPayload() {
  return {
    pipe: {
      outside_diameter_mm: valueOf("interactionOd"),
      wall_thickness_mm: valueOf("interactionWallThickness"),
      maop_mpa: valueOf("interactionMaop"),
      smys_mpa: valueOf("interactionSmys"),
      smts_mpa: valueOf("interactionSmts"),
      elastic_modulus_mpa: valueOf("interactionElasticModulus"),
      fracture_toughness_mpa_sqrt_m: valueOf("interactionToughness"),
      model_length_factor: valueOf("interactionLengthFactor"),
    },
    loading: {
      secondary_stress_mpa: valueOf("interactionSecondaryStress"),
      residual_stress_fraction: valueOf("interactionResidualStress"),
      pressure_range_mpa: valueOf("interactionPressureRange"),
      paris_c: valueOf("interactionParisC"),
      paris_m: valueOf("interactionParisM"),
    },
    uncertainty: {
      case: $("interactionSizingCase").value,
      depth_tolerance_mm: valueOf("interactionDepthTolerance"),
      length_tolerance_mm: valueOf("interactionLengthTolerance"),
      width_tolerance_mm: valueOf("interactionWidthTolerance"),
    },
    mesh: {
      refinement: $("interactionMeshRefinement").value,
      solver_strategy: $("interactionSolverStrategy").value,
    },
    anomalies: [
      {
        type: $("interactionA1Type").value,
        surface: $("interactionA1Surface").value,
        axial_location_mm: valueOf("interactionA1X"),
        clock_position_deg: valueOf("interactionA1Theta"),
        length_mm: valueOf("interactionA1Length"),
        width_mm: valueOf("interactionA1Width"),
        depth_mm: valueOf("interactionA1Depth"),
        orientation_deg: valueOf("interactionA1Orientation"),
      },
      {
        type: $("interactionA2Type").value,
        surface: $("interactionA2Surface").value,
        axial_location_mm: valueOf("interactionA2X"),
        clock_position_deg: valueOf("interactionA2Theta"),
        length_mm: valueOf("interactionA2Length"),
        width_mm: valueOf("interactionA2Width"),
        depth_mm: valueOf("interactionA2Depth"),
        orientation_deg: valueOf("interactionA2Orientation"),
      },
    ],
  };
}

const interactionVisualFieldIds = [
  "interactionOd",
  "interactionWallThickness",
  "interactionMaop",
  "interactionSmys",
  "interactionSmts",
  "interactionElasticModulus",
  "interactionToughness",
  "interactionLengthFactor",
  "interactionSecondaryStress",
  "interactionResidualStress",
  "interactionPressureRange",
  "interactionParisC",
  "interactionParisM",
  "interactionA1Type",
  "interactionA1Surface",
  "interactionA1X",
  "interactionA1Theta",
  "interactionA1Length",
  "interactionA1Width",
  "interactionA1Depth",
  "interactionA1Orientation",
  "interactionA2Type",
  "interactionA2Surface",
  "interactionA2X",
  "interactionA2Theta",
  "interactionA2Length",
  "interactionA2Width",
  "interactionA2Depth",
  "interactionA2Orientation",
  "interactionSizingCase",
  "interactionDepthTolerance",
  "interactionLengthTolerance",
  "interactionWidthTolerance",
  "interactionMeshRefinement",
  "interactionSolverStrategy",
];

function finiteOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function syncInteractionVisualFromInputs() {
  latestInteractionResult = null;
  renderInteractionVisuals();
  const currentStatus = $("interactionStatus").textContent;
  if (currentStatus && currentStatus !== "Not calculated") {
    $("interactionStatus").textContent = "Inputs changed";
    $("interactionDisposition").textContent = "Run the interacting anomalies model to update the calculated interaction results.";
    $("interactionAssessmentBox").className = "pass-fail-box pass-fail-neutral";
    $("interactionBoundaryList").innerHTML = "<li>Inputs changed. Recalculate to update FEA notes and boundary-condition results.</li>";
  }
}

function anomalyClass(type) {
  if (type === "metal_loss") {
    return "anomaly-metal-loss";
  }
  if (type === "crack") {
    return "anomaly-crack";
  }
  if (type === "dent") {
    return "anomaly-dent";
  }
  if (type === "weld") {
    return "anomaly-weld";
  }
  return "anomaly-mixed";
}

function anomalyName(type) {
  return {
    metal_loss: "Metal loss",
    crack: "Crack",
    dent: "Dent",
    weld: "Weld-related",
    mixed: "Mixed",
  }[type] || "Anomaly";
}

function renderedAnomalies(result, payload) {
  if (result?.anomalies?.length) {
    return result.anomalies;
  }
  return payload.anomalies.map((anomaly, index) => ({
    ...anomaly,
    id: `A${index + 1}`,
    failure_pressure_mpa: 0,
  }));
}

function renderInteractionVisuals(result = null) {
  const payload = readInteractionPayload();
  const anomalies = renderedAnomalies(result, payload);
  const diameter = Math.max(finiteOr(payload.pipe.outside_diameter_mm, 762), 1);
  const modelLength = Math.max(finiteOr(result?.mesh?.model_length_mm, payload.pipe.model_length_factor * diameter), diameter * 6, 1);
  const xMin = -modelLength / 2;
  const xMax = modelLength / 2;
  const viewWidth = 920;
  const viewHeight = 450;
  const pipeX = 74;
  const pipeY = 126;
  const pipeW = 790;
  const pipeH = 210;
  const xScale = (value) => pipeX + ((value - xMin) / (xMax - xMin)) * pipeW;
  const yScale = (theta) => pipeY + ((theta % 360) / 360) * pipeH;
  const widthScale = (value) => Math.max(44, (value / modelLength) * pipeW * 1.7);
  const circumScale = (value) => Math.max(34, (value / (Math.PI * diameter)) * pipeH * 2.1);
  const coarseLines = [];
  for (let i = 0; i <= 10; i += 1) {
    const x = pipeX + (pipeW * i) / 10;
    coarseLines.push(`<line class="mesh-line" x1="${x}" y1="${pipeY}" x2="${x}" y2="${pipeY + pipeH}"></line>`);
  }
  for (let i = 0; i <= 6; i += 1) {
    const y = pipeY + (pipeH * i) / 6;
    coarseLines.push(`<line class="mesh-line" x1="${pipeX}" y1="${y}" x2="${pipeX + pipeW}" y2="${y}"></line>`);
  }
  const boxes = anomalies.map((anomaly) => {
    const x = xScale(finiteOr(anomaly.axial_location_mm, 0));
    const y = yScale(finiteOr(anomaly.clock_position_deg, 0));
    const w = widthScale(Math.max(finiteOr(anomaly.length_mm, 1), 1));
    const h = circumScale(Math.max(finiteOr(anomaly.width_mm, 1), 1));
    return { anomaly, x, y, w, h };
  });
  const minX = Math.min(...boxes.map((box) => box.x - box.w / 2));
  const maxX = Math.max(...boxes.map((box) => box.x + box.w / 2));
  const minY = Math.min(...boxes.map((box) => box.y - box.h / 2));
  const maxY = Math.max(...boxes.map((box) => box.y + box.h / 2));
  const fineLines = [];
  for (let x = minX - 28; x <= maxX + 28; x += 18) {
    fineLines.push(`<line class="mesh-line-fine" x1="${x}" y1="${Math.max(pipeY, minY - 28)}" x2="${x}" y2="${Math.min(pipeY + pipeH, maxY + 28)}"></line>`);
  }
  for (let y = minY - 28; y <= maxY + 28; y += 14) {
    fineLines.push(`<line class="mesh-line-fine" x1="${Math.max(pipeX, minX - 28)}" y1="${y}" x2="${Math.min(pipeX + pipeW, maxX + 28)}" y2="${y}"></line>`);
  }
  const anomalyShapes = boxes
    .map(({ anomaly, x, y, w, h }) => {
      const label = `${anomaly.id || ""} ${anomalyName(anomaly.type)}`;
      const depthRatio = Math.min(Math.max(finiteOr(anomaly.depth_mm, 0) / Math.max(payload.pipe.wall_thickness_mm, 0.001), 0), 1);
      const detail = `${label}: x=${fmt(finiteOr(anomaly.axial_location_mm, 0), 1)} mm; theta=${fmt(
        finiteOr(anomaly.clock_position_deg, 0),
        1,
      )} deg; L=${fmt(finiteOr(anomaly.length_mm, 0), 1)} mm; W=${fmt(finiteOr(anomaly.width_mm, 0), 1)} mm; depth=${fmt(
        finiteOr(anomaly.depth_mm, 0),
        2,
      )} mm`;
      if (anomaly.type === "crack") {
        const angle = anomaly.orientation_deg || 0;
        const depthBar = Math.max(12, h * depthRatio);
        return `
          <g class="anomaly-marker" transform="rotate(${angle} ${x} ${y})">
            <title>${escapeHtml(detail)}</title>
            <rect class="anomaly-depth-bar" x="${x - w / 2}" y="${y + 9}" width="${w}" height="${depthBar}" rx="4"></rect>
            <line class="anomaly-crack-halo" x1="${x - w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y}"></line>
            <line class="${anomalyClass(anomaly.type)}" x1="${x - w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y}"></line>
            <circle class="crack-tip" cx="${x - w / 2}" cy="${y}" r="6"></circle>
            <circle class="crack-tip" cx="${x + w / 2}" cy="${y}" r="6"></circle>
          </g>
        `;
      }
      if (anomaly.type === "dent") {
        return `<g class="anomaly-marker"><title>${escapeHtml(detail)}</title><ellipse class="${anomalyClass(anomaly.type)}" cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}"></ellipse></g>`;
      }
      if (anomaly.type === "metal_loss") {
        const coreW = Math.max(w * (0.34 + depthRatio * 0.32), 14);
        const coreH = Math.max(h * (0.28 + depthRatio * 0.36), 12);
        return `
          <g class="anomaly-marker">
            <title>${escapeHtml(detail)}</title>
            <rect class="anomaly-metal-loss" x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="10"></rect>
            <rect class="anomaly-metal-loss-core" x="${x - coreW / 2}" y="${y - coreH / 2}" width="${coreW}" height="${coreH}" rx="8"></rect>
            <path class="anomaly-metal-loss-contour" d="M ${x - w * 0.38} ${y - h * 0.18} C ${x - w * 0.12} ${y - h * 0.38}, ${x + w * 0.22} ${y - h * 0.32}, ${x + w * 0.38} ${y - h * 0.08} S ${x + w * 0.28} ${y + h * 0.28}, ${x - w * 0.18} ${y + h * 0.24} S ${x - w * 0.42} ${y + h * 0.02}, ${x - w * 0.38} ${y - h * 0.18}"></path>
          </g>
        `;
      }
      return `<g class="anomaly-marker"><title>${escapeHtml(detail)}</title><rect class="${anomalyClass(anomaly.type)}" x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="10"></rect></g>`;
    })
    .join("");
  const anomalyCallouts = boxes
    .map(({ anomaly, x, y }, index) => {
      const calloutX = 86 + index * 286;
      const calloutY = 48;
      const calloutW = 258;
      const calloutH = 58;
      const label = `${anomaly.id || ""} ${anomalyName(anomaly.type)}`;
      const depthRatio = Math.min(Math.max(finiteOr(anomaly.depth_mm, 0) / Math.max(payload.pipe.wall_thickness_mm, 0.001), 0), 1);
      const dimensionText = `L ${fmt(finiteOr(anomaly.length_mm, 0), 0)} mm | W ${fmt(finiteOr(anomaly.width_mm, 0), 0)} mm | d ${fmt(
        finiteOr(anomaly.depth_mm, 0),
        2,
      )} mm (${fmt(depthRatio * 100, 1)}%t)`;
      return `
        <g class="anomaly-callout">
          <path class="anomaly-callout-line" d="M ${calloutX + calloutW / 2} ${calloutY + calloutH} L ${calloutX + calloutW / 2} ${
            pipeY - 10
          } L ${x} ${Math.max(pipeY, y - 14)}"></path>
          <rect x="${calloutX}" y="${calloutY}" width="${calloutW}" height="${calloutH}" rx="7"></rect>
          <text class="anomaly-callout-title" x="${calloutX + 12}" y="${calloutY + 23}">${escapeHtml(label)}</text>
          <text class="anomaly-callout-detail" x="${calloutX + 12}" y="${calloutY + 43}">${escapeHtml(dimensionText)}</text>
        </g>
      `;
    })
    .join("");
  $("interactionVisualization").innerHTML = `
    <svg viewBox="0 0 ${viewWidth} ${viewHeight}" role="img" aria-label="Developed pipe anomaly interaction map">
      <defs>
        <marker id="arrowHead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#0b7f88"></path></marker>
        <marker id="axisArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#163a5b"></path></marker>
      </defs>
      <text x="74" y="26">Developed pipe surface: anomaly interaction envelope and local mesh refinement</text>
      <rect class="pipe-shell" x="${pipeX}" y="${pipeY}" width="${pipeW}" height="${pipeH}" rx="10"></rect>
      ${coarseLines.join("")}
      <line class="pipe-axis" x1="${pipeX + 20}" y1="${pipeY + pipeH / 2}" x2="${pipeX + pipeW - 20}" y2="${pipeY + pipeH / 2}"></line>
      <text class="axis-label" x="${pipeX + pipeW - 118}" y="${pipeY + pipeH / 2 - 10}">Pipe axis</text>
      <rect class="interaction-envelope" x="${Math.max(pipeX, minX - 34)}" y="${Math.max(pipeY, minY - 34)}" width="${Math.min(pipeX + pipeW, maxX + 34) - Math.max(pipeX, minX - 34)}" height="${Math.min(pipeY + pipeH, maxY + 34) - Math.max(pipeY, minY - 34)}" rx="14"></rect>
      ${fineLines.join("")}
      ${anomalyCallouts}
      ${anomalyShapes}
      <line class="load-arrow" x1="42" y1="${pipeY + pipeH / 2}" x2="${pipeX - 8}" y2="${pipeY + pipeH / 2}"></line>
      <line class="load-arrow" x1="${pipeX + pipeW + 42}" y1="${pipeY + pipeH / 2}" x2="${pipeX + pipeW + 8}" y2="${pipeY + pipeH / 2}"></line>
      <text x="42" y="${pipeY + pipeH + 36}">Axial coordinate x</text>
      <text x="${pipeX + pipeW - 190}" y="${pipeY + pipeH + 36}">Circumferential coordinate theta</text>
      <text x="${pipeX}" y="${pipeY + pipeH + 64}">I = ${result ? fmt(result.outputs.interaction_factor, 3) : "not calculated"}; class = ${result ? result.outputs.interaction_classification : "pending"}</text>
      <g class="interaction-legend">
        <rect class="anomaly-metal-loss" x="652" y="56" width="28" height="14" rx="4"></rect>
        <text x="690" y="68">Metal loss extent/core</text>
        <text x="690" y="84">scales with depth</text>
        <line class="anomaly-crack" x1="652" y1="100" x2="680" y2="100"></line>
        <text x="690" y="104">Crack length/orientation</text>
        <text x="690" y="120">from anomaly inputs</text>
      </g>
    </svg>
  `;

  const meshInfo = result?.mesh || {};
  const throughElements = meshInfo.through_ligament_elements || 6;
  const throughLines = Array.from({ length: throughElements + 1 }, (_, index) => {
    const y = 78 + index * (96 / throughElements);
    return `<line class="mesh-line-fine" x1="332" y1="${y}" x2="594" y2="${y}"></line>`;
  }).join("");
  $("meshBoundaryVisualization").innerHTML = `
    <svg viewBox="0 0 920 310" role="img" aria-label="FEA mesh and boundary condition schematic">
      <defs><marker id="arrowHead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#0b7f88"></path></marker></defs>
      <text x="72" y="32">FEA mesh architecture and boundary conditions</text>
      <rect class="pipe-shell" x="90" y="86" width="720" height="82" rx="40"></rect>
      <rect class="interaction-envelope" x="320" y="64" width="286" height="126" rx="12"></rect>
      ${Array.from({ length: 13 }, (_, index) => `<line class="mesh-line" x1="${90 + index * 60}" y1="86" x2="${90 + index * 60}" y2="168"></line>`).join("")}
      ${Array.from({ length: 4 }, (_, index) => `<line class="mesh-line" x1="90" y1="${86 + index * 27}" x2="810" y2="${86 + index * 27}"></line>`).join("")}
      ${Array.from({ length: 12 }, (_, index) => `<line class="mesh-line-fine" x1="${332 + index * 24}" y1="64" x2="${332 + index * 24}" y2="190"></line>`).join("")}
      ${throughLines}
      <path class="bc-symbol" d="M76 82 L92 92 L76 102 z M76 116 L92 126 L76 136 z M76 150 L92 160 L76 170 z"></path>
      <text x="22" y="206">Fixed reference ring</text>
      <line class="load-arrow" x1="846" y1="126" x2="806" y2="126"></line>
      <text x="690" y="210">Closed-end axial stress</text>
      <line class="load-arrow" x1="446" y1="42" x2="446" y2="78"></line>
      <line class="load-arrow" x1="492" y1="212" x2="492" y2="176"></line>
      <text x="384" y="236">Internal pressure on ID</text>
      <text x="330" y="58">Refined solid continuum mesh</text>
      <text x="338" y="204">4-6+ elements through remaining ligament: ${throughElements}</text>
      <text x="96" y="244">Remote pipe: coarse mesh with smooth transition</text>
      <text x="96" y="270">Solver: ${escapeHtml(textOfSelect("interactionSolverStrategy"))}</text>
      <text x="520" y="270">Estimated elements: ${result ? fmt(meshInfo.estimated_solid_elements, 0) : "pending"}</text>
    </svg>
  `;
}

function setInteractionOutput(result) {
  latestInteractionResult = result;
  const output = result.outputs;
  const mesh = result.mesh;
  $("interactionStatus").textContent = output.status;
  $("interactionDisposition").textContent = output.recommended_response;
  $("interactionAssessmentBox").className =
    output.status === "ACCEPTABLE"
      ? "pass-fail-box pass-fail-pass"
      : output.status === "MARGINAL"
        ? "pass-fail-box pass-fail-neutral"
        : "pass-fail-box pass-fail-fail";
  $("interactionFactor").textContent = fmt(output.interaction_factor, 3);
  $("interactionClass").textContent = output.interaction_classification;
  $("interactionCombinedPressure").textContent = `${fmt(output.combined_failure_pressure_mpa, 3)} MPa`;
  $("interactionWeakestPressure").textContent = `${fmt(output.weakest_isolated_failure_pressure_mpa, 3)} MPa`;
  $("interactionSafetyFactor").textContent = fmt(output.safety_factor, 3);
  $("interactionSafetyCategory").textContent = output.safety_category;
  $("interactionAxialSpacing").textContent = `${fmt(output.axial_edge_spacing_mm, 1)} mm`;
  $("interactionCircSpacing").textContent = `${fmt(output.circumferential_edge_spacing_mm, 1)} mm`;
  $("interactionLambdaX").textContent = fmt(output.lambda_x, 3);
  $("interactionLambdaTheta").textContent = fmt(output.lambda_theta, 3);
  $("interactionMaxStrain").textContent = fmt(output.max_equivalent_plastic_strain, 4);
  $("interactionKMax").textContent = `${fmt(output.k_max_mpa_sqrt_m, 2)} MPa*m^0.5`;
  $("interactionRemainingCycles").textContent =
    output.remaining_cycles === null || output.remaining_cycles === undefined ? "Not checked" : `${fmt(output.remaining_cycles, 0)} cycles`;
  $("interactionCriticalLocation").textContent = output.critical_location;
  $("interactionModelLength").textContent = `${fmt(mesh.model_length_mm, 0)} mm`;
  $("interactionElementCount").textContent = fmt(mesh.estimated_solid_elements, 0);
  const notes = [
    output.interaction_response,
    `Governing failure mode: ${output.governing_failure_mode}.`,
    ...mesh.boundary_conditions,
  ];
  $("interactionBoundaryList").innerHTML = notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("");
  renderInteractionVisuals(result);
  $("interactionErrorBox").hidden = true;
}

async function calculateInteraction() {
  $("calculateInteractionButton").disabled = true;
  $("statusPill").textContent = "Calculating FEA model";
  try {
    const response = await fetch("/api/interacting-anomalies-calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readInteractionPayload()),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Interacting anomaly model failed.");
    }
    setInteractionOutput(payload.result);
    $("statusPill").textContent = "FEA model calculated";
  } catch (error) {
    $("interactionErrorBox").textContent = error.message;
    $("interactionErrorBox").hidden = false;
    $("interactionStatus").textContent = "Check inputs";
    $("interactionDisposition").textContent = "Interacting anomaly model did not complete.";
    $("interactionAssessmentBox").className = "pass-fail-box pass-fail-fail";
    $("statusPill").textContent = "Check inputs";
  } finally {
    $("calculateInteractionButton").disabled = false;
  }
}

function readPrciDentPayload() {
  return {
    pipe: {
      outside_diameter_mm: valueOf("prciDentOd"),
      wall_thickness_mm: valueOf("prciDentWallThickness"),
      operating_pressure_mpa: valueOf("prciDentPressure"),
      smys_mpa: valueOf("prciDentSmys"),
    },
    dent: {
      depth_mm: valueOf("prciDentDepth"),
      radius_mm: valueOf("prciDentRadius"),
    },
    fatigue: {
      stress_cycles: valueOf("prciDentCycles"),
      stress_concentration_factor: valueOf("prciDentScf"),
    },
    crack_growth: {
      enabled: $("prciDentCrackGrowthEnabled").value === "yes",
      initial_crack_mm: valueOf("prciDentInitialCrack"),
      critical_crack_mm: valueOf("prciDentCriticalCrack"),
      stress_range_mpa: valueOf("prciDentStressRange"),
      paris_c: valueOf("prciDentParisC"),
      paris_m: valueOf("prciDentParisM"),
      increment_mm: valueOf("prciDentCrackIncrement"),
    },
  };
}

function setPrciDentOutput(result) {
  const output = result.outputs;
  const crackGrowth = output.crack_growth || {};
  $("prciDentStatus").textContent = output.status;
  $("prciDentResult").textContent = output.assessment_result;
  $("prciDentAssessmentBox").className = output.status === "ACCEPTABLE" ? "pass-fail-box pass-fail-pass" : "pass-fail-box pass-fail-fail";
  $("prciDentDepthPercent").textContent = `${fmt(output.dent_depth_percent, 3)}%`;
  $("prciDentHoopStress").textContent = `${fmt(output.hoop_stress_mpa, 2)} MPa`;
  $("prciDentBendingStrain").textContent = fmt(output.bending_strain, 4);
  $("prciDentEquivalentStress").textContent = `${fmt(output.equivalent_stress_mpa, 2)} MPa`;
  $("prciDentFatigueLife").textContent = `${fmt(output.fatigue_life_cycles, 0)} cycles`;
  $("prciDentRsf").textContent = fmt(output.remaining_strength_factor, 3);
  $("prciDentCrackGrowthLife").textContent = crackGrowth.enabled ? `${fmt(crackGrowth.estimated_cycles, 0)} cycles` : "Not checked";
  $("prciDentCrackGrowthStatus").textContent = crackGrowth.enabled ? crackGrowth.status : "-";
  const criteria = Array.isArray(output.criteria) ? output.criteria : [];
  $("prciDentCriteriaList").innerHTML = criteria.length
    ? criteria
        .map((criterion) => {
          const status = criterion.status === "PASS" ? "PASS" : "FAIL";
          const className = status === "PASS" ? "criteria-pass" : "criteria-fail";
          return `<li class="${className}"><strong>${status}</strong> ${escapeHtml(criterion.message)}</li>`;
        })
        .join("")
    : "<li>No PRCI criteria were returned by the calculation.</li>";
  $("prciDentErrorBox").hidden = true;
}

async function calculatePrciDent() {
  $("calculatePrciDentButton").disabled = true;
  $("statusPill").textContent = "Calculating PRCI dent";
  try {
    const response = await fetch("/api/prci-level2-dent-calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readPrciDentPayload()),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "PRCI Level 2 dent assessment failed.");
    }
    setPrciDentOutput(payload.result);
    $("statusPill").textContent = "PRCI dent calculated";
  } catch (error) {
    $("prciDentErrorBox").textContent = error.message;
    $("prciDentErrorBox").hidden = false;
    $("prciDentStatus").textContent = "Check inputs";
    $("prciDentResult").textContent = "PRCI Level 2 dent assessment did not complete.";
    $("prciDentAssessmentBox").className = "pass-fail-box pass-fail-fail";
    $("prciDentCriteriaList").innerHTML = "<li>Calculation did not complete; criteria are not available.</li>";
    $("statusPill").textContent = "Check inputs";
  } finally {
    $("calculatePrciDentButton").disabled = false;
  }
}

function setAnnexKOutput(result) {
  const output = result.outputs;
  $("ecaStatus").textContent = output.status;
  $("ecaDisposition").textContent = `Disposition: ${output.disposition}`;
  $("ecaAssessmentBox").className = output.status.includes("REJECT") ? "pass-fail-box pass-fail-fail" : "pass-fail-box pass-fail-pass";
  $("ecaEffectiveHeight").textContent = `${fmt(output.effective_flaw_height_mm, 1)} mm`;
  $("ecaEffectiveLength").textContent = `${fmt(output.effective_flaw_length_mm, 1)} mm`;
  $("ecaScf").textContent = fmt(output.scf, 2);
  $("ecaHoopStress").textContent = `${fmt(output.hoop_stress_mpa, 1)} MPa`;
  $("ecaAxialStress").textContent = `${fmt(output.restrained_axial_stress_mpa, 1)} MPa`;
  $("ecaMismatch").textContent = fmt(output.strength_mismatch_ratio, 2);
  $("ecaLr").textContent = fmt(output.load_ratio_lr, 2);
  $("ecaKr").textContent = fmt(output.fracture_ratio_kr, 2);
  $("ecaFadBoundary").textContent = fmt(output.fad_boundary, 2);
  $("ecaAssessmentLevel").textContent = output.assessment_level;
  $("ecaGatewayChecks").textContent = output.gateway_issues.length ? output.gateway_issues.join(" ") : "Passed";
  $("ecaErrorBox").hidden = true;
}

async function calculateAnnexK() {
  $("calculateAnnexKButton").disabled = true;
  $("statusPill").textContent = "Calculating ECA";
  try {
    const response = await fetch("/api/annex-k-eca-calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readAnnexKPayload()),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Annex K ECA calculation failed.");
    }
    setAnnexKOutput(payload.result);
    $("statusPill").textContent = "ECA calculated";
  } catch (error) {
    $("ecaErrorBox").textContent = error.message;
    $("ecaErrorBox").hidden = false;
    $("ecaStatus").textContent = "Check inputs";
    $("ecaDisposition").textContent = "Annex K ECA calculation did not complete.";
    $("ecaAssessmentBox").className = "pass-fail-box pass-fail-fail";
    $("statusPill").textContent = "Check inputs";
  } finally {
    $("calculateAnnexKButton").disabled = false;
  }
}

function setCorlasOutput(result) {
  const outputs = result.outputs;
  const intermediate = result.intermediate;
  $("corlasStatus").textContent = `${fmt(outputs.fracture_pressure_mpa, 4)} MPa`;
  $("corlasStatusDetail").textContent = "";
  $("corlasAssessmentBox").className = "pass-fail-box pass-fail-pass";
  $("corlasFracturePressure").textContent = `${fmt(outputs.fracture_pressure_mpa, 4)} MPa`;
  $("corlasFracturePressurePsi").textContent = `${fmt(outputs.fracture_pressure_psi, 1)} psi`;
  $("corlasCollapsePressure").textContent = `${fmt(outputs.collapse_pressure_mpa, 4)} MPa`;
  $("corlasCollapsePressurePsi").textContent = `${fmt(outputs.collapse_pressure_psi, 1)} psi`;
  $("corlasFailurePressure").textContent = `${fmt(outputs.failure_pressure_mpa, 4)} MPa`;
  $("corlasFailurePressurePsi").textContent = `${fmt(outputs.failure_pressure_psi, 1)} psi`;
  $("corlasJt").textContent = fmt(intermediate.total_j, 4);
  $("corlasJe").textContent = fmt(intermediate.elastic_j, 4);
  $("corlasJp").textContent = fmt(intermediate.plastic_j, 4);
  $("corlasFlowStress").textContent = `${fmt(intermediate.flow_stress_mpa, 2)} MPa`;
  $("corlasFoliasFactor").textContent = fmt(intermediate.folias_factor_m, 4);
  $("corlasQf").textContent = fmt(intermediate.qf, 4);
  $("corlasFsf").textContent = fmt(intermediate.fsf, 4);
  $("corlasN").textContent = fmt(intermediate.strain_hardening_n, 6);
  $("corlasLocalStress").textContent = `${fmt(intermediate.local_stress_mpa, 3)} MPa`;
  $("corlasPlasticStrain").textContent = fmt(intermediate.plastic_strain, 6);
  $("corlasF3").textContent = fmt(intermediate.shih_hutchinson_f3, 4);
  $("corlasErrorBox").hidden = true;
}

async function calculateCorlas() {
  $("calculateCorlasButton").disabled = true;
  $("statusPill").textContent = "Calculating CorLAS";
  try {
    const response = await fetch("/api/corlas-calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readCorlasPayload()),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "CorLAS calculation failed.");
    }
    setCorlasOutput(payload.result);
    $("statusPill").textContent = "CorLAS calculated";
  } catch (error) {
    $("corlasErrorBox").textContent = error.message;
    $("corlasErrorBox").hidden = false;
    $("corlasStatus").textContent = "Check inputs";
    $("corlasStatusDetail").textContent = "CorLAS calculation did not complete.";
    $("corlasAssessmentBox").className = "pass-fail-box pass-fail-fail";
    $("statusPill").textContent = "Check inputs";
  } finally {
    $("calculateCorlasButton").disabled = false;
  }
}

async function calculate() {
  $("statusPill").textContent = "Calculating";
  $("calculateButton").disabled = true;
  try {
    const response = await fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readPayload()),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Calculation failed.");
    }
    setOutput(payload.result);
    $("errorBox").hidden = true;
    $("statusPill").textContent = "Calculated";
  } catch (error) {
    showError(error.message);
  } finally {
    $("calculateButton").disabled = false;
  }
}

function syncGradeState() {
  const custom = $("grade").value === "custom";
  $("customSmys").disabled = !custom;
  if (!custom) {
    $("customSmys").value = $("grade").value;
  }
}

function applySoilProfile() {
  const profile = soilProfiles[$("soilProfile").value];
  if (!profile) {
    return;
  }
  $("soilProfileSummary").textContent = profile.summary;
  if ($("soilProfile").value === "custom") {
    return;
  }
  $("surfaceLayerThickness").value = profile.surfaceLayerThickness;
  $("surfaceLayerUnitWeight").value = profile.surfaceLayerUnitWeight;
  $("soilUnitWeight").value = profile.soilUnitWeight;
  $("soilModulus").value = profile.soilModulus;
  $("kb").value = profile.kb;
  $("kz").value = profile.kz;
}

function syncSoilLoadModel() {
  const trapDoor = $("soilLoadModel").value === "trap_door";
  $("soilFrictionAngle").disabled = !trapDoor;
}

function syncFatigueInputs() {
  const enabled = $("fatigueEnabled").value === "on";
  const manual = $("fatigueStressSource").value === "manual";
  $("fatigueStressSource").disabled = !enabled;
  $("fatigueStressRange").disabled = !enabled || !manual;
  $("fatigueCycles").disabled = !enabled;
  $("fatigueExponent").disabled = !enabled;
  $("fatigueConstant").disabled = !enabled;
  if (latestResult) {
    setFatigueOutput(calculateFatigueResult(latestResult.mop.live_hoop_bending_psi));
  } else if (!enabled) {
    setFatigueOutput(calculateFatigueResult(0));
  } else {
    $("fatigueSummary").textContent =
      manual ? "Enter cyclic loading and manual stress range." : "Run calculation to use calculated live-load hoop stress range.";
  }
}

function applyMitigationPreset() {
  const preset = mitigationPresets[$("mitigationType").value];
  if (!preset) {
    return;
  }
  $("mitigationWidth").value = preset.width;
  $("mitigationLength").value = preset.length;
  $("mitigationThickness").value = preset.thickness;
  $("mitigationSpreadAngle").value = preset.spreadAngle;
  $("mitigationUnitWeight").value = preset.unitWeight;
  if (latestResult) {
    refreshMitigationScenario();
  } else {
    $("mitigationSummary").textContent =
      $("mitigationType").value === "none" ? "No mitigation is included." : "Run calculation to see mitigated results separately.";
  }
}

function calculateBendingStrainMicrostrain() {
  if ($("bendingStrainMode").value === "direct") {
    return valueOf("bendingStrain");
  }
  const deflection = valueOf("pipeDeflection");
  const length = valueOf("deflectedPipeLength");
  const outsideDiameter = valueOf("outsideDiameter");
  if (length <= 0) {
    return 0;
  }
  const curvature = (8 * deflection) / (length * length);
  return (outsideDiameter / 2) * curvature * 1_000_000;
}

function syncBendingStrainMode() {
  const deflectionMode = $("bendingStrainMode").value === "deflection";
  $("bendingStrain").disabled = deflectionMode;
  $("pipeDeflection").disabled = !deflectionMode;
  $("deflectedPipeLength").disabled = !deflectionMode;
  if (deflectionMode) {
    const strain = calculateBendingStrainMicrostrain();
    $("bendingStrain").value = Math.round(strain * 10) / 10;
    $("strainSummary").textContent =
      `Calculated bending strain: ${fmt(strain, 1)} microstrain from deflection and pipe length.`;
  } else {
    $("strainSummary").textContent = "Direct bending strain input is used.";
  }
}

for (const id of baseFields) {
  $(id).addEventListener("input", () => {
    if (id !== "assessmentName" && id !== "userName" && !postCalculationFields.has(id)) {
      latestResult = null;
    }
    if (id === "grade") {
      syncGradeState();
    }
    if (id === "vehiclePreset") {
      applyVehiclePreset();
      return;
    }
    if (
      [
        "vehicleType",
        "axleCount",
        "contactArea",
        "tirePressure",
        "axleWidth",
        "tireWidth",
        "axleSpacing",
      ].includes(id)
    ) {
      markVehicleCustom(id);
    }
    if (id === "soilProfile") {
      applySoilProfile();
    }
    if (id === "soilLoadModel") {
      syncSoilLoadModel();
    }
    if (["bendingStrainMode", "pipeDeflection", "deflectedPipeLength", "outsideDiameter"].includes(id)) {
      syncBendingStrainMode();
    }
    if (
      ["fatigueEnabled", "fatigueStressSource", "fatigueStressRange", "fatigueCycles", "fatigueExponent", "fatigueConstant"].includes(id)
    ) {
      syncFatigueInputs();
    }
    if (id === "mitigationType") {
      applyMitigationPreset();
    }
    if (["mitigationWidth", "mitigationLength", "mitigationThickness", "mitigationSpreadAngle", "mitigationUnitWeight"].includes(id)) {
      refreshMitigationScenario();
    }
    if (id === "tirePressure") {
      tirePressures.fill(valueOf("tirePressure"));
      renderSchematic();
    }
    if (id === "tireWidth") {
      tireWidths.fill(valueOf("tireWidth"));
      renderSchematic();
    }
    if (id === "contactArea") {
      contactAreas.fill(valueOf("contactArea"));
      renderSchematic();
    }
    if (id === "axleWidth") {
      axleWidths.fill(valueOf("axleWidth"));
      renderSchematic();
    }
    if (id === "axleSpacing") {
      axleSpacings.fill(valueOf("axleSpacing"));
      renderSchematic();
    }
    if (id === "axleCount" || id === "vehicleType") {
      renderSchematic();
    }
  });
}

for (const id of interactionVisualFieldIds) {
  const field = $(id);
  const eventName = field.tagName === "SELECT" ? "change" : "input";
  field.addEventListener(eventName, syncInteractionVisualFromInputs);
}

for (const id of ["rstrengStations", "rstrengDepths", "rstrengWallThickness"]) {
  $(id).addEventListener("input", () => {
    latestRstrengResult = null;
    renderRstrengProfileChart(null);
  });
}

for (const id of ["sccDepths", "sccLengths", "sccSpacings", "sccWallThickness"]) {
  $(id).addEventListener("input", () => {
    renderSccColonyVisualization(null);
  });
}

$("calculateButton").addEventListener("click", calculate);
$("reportButton").addEventListener("click", createReport);
$("moduleSelect").addEventListener("change", handleModuleSelection);
$("iliWorkflowButton").addEventListener("click", showIliScreeningAssessment);
$("moduleHelpButton").addEventListener("click", openHelpDialog);
$("helpDialogClose").addEventListener("click", closeHelpDialog);
$("helpDialogOverlay").addEventListener("click", (event) => {
  if (event.target === $("helpDialogOverlay")) {
    closeHelpDialog();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("helpDialogOverlay").hidden) {
    closeHelpDialog();
  }
});
$("backToModulesFromCorlas").addEventListener("click", showModuleHome);
$("backToModulesFromSccColony").addEventListener("click", showModuleHome);
$("backToModulesFromCrackGrowth").addEventListener("click", showModuleHome);
$("backToModulesFromIliScreening").addEventListener("click", showModuleHome);
$("backToModulesFromIliToFea").addEventListener("click", showModuleHome);
$("backToModulesFromAnnexK").addEventListener("click", showModuleHome);
$("backToModulesFromDent").addEventListener("click", showModuleHome);
$("backToModulesFromB31g").addEventListener("click", showModuleHome);
$("backToModulesFromRstreng").addEventListener("click", showModuleHome);
$("backToModulesFromPrciDent").addEventListener("click", showModuleHome);
$("backToModulesFromInteraction").addEventListener("click", showModuleHome);
$("corlasReportButton").addEventListener("click", () => createModuleReport("corlas"));
$("sccColonyReportButton").addEventListener("click", () => createModuleReport("sccColony"));
$("crackGrowthReportButton").addEventListener("click", () => createModuleReport("crackGrowth"));
$("iliScreeningReportButton").addEventListener("click", () => createModuleReport("iliScreening"));
$("iliToFeaReportButton").addEventListener("click", () => createModuleReport("iliToFea"));
$("ecaReportButton").addEventListener("click", () => createModuleReport("annexK"));
$("dentReportButton").addEventListener("click", () => createModuleReport("dent"));
$("b31gReportButton").addEventListener("click", () => createModuleReport("b31g"));
$("rstrengReportButton").addEventListener("click", () => createModuleReport("rstreng"));
$("prciDentReportButton").addEventListener("click", () => createModuleReport("prciDent"));
$("interactionReportButton").addEventListener("click", () => createModuleReport("interaction"));
$("calculateCorlasButton").addEventListener("click", calculateCorlas);
$("calculateSccColonyButton").addEventListener("click", calculateSccColony);
$("calculateCrackGrowthButton").addEventListener("click", calculateCrackGrowth);
$("calculateIliScreeningButton").addEventListener("click", calculateIliScreening);
$("calculateIliToFeaButton").addEventListener("click", calculateIliToFea);
$("iliToFeaFile").addEventListener("change", handleIliToFeaFile);
$("iliToFeaMflFile").addEventListener("change", (event) => handleIliRawToolFile(event, "mfl"));
$("iliToFeaCrackFile").addEventListener("change", (event) => handleIliRawToolFile(event, "crack"));
$("iliToFeaCaliperFile").addEventListener("change", (event) => handleIliRawToolFile(event, "caliper"));
$("iliToFeaGeometrySource").addEventListener("change", () => {
  const source = $("iliToFeaGeometrySource").value;
  $("iliToFeaGeometrySourceNote").textContent =
    source === "raw"
      ? "The feature list is ignored. Raw files must provide enough location metadata to place each feature."
      : source === "feature"
        ? "The summarized feature list drives calculations; raw rows are retained for review but do not resize defects."
        : "Raw tool geometry governs matching features, with the summarized feature list used as metadata and fallback.";
});
function syncIliToFeaWeldMismatch() {
  const smys = Number($("iliToFeaSmys").value);
  const weldYield = Number($("iliToFeaWeldYield").value);
  $("iliToFeaWeldMismatch").textContent =
    Number.isFinite(smys) && smys > 0 && Number.isFinite(weldYield) ? (weldYield / smys).toFixed(2) : "-";
}
function syncIliToFeaWeldProcess() {
  $("iliToFeaSpiralTurns").disabled = $("iliToFeaPipeWeldType").value !== "spiral_dsaw";
}
function syncIliToFeaReliability() {
  const enabled = $("iliToFeaReliabilityEnabled").value === "on";
  document.querySelectorAll(".ili-reliability-field input").forEach((input) => {
    input.disabled = !enabled;
  });
}
$("iliToFeaSmys").addEventListener("input", syncIliToFeaWeldMismatch);
$("iliToFeaWeldYield").addEventListener("input", syncIliToFeaWeldMismatch);
$("iliToFeaPipeWeldType").addEventListener("change", syncIliToFeaWeldProcess);
$("iliToFeaReliabilityEnabled").addEventListener("change", syncIliToFeaReliability);
$("iliRankingTableBody").addEventListener("change", handleIliFeatureMethodChange);
$("iliFeatureFile").addEventListener("change", handleIliFeatureFile);
$("calculateAnnexKButton").addEventListener("click", calculateAnnexK);
$("calculateDentButton").addEventListener("click", calculateDent);
$("calculateB31gButton").addEventListener("click", calculateB31g);
$("calculateRstrengButton").addEventListener("click", calculateRstreng);
$("calculatePrciDentButton").addEventListener("click", calculatePrciDent);
$("calculateInteractionButton").addEventListener("click", calculateInteraction);
$("saveAssessmentButton").addEventListener("click", saveAssessment);
$("loadAssessmentButton").addEventListener("click", loadAssessment);
$("deleteAssessmentButton").addEventListener("click", deleteAssessment);
$("loginSubmitButton").addEventListener("click", loginUser);
$("expiredPasswordButton").addEventListener("click", submitExpiredPasswordChange);
$("loginPassword").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loginUser();
  }
});
$("logoutButton").addEventListener("click", logoutUser);
$("showPasswordPanelButton").addEventListener("click", showPasswordPanel);
$("hidePasswordPanelButton").addEventListener("click", hidePasswordPanel);
$("changePasswordButton").addEventListener("click", changeCurrentUserPassword);
$("adminSaveUserButton").addEventListener("click", saveAdminUser);
$("adminDeleteUserButton").addEventListener("click", deleteAdminUser);

syncGradeState();
applySoilProfile();
syncSoilLoadModel();
syncFatigueInputs();
applyMitigationPreset();
syncBendingStrainMode();
syncIliToFeaWeldMismatch();
syncIliToFeaWeldProcess();
syncIliToFeaReliability();
renderSchematic();
renderSccColonyVisualization(null);
renderRstrengProfileChart(null);
renderIliToFeaVisualization(null);
initializeAccessMode();
window.restorePipelineAssessmentSession = restoreActiveSession;
