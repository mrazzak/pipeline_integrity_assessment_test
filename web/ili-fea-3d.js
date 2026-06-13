import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let activeView = null;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function angularDifference(left, right) {
  return Math.atan2(Math.sin(left - right), Math.cos(left - right));
}

function disposeView() {
  if (!activeView) return;
  cancelAnimationFrame(activeView.frame);
  activeView.observer.disconnect();
  activeView.renderer.domElement.removeEventListener("wheel", activeView.pageScrollWheelHandler, true);
  activeView.controls.dispose();
  activeView.scene.traverse((object) => {
    object.geometry?.dispose?.();
    if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.());
    else object.material?.dispose?.();
  });
  activeView.renderer.dispose();
  activeView = null;
}

function featurePosition(feature, span, pipeLength, radius) {
  const x = -pipeLength / 2 + 0.65 + (feature.axial_location_mm / Math.max(span, 1)) * (pipeLength - 1.3);
  const angle = THREE.MathUtils.degToRad(90 - feature.clock_position_deg);
  return { x, angle, y: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
}

function visualFootprint(feature, maximumLength, maximumWidth) {
  return {
    axial: clamp(0.42 + (feature.length_mm / Math.max(maximumLength, 1)) * 0.9, 0.42, 1.32),
    angular: clamp(0.12 + (feature.width_mm / Math.max(maximumWidth, 1)) * 0.3, 0.12, 0.42),
  };
}

function pointCoordinates(feature, sample, context) {
  const base = featurePosition(feature, context.span, context.pipeLength, context.radius);
  const footprint = visualFootprint(feature, context.maximumLength, context.maximumWidth);
  const xFraction = sample.axial_offset_mm / Math.max(feature.length_mm / 2, 1);
  const thetaFraction = sample.circumferential_offset_mm / Math.max(feature.width_mm / 2, 1);
  return {
    x: base.x + clamp(xFraction, -1.4, 1.4) * footprint.axial / 2,
    angle: base.angle - clamp(thetaFraction, -1.4, 1.4) * footprint.angular / 2,
  };
}

function pointVector(feature, sample, context, radialOffset = 0) {
  const point = pointCoordinates(feature, sample, context);
  const radius = context.radius + radialOffset;
  return new THREE.Vector3(point.x, Math.cos(point.angle) * radius, Math.sin(point.angle) * radius);
}

function samplesByFeature(samples) {
  const groups = new Map();
  for (const sample of samples || []) {
    if (!groups.has(sample.feature_id)) groups.set(sample.feature_id, []);
    groups.get(sample.feature_id).push(sample);
  }
  return groups;
}

function visualizationSamples(features, rawMesh) {
  const mfl = [...(rawMesh.mfl_samples || [])];
  const crack = [...(rawMesh.crack_samples || [])];
  const caliper = [...(rawMesh.caliper_samples || [])];
  const mflIds = new Set(mfl.map((sample) => sample.feature_id));
  const crackIds = new Set(crack.map((sample) => sample.feature_id));
  const caliperIds = new Set(caliper.map((sample) => sample.feature_id));

  for (const feature of features) {
    if (feature.type === "metal_loss" && !mflIds.has(feature.id)) {
      mfl.push({ feature_id: feature.id, axial_offset_mm: 0, circumferential_offset_mm: 0, depth_percent: feature.depth_percent });
    }
    if (feature.type === "dent" && !caliperIds.has(feature.id)) {
      caliper.push({
        feature_id: feature.id,
        axial_offset_mm: 0,
        circumferential_offset_mm: 0,
        radial_deformation_mm: -feature.depth_mm,
      });
    }
    if (feature.type === "crack" && !crackIds.has(feature.id)) {
      const colony = feature.source_type === "scc";
      const paths = colony ? [-0.28, 0, 0.28] : [0];
      paths.forEach((circumferentialFraction, pathIndex) => {
        [-0.5, 0, 0.5].forEach((axialFraction) => {
          crack.push({
            feature_id: feature.id,
            axial_offset_mm: axialFraction * feature.length_mm,
            circumferential_offset_mm: circumferentialFraction * feature.width_mm,
            depth_mm: feature.depth_mm,
            opening_mm: Math.max(feature.depth_mm * 0.04, 0.08),
            crack_id: `${feature.id}-C${pathIndex + 1}`,
            anomaly_type: colony ? "scc" : "crack",
          });
        });
      });
    }
  }
  return { mfl, crack, caliper };
}

function crackPaths(features, crackSamples, context) {
  const featureMap = new Map(features.map((feature) => [feature.id, feature]));
  const paths = new Map();
  for (const sample of crackSamples) {
    const feature = featureMap.get(sample.feature_id);
    if (!feature) continue;
    const pathId = `${feature.id}:${sample.crack_id || "main"}`;
    if (!paths.has(pathId)) paths.set(pathId, { feature, samples: [] });
    paths.get(pathId).samples.push(sample);
  }
  return [...paths.values()].map(({ feature, samples }) => {
    const points = samples
      .sort((left, right) => left.axial_offset_mm - right.axial_offset_mm)
      .map((sample) => ({ ...pointCoordinates(feature, sample, context), opening_mm: sample.opening_mm || 0 }));
    if (points.length === 1) points.push({ ...points[0], x: points[0].x + 0.12 });
    return { feature, points };
  });
}

function distanceToCrack(x, angle, path) {
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 0; index < path.points.length - 1; index += 1) {
    const start = path.points[index];
    const end = path.points[index + 1];
    const vx = end.x - start.x;
    const va = angularDifference(end.angle, start.angle);
    const wx = x - start.x;
    const wa = angularDifference(angle, start.angle);
    const denominator = vx * vx + va * va || 1;
    const t = clamp((wx * vx + wa * va) / denominator, 0, 1);
    const dx = x - (start.x + t * vx);
    const da = angularDifference(angle, start.angle + t * va);
    minimum = Math.min(minimum, Math.sqrt(dx * dx + da * da));
  }
  return minimum;
}

