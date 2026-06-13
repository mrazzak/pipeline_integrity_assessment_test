# Pipeline Crossing Assessment Calculation Methodology

This document describes the calculation workflow used by the Pipeline Crossing Assessment application. The tool is intended as an engineering screening calculator for vehicle crossings over buried pipelines using CEPA-style surface loading methodology with additional CSA Z662 class-location limit checks, bending strain inclusion, and fatigue screening.

## 1. Pipeline Inputs

The pipeline input module collects:

- Outside diameter, `D`
- Wall thickness, `t`
- MAOP
- Steel grade or custom SMYS
- Young's modulus, `E`
- CSA Z662 class location
- Design factor, `F`

The internal pressure hoop stress is calculated with the thin-wall Barlow relationship:

```text
S_h = P D / (2 t)
```

where:

- `S_h` is hoop stress from internal pressure, psi
- `P` is internal pressure, psig
- `D` is outside diameter, in
- `t` is wall thickness, in

## 2. CSA Z662 Class-Location Assessment Limit

The pass/fail stress limit is based on the selected design factor and class-location factor:

```text
Stress limit = SMYS x F x class location factor
```

The tool uses the following class-location factors:

```text
Class 1 = 1.00
Class 2 = 0.90
Class 3 = 0.70
Class 4 = 0.55
```

The assessment passes when:

```text
Assessment stress <= Stress limit
```

## 3. Vehicle Surface Loading

Wheel vehicles are represented as paired point loads at each axle. The user can enter different loads for each axle. Each axle load is split equally between the left and right wheel paths.

Tracked vehicles are represented as paired point loads for the left and right tracks. Track pressure is not required as an input. Track width and track length are retained for reporting and contact/load description.

The load positions are scanned across the pipeline to find the critical position producing the maximum live-load pressure at pipe depth.

## 4. Live Load Pressure at Pipe Depth

The live-load pressure contribution at pipe depth is calculated using a Boussinesq point-load distribution:

```text
p = 3 Q / [2 pi z^2 (1 + (r/z)^2)^2.5]
```

where:

- `p` is pressure at pipe depth, psi
- `Q` is point load including impact factor, lb
- `z` is depth of cover, in
- `r` is horizontal offset from the load to the pipe centerline, in

The total live pressure is the sum of all point-load contributions at the scanned vehicle position.

## 5. Soil Load Model

The soil module supports two load models:

- Prism load
- Trap door

### Prism Load

The prism load model calculates vertical soil pressure as:

```text
p_s = gamma H
```

where:

- `gamma` is soil unit weight, converted from pcf to pci
- `H` is depth of cover, in

### Trap Door Load

The trap-door model applies an arching reduction using soil friction angle. The implementation uses an active-earth-pressure coefficient and exponential arching reduction to reduce the prism soil pressure where soil bridging is considered.

This model is less conservative than prism loading and should be used only when project conditions justify the assumption.

## 6. CEPA Hoop Bending Stress

Live-load and soil-load pressures are converted to hoop bending stress using the CEPA-style hoop bending relationship:

```text
S_b = [3 Kb p (D/t)^2] /
      [1 + 3 Kz (P/E) (D/t)^3 + 0.0915 (E' / E) (D/t)^3]
```

where:

- `S_b` is hoop bending stress, psi
- `Kb` is bedding factor
- `Kz` is pressure stiffening factor
- `p` is vertical pressure at pipe, psi
- `D/t` is diameter-to-thickness ratio
- `P` is internal pressure, psig
- `E` is pipe Young's modulus, psi
- `E'` is modulus of soil reaction, psi

The application calculates:

- Live-load hoop bending stress
- Soil-load hoop bending stress
- Pressure hoop stress

The hoop stress subtotal is:

```text
Subtotal = live-load hoop + soil hoop + pressure hoop
```

## 7. Pre-existing Bending Strain Component

The bending strain module allows direct entry of existing bending strain in microstrain or calculation from deflection and pipe length.

For deflection mode, curvature is approximated as:

```text
kappa = 8 delta / L^2
```

The outside-fiber strain is:

```text
epsilon = (D / 2) kappa
```

The displayed strain is converted to microstrain:

```text
microstrain = epsilon x 1,000,000
```

The strain stress added to the assessment is:

```text
S_strain = E x microstrain / 1,000,000
```

The final assessment stress is:

```text
Assessment stress = hoop stress subtotal + pre-existing bending strain stress
```

## 8. Cyclic Loading Fatigue Screening

The fatigue module is a screening calculation based on an S-N style relationship:

```text
N_allow = C / (Delta S)^m
```

where:

- `N_allow` is allowable cycles
- `C` is user-entered fatigue constant
- `Delta S` is stress range, psi
- `m` is S-N exponent

The stress range can be:

- Calculated live-load hoop stress range
- User-entered manual stress range

The fatigue damage ratio is:

```text
Damage ratio = applied cycles / allowable cycles
```

Fatigue passes when:

```text
Damage ratio <= 1.0
```

## 9. Reporting

The PDF report includes:

- Assessment name and generated date
- PASS/FAIL assessment result
- All pipeline, vehicle, soil, bending strain, and fatigue inputs
- Calculated hoop stress outputs
- Fatigue status and damage ratio
- Derived vehicle load model values

The report is generated locally in the browser as a PDF file.

## 10. Surface Loading Mitigation Plan

The mitigation module provides a screening estimate for load-spreading systems such as steel plate, rig mats, wooden bridge, hollow concrete slab, and custom mitigation.

The tool calculates a load reduction factor by comparing the original contact area with an effective mitigation distribution area:

```text
effective width = mitigation width + 2 x thickness x tan(spread angle)
effective length = mitigation length + 2 x thickness x tan(spread angle)
effective area = effective width x effective length
load factor = original contact area / effective area
```

The factor is limited between 0.05 and 1.0 for screening stability.

```text
mitigated live hoop = original live hoop x load factor
mitigated assessment = original assessment - original live hoop + mitigated live hoop
```

This lets the report show both the original crossing assessment and the post-mitigation assessment.

## 11. User Login And Admin Method Settings

The local application uses backend JSON files to store users and calculation-method configuration:

```text
data/users.json
data/calculation_method.json
```

Default accounts are:

```text
admin / admin
user / password
```

The admin interface can update user names, passwords, roles, calculation method name, fatigue constants, fatigue exponent, and calculation notes.

Saved assessments are stored separately by logged-in user so one user's saved calculations do not appear in another user's saved assessment list.
