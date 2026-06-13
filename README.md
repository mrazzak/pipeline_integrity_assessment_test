# CEPA Crossing Hoop Stress Calculator

Small Python project for estimating total circumferential, or hoop, stress for a buried pipeline during a vehicle crossing using the CEPA surface loading methodology.

The calculator focuses on the hoop-stress portion of the CEPA workflow:

1. Represent a tire, track, or custom footprint as point loads.
2. Move the vehicle across the pipeline and use Boussinesq's equation to calculate pressure at pipe depth.
3. Calculate CEPA circumferential bending stress from live load and soil prism load.
4. Add pressure hoop stress to report total hoop stress at zero pressure and at MOP.

This is an engineering calculation aid, not a certified replacement for CEPA/Kiefner software or a professional engineering review.

## Install

```powershell
python -m pip install -e .
```

## Run The Example

```powershell
python -m cepa_crossing examples/sample_case.json
```

or, after editable install:

```powershell
cepa-crossing examples/sample_case.json
```

## GUI

Double-click [start_gui.bat](start_gui.bat), then use the browser page at `http://127.0.0.1:8765/`. The Calculate button sends the current inputs to the Python CEPA calculator and displays the returned stresses without requiring PowerShell commands.

For a local version that opens directly without a login screen, double-click
[start_gui_no_login.bat](start_gui_no_login.bat) and use
`http://127.0.0.1:8766/`. This mode runs as the local user and is intended for
use on a trusted computer. The standard `start_gui.bat` launcher remains
login-protected.

## Deploy To Render

The included [render.yaml](render.yaml) creates a no-login Render web service.
Push this project to GitHub, GitLab, or Bitbucket, then in Render choose
**New > Blueprint** and select the repository. Render will install the Python
dependencies, bind the application to its assigned port, and check
`/api/health` before routing traffic.

The free configuration uses ephemeral storage. Generated server-side reports
and runtime data can be cleared when the service restarts or redeploys. Saved
calculations remain browser-local. For persistent server-side files, upgrade
the service and attach a Render disk, then point
`PIPELINE_ASSESSMENT_DATA_DIR` to the disk mount path.

The GUI has four sections:

- Pipeline information: OD, wall thickness, MAOP, grade/SMYS, and Young's modulus
- Vehicle information: axle count, per-axle load boxes under a tyre/track schematic, contact area, tyre pressure, axle width, axle spacing, calculated vehicle weight, crossing angle, impact factor, and wheel/track type
- Soil data: cover, unit weight, soil reaction modulus, Kb, Kz, and scan increment
- Outputs: live load pressure, live/soil/pressure hoop components, total hoop stress at MAOP, zero-pressure total, and percent SMYS

## Input Shape

All values are imperial units.

```json
{
  "pipe": {
    "outside_diameter_in": 24.0,
    "wall_thickness_in": 0.375,
    "mop_psig": 720.0,
    "smys_psi": 52000.0,
    "youngs_modulus_psi": 30000000.0
  },
  "soil": {
    "cover_in": 48.0,
    "unit_weight_pcf": 120.0,
    "modulus_reaction_psi": 1000.0,
    "kb": 0.10,
    "kz": 0.061
  },
  "vehicle": {
    "crossing_angle_deg": 90.0,
    "impact_factor": 1.15,
    "loads": [
      { "name": "front-left", "x_in": -60.0, "y_in": -36.0, "load_lb": 9000.0 },
      { "name": "front-right", "x_in": -60.0, "y_in": 36.0, "load_lb": 9000.0 }
    ]
  },
  "scan": {
    "start_in": -180.0,
    "stop_in": 180.0,
    "step_in": 3.0
  }
}
```

Vehicle load coordinates are in the vehicle coordinate system. `x_in` is along travel, `y_in` is across the vehicle. `crossing_angle_deg` is measured from the pipeline centerline to vehicle travel direction, so `90` means a perpendicular crossing.

## Method Notes

Implemented equations:

- Boussinesq pressure from a surface point load:
  `P_live = 3F / (2*pi*H^2*(1 + (d/H)^2)^2.5)`
- Prism soil pressure:
  `P_soil = rho * H`
- CEPA hoop bending stress:
  `sigma_H = 3*Kb*P*(D/t)^2 / (1 + 3*Kz*(P_internal/E)*(D/t)^3 + 0.0915*(E_soil/E)*(D/t)^3)`
- Internal pressure hoop stress:
  `sigma_H_internal = P_internal*D/(2*t)`
- Total hoop stress:
  `sigma_H_total = sigma_H_live + sigma_H_soil + sigma_H_internal`

## Sources

- CEPA Surface Loading Calculator User Manual, equations and input descriptions: https://studylib.net/doc/6622165/-cepa--surface-loading-calculator-user-manual
- Technical Toolboxes CEPA wheel load analysis summary: https://ttwiki.azurewebsites.net/wiki/pipeline-hub-user-resources/pipeline-toolbox-user-guides/pipeline-crossing-gas-services/cepa-wheel-load-analysis/
- PRCI validation context for CEPA hoop stress model: https://www.prci.org/Research/KeyResults/76587.aspx

## Test

```powershell
$env:PYTHONPATH = "src"
python -m unittest discover -s tests
```

GUI smoke test with Node.js:

```powershell
node tests/gui_smoke.mjs
```