function surfaceState(x, angle, features, sampleGroups, context) {
  let radialChange = 0;
  let metalLossSeverity = 0;
  let dentSeverity = 0;
  let weldSeverity = 0;
  const spiralAnchor = features.find((feature) => feature.weld_type === "spiral_seam");
  for (const feature of features) {
    if (
      feature.weld_type &&
      feature.weld_type !== "none" &&
      (feature.weld_type !== "spiral_seam" || feature === spiralAnchor)
    ) {
      const center = featurePosition(feature, context.span, context.pipeLength, context.radius);
      const weldHalfWidth = clamp((context.weldCapWidth / Math.max(context.wallThickness, 1)) * 0.035, 0.035, 0.11);
      let weldDistance = Number.POSITIVE_INFINITY;
      if (feature.weld_type === "girth_weld") {
        const weldX = center.x - (feature.weld_offset_mm / Math.max(feature.length_mm, 1)) * visualFootprint(feature, context.maximumLength, context.maximumWidth).axial;
        weldDistance = Math.abs(x - weldX);
      } else if (feature.weld_type === "longitudinal_seam") {
        const weldAngle = center.angle + feature.weld_offset_mm / Math.max(context.radius * 100, 1);
        weldDistance = Math.abs(angularDifference(angle, weldAngle));
      } else {
        const phase =
          center.angle +
          ((x - center.x) / context.pipeLength) * Math.PI * 2 * Number(feature.spiral_turns || context.spiralTurns || 1.5);
        weldDistance = Math.abs(angularDifference(angle, phase));
      }
      const influence = Math.exp(-2.4 * (weldDistance / weldHalfWidth) ** 2);
      if (!["erw", "legacy_flush"].includes(feature.manufacturing_family)) {
        radialChange += influence * 0.025;
      }
      weldSeverity = Math.max(weldSeverity, influence);
    }
    const footprint = visualFootprint(feature, context.maximumLength, context.maximumWidth);
    for (const sample of sampleGroups.mfl.get(feature.id) || []) {
      const target = pointCoordinates(feature, sample, context);
      const dx = (x - target.x) / Math.max(footprint.axial * 0.42, 0.12);
      const da = angularDifference(angle, target.angle) / Math.max(footprint.angular * 0.42, 0.05);
      const weight = Math.exp(-1.7 * (dx * dx + da * da));
      const severity = clamp(sample.depth_percent / 100, 0, 0.99) * weight;
      radialChange -= severity * 0.42;
      metalLossSeverity = Math.max(metalLossSeverity, severity);
    }
    for (const sample of sampleGroups.caliper.get(feature.id) || []) {
      const target = pointCoordinates(feature, sample, context);
      const dx = (x - target.x) / Math.max(footprint.axial * 0.48, 0.14);
      const da = angularDifference(angle, target.angle) / Math.max(footprint.angular * 0.48, 0.06);
      const weight = Math.exp(-1.45 * (dx * dx + da * da));
      const normalizedDeformation = sample.radial_deformation_mm / Math.max(context.wallThickness, 1);
      radialChange += clamp(normalizedDeformation, -1.5, 1.5) * 0.34 * weight;
      dentSeverity = Math.max(dentSeverity, Math.abs(normalizedDeformation) * weight);
    }
  }
  return { radialChange, metalLossSeverity, dentSeverity, weldSeverity };
}

function createDefectShell(features, rawMesh, context, refinement) {
  const samples = visualizationSamples(features, rawMesh);
  const groups = {
    mfl: samplesByFeature(samples.mfl),
    caliper: samplesByFeature(samples.caliper),
  };
  const intact = new THREE.Color(0x5f8498);
  const metalLoss = new THREE.Color(0xd97706);
  const dent = new THREE.Color(0x7048a8);
  const weld = new THREE.Color(0x16a34a);
  const paths = crackPaths(features, samples.crack, context);
  const baseAxial = refinement === "fine" ? 64 : refinement === "coarse" ? 32 : 48;
  const baseAngular = refinement === "fine" ? 40 : refinement === "coarse" ? 20 : 30;
  const localSubdivisions = refinement === "fine" ? 5 : refinement === "coarse" ? 3 : 4;
  const transitionSubdivisions = refinement === "fine" ? 3 : 2;
  const positions = [];
  const normals = [];
  const colors = [];
  let removedTriangles = 0;
  let remoteTriangles = 0;
  let localTriangles = 0;

  const vertex = (x, angle) => {
    const state = surfaceState(x, angle, features, groups, context);
    const radius = context.radius + state.radialChange;
    const color = intact.clone();
    if (state.metalLossSeverity > 0.02) color.lerp(metalLoss, clamp(state.metalLossSeverity * 1.5, 0, 1));
    if (state.dentSeverity > 0.02) color.lerp(dent, clamp(state.dentSeverity, 0, 0.9));
    if (state.weldSeverity > 0.02) color.lerp(weld, clamp(state.weldSeverity * 0.7, 0, 0.72));
    return {
      position: [x, Math.cos(angle) * radius, Math.sin(angle) * radius],
      normal: [0, Math.cos(angle), Math.sin(angle)],
      color: [color.r, color.g, color.b],
    };
  };

  const addTriangle = (a, b, c, subdivision) => {
    const centroidX = (a.position[0] + b.position[0] + c.position[0]) / 3;
    const centroidAngle = Math.atan2(
      (a.position[2] + b.position[2] + c.position[2]) / 3,
      (a.position[1] + b.position[1] + c.position[1]) / 3,
    );
    const crackTolerance = refinement === "fine" ? 0.038 : refinement === "coarse" ? 0.064 : 0.048;
    if (paths.some((path) => distanceToCrack(centroidX, centroidAngle, path) < crackTolerance)) {
      removedTriangles += 1;
      return;
    }
    for (const point of [a, b, c]) {
      positions.push(...point.position);
      normals.push(...point.normal);
      colors.push(...point.color);
    }
    if (subdivision > 1) localTriangles += 1;
    else remoteTriangles += 1;
  };

  for (let axialIndex = 0; axialIndex < baseAxial; axialIndex += 1) {
    const x0 = -context.pipeLength / 2 + (context.pipeLength * axialIndex) / baseAxial;
    const x1 = -context.pipeLength / 2 + (context.pipeLength * (axialIndex + 1)) / baseAxial;
    for (let angularIndex = 0; angularIndex < baseAngular; angularIndex += 1) {
      const a0 = (Math.PI * 2 * angularIndex) / baseAngular;
      const a1 = (Math.PI * 2 * (angularIndex + 1)) / baseAngular;
      const centerX = (x0 + x1) / 2;
      const centerAngle = (a0 + a1) / 2;
      let proximity = Number.POSITIVE_INFINITY;
      for (const feature of features) {
        const center = featurePosition(feature, context.span, context.pipeLength, context.radius);
        const footprint = visualFootprint(feature, context.maximumLength, context.maximumWidth);
        const dx = Math.abs(centerX - center.x) / Math.max(footprint.axial, 0.25);
        const da = Math.abs(angularDifference(centerAngle, center.angle)) / Math.max(footprint.angular, 0.08);
        proximity = Math.min(proximity, Math.sqrt(dx * dx + da * da));
      }
      const subdivision = proximity <= 1.0 ? localSubdivisions : proximity <= 1.8 ? transitionSubdivisions : 1;
      for (let localX = 0; localX < subdivision; localX += 1) {
        const sx0 = x0 + ((x1 - x0) * localX) / subdivision;
        const sx1 = x0 + ((x1 - x0) * (localX + 1)) / subdivision;
        for (let localA = 0; localA < subdivision; localA += 1) {
          const sa0 = a0 + ((a1 - a0) * localA) / subdivision;
          const sa1 = a0 + ((a1 - a0) * (localA + 1)) / subdivision;
          const v00 = vertex(sx0, sa0);
          const v10 = vertex(sx1, sa0);
          const v11 = vertex(sx1, sa1);
          const v01 = vertex(sx0, sa1);
          addTriangle(v00, v11, v10, subdivision);
          addTriangle(v00, v01, v11, subdivision);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return { geometry, paths, removedTriangles, samples, remoteTriangles, localTriangles };
}

function addCrackLips(scene, paths, context) {
  const material = new THREE.LineBasicMaterial({ color: 0x7f1d1d, linewidth: 2 });
  for (const path of paths) {
    const points = path.points.map((point) => {
      const radius = context.radius + 0.018;
      return new THREE.Vector3(point.x, Math.cos(point.angle) * radius, Math.sin(point.angle) * radius);
    });
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material.clone()));
  }
}

function addInnerWall(scene, context) {
  const innerRadius = context.radius - 0.16;
  const geometry = new THREE.CylinderGeometry(innerRadius, innerRadius, context.pipeLength, 72, 2, true);
  geometry.rotateZ(Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({
    color: 0x263d49,
    roughness: 0.82,
    side: THREE.BackSide,
  });
  scene.add(new THREE.Mesh(geometry, material));
}

function addWeldGeometry(scene, features, samples, context) {
  const sampleGroups = {
    mfl: samplesByFeature(samples.mfl),
    caliper: samplesByFeature(samples.caliper),
  };
  const weldMaterial = new THREE.MeshStandardMaterial({ color: 0x16a34a, metalness: 0.08, roughness: 0.58 });
  const hazMaterial = new THREE.MeshStandardMaterial({
    color: 0x86efac,
    transparent: true,
    opacity: 0.38,
    roughness: 0.78,
  });
  const erwSeamMaterial = new THREE.LineBasicMaterial({ color: 0x15803d });
  const erwHazMaterial = new THREE.LineBasicMaterial({ color: 0x86efac, transparent: true, opacity: 0.72 });
  const surfacePoint = (x, angle, lift = 0) => {
    const state = surfaceState(x, angle, features, sampleGroups, context);
    const radius = context.radius + state.radialChange + lift;
    return new THREE.Vector3(x, Math.cos(angle) * radius, Math.sin(angle) * radius);
  };
  const seen = new Set();
  for (const feature of features) {
    if (!feature.weld_type || feature.weld_type === "none") continue;
    const center = featurePosition(feature, context.span, context.pipeLength, context.radius);
    const footprint = visualFootprint(feature, context.maximumLength, context.maximumWidth);
    const key =
      feature.weld_type === "spiral_seam"
        ? `spiral_seam:${feature.manufacturing_process}`
        : `${feature.weld_type}:${Math.round(center.x * 20)}:${Math.round(center.angle * 20)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const processScale = feature.manufacturing_family === "dsaw" ? 1.18 : 1;
    const capRadius = clamp((0.035 + context.weldCapWidth / 500) * processScale, 0.035, 0.1);
    const hazOffset = capRadius + clamp(context.hazWidth / 350, 0.025, 0.07);

    if (feature.weld_type === "girth_weld") {
      const weldX = center.x - (feature.weld_offset_mm / Math.max(feature.length_mm, 1)) * footprint.axial;
      const beadPoints = [];
      const hazLeft = [];
      const hazRight = [];
      for (let index = 0; index < 128; index += 1) {
        const angle = (Math.PI * 2 * index) / 128;
        beadPoints.push(surfacePoint(weldX, angle, 0.015));
        hazLeft.push(surfacePoint(weldX - hazOffset, angle, 0.008));
        hazRight.push(surfacePoint(weldX + hazOffset, angle, 0.008));
      }
      const bead = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(beadPoints, true), 160, capRadius, 8, true),
        weldMaterial.clone(),
      );
      bead.castShadow = true;
      scene.add(bead);
      for (const points of [hazLeft, hazRight]) {
        scene.add(
          new THREE.Mesh(
            new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 160, capRadius * 0.34, 6, true),
            hazMaterial.clone(),
          ),
        );
      }
      continue;
    }

    const weldAngle = center.angle + feature.weld_offset_mm / Math.max(context.radius * 100, 1);
    const pathPoints = [];
    const hazLeft = [];
    const hazRight = [];
    for (let index = 0; index <= 64; index += 1) {
      const x = -context.pipeLength / 2 + (context.pipeLength * index) / 64;
      const phase =
        feature.weld_type === "spiral_seam"
          ? weldAngle +
            ((x + context.pipeLength / 2) / context.pipeLength) *
              Math.PI *
              2 *
              Number(feature.spiral_turns || context.spiralTurns || 1.5)
          : weldAngle;
      const isFlushSeam = ["erw", "legacy_flush"].includes(feature.manufacturing_family);
      pathPoints.push(surfacePoint(x, phase, isFlushSeam ? 0.002 : 0.018));
      hazLeft.push(surfacePoint(x, phase - hazOffset, isFlushSeam ? 0.001 : 0.01));
      hazRight.push(surfacePoint(x, phase + hazOffset, isFlushSeam ? 0.001 : 0.01));
    }
    if (["erw", "legacy_flush"].includes(feature.manufacturing_family)) {
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pathPoints), erwSeamMaterial.clone()));
      for (const points of [hazLeft, hazRight]) {
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), erwHazMaterial.clone()));
      }
      continue;
    }
    const bead = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pathPoints), 96, capRadius, 8, false),
      weldMaterial.clone(),
    );
    bead.castShadow = true;
    scene.add(bead);
    for (const points of [hazLeft, hazRight]) {
      scene.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 96, capRadius * 0.38, 6, false),
          hazMaterial.clone(),
        ),
      );
    }
  }
}

function setDefaultCamera(camera, aspect) {
  if (aspect < 1.05) camera.position.set(6.6, 9.1, 29.5);
  else camera.position.set(3.8, 5.1, 14.2);
}

window.renderIliFea3D = function renderIliFea3D(result) {
  const container = document.getElementById("iliToFea3dVisualization");
  if (!container || !result?.translated_features?.length) return;
  disposeView();
  container.replaceChildren();

  const features = result.translated_features;
  const rawMesh = result.raw_mesh || {};
  const context = {
    span: Math.max(...features.map((feature) => feature.axial_location_mm), 1),
    pipeLength: 11,
    radius: 2.25,
    wallThickness: Number(result.inputs?.wall_thickness_mm || 9.5),
    maximumLength: Math.max(...features.map((feature) => feature.length_mm), 1),
    maximumWidth: Math.max(...features.map((feature) => feature.width_mm), 1),
    weldCapWidth: Number(result.inputs?.weld_cap_width_mm || 12),
    hazWidth: Number(result.inputs?.haz_width_mm || 6),
    manufacturingProcess: String(result.inputs?.manufacturing_process || "erw"),
    spiralTurns: Number(result.inputs?.spiral_turns || 1.5),
  };
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe4eef3);
  scene.fog = new THREE.Fog(0xe4eef3, 24, 42);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  setDefaultCamera(camera, 1);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const pageScrollWheelHandler = (event) => {
    if (!event.ctrlKey && !event.metaKey) event.stopImmediatePropagation();
  };
  renderer.domElement.addEventListener("wheel", pageScrollWheelHandler, { capture: true, passive: true });

  const controls = new OrbitControls(camera, renderer.domElement);
  renderer.domElement.style.touchAction = "pan-y";
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 7;
  controls.maxDistance = 42;
  controls.target.set(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x294b5c, 1.15));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
  keyLight.position.set(3, 8, 9);
  keyLight.castShadow = true;
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.8);
  rimLight.position.set(-7, -4, 6);
  scene.add(rimLight);

  const defectShell = createDefectShell(
    features,
    rawMesh,
    context,
    result.inputs?.mesh_refinement || "standard",
  );
  const pipeMaterial = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    metalness: 0.1,
    roughness: 0.7,
    clearcoat: 0.15,
    side: THREE.DoubleSide,
  });
  const pipeMesh = new THREE.Mesh(defectShell.geometry, pipeMaterial);
  pipeMesh.castShadow = true;
  pipeMesh.receiveShadow = true;
  scene.add(pipeMesh);
  scene.add(
    new THREE.LineSegments(
      new THREE.WireframeGeometry(defectShell.geometry),
      new THREE.LineBasicMaterial({ color: 0x315b70, transparent: true, opacity: 0.34 }),
    ),
  );
  addInnerWall(scene, context);
  addWeldGeometry(scene, features, defectShell.samples, context);
  addCrackLips(scene, defectShell.paths, context);

  const endMaterial = new THREE.MeshStandardMaterial({ color: 0x526f80, roughness: 0.62 });
  for (const x of [-context.pipeLength / 2, context.pipeLength / 2]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(context.radius, 0.045, 10, 72), endMaterial);
    ring.rotation.y = Math.PI / 2;
    ring.position.x = x;
    scene.add(ring);
  }

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 18),
    new THREE.ShadowMaterial({ color: 0x163a5b, opacity: 0.12 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -3.3;
  ground.receiveShadow = true;
  scene.add(ground);

  let hasSized = false;
  function resize() {
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 360);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    if (!hasSized) {
      setDefaultCamera(camera, camera.aspect);
      controls.update();
      hasSized = true;
    }
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  function animate() {
    controls.update();
    renderer.render(scene, camera);
    activeView.frame = requestAnimationFrame(animate);
  }
  activeView = { camera, controls, frame: 0, observer, pageScrollWheelHandler, renderer, scene };
  animate();
};

window.resetIliFea3D = function resetIliFea3D() {
  if (!activeView) return;
  const canvas = activeView.renderer.domElement;
  setDefaultCamera(activeView.camera, canvas.clientWidth / Math.max(canvas.clientHeight, 1));
  activeView.controls.target.set(0, 0, 0);
  activeView.controls.update();
};

document.getElementById("iliToFeaReset3dButton")?.addEventListener("click", () => window.resetIliFea3D());
