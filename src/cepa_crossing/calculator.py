from __future__ import annotations

import math
from typing import Any

from .models import CrossingCase, PointLoad


def validate_case(case: CrossingCase) -> None:
    pipe = case.pipe
    soil = case.soil
    scan = case.scan
    vehicle = case.vehicle

    positive_values = {
        "outside_diameter_in": pipe.outside_diameter_in,
        "wall_thickness_in": pipe.wall_thickness_in,
        "smys_psi": pipe.smys_psi,
        "youngs_modulus_psi": pipe.youngs_modulus_psi,
        "cover_in": soil.cover_in,
        "unit_weight_pcf": soil.unit_weight_pcf,
        "modulus_reaction_psi": soil.modulus_reaction_psi,
        "kb": soil.kb,
        "kz": soil.kz,
        "impact_factor": vehicle.impact_factor,
        "step_in": scan.step_in,
    }
    for name, value in positive_values.items():
        if value <= 0:
            raise ValueError(f"{name} must be greater than zero")
    if pipe.mop_psig < 0:
        raise ValueError("mop_psig cannot be negative")
    if scan.stop_in < scan.start_in:
        raise ValueError("scan.stop_in must be greater than or equal to scan.start_in")
    if not vehicle.loads:
        raise ValueError("vehicle.loads must include at least one point load")
    for load in vehicle.loads:
        if load.load_lb <= 0:
            raise ValueError(f"load {load.name!r} must be greater than zero")
    if soil.load_model not in {"prism", "trap_door"}:
        raise ValueError("soil.load_model must be 'prism' or 'trap_door'")
    if soil.load_model == "trap_door" and not (0 < soil.friction_angle_deg < 90):
        raise ValueError("soil.friction_angle_deg must be between 0 and 90 for trap door soil load")


def boussinesq_pressure_psi(point_load_lb: float, cover_in: float, offset_in: float) -> float:
    ratio = offset_in / cover_in
    return (3.0 * point_load_lb) / (2.0 * math.pi * cover_in**2 * (1.0 + ratio**2) ** 2.5)


def prism_soil_pressure_psi(unit_weight_pcf: float, cover_in: float) -> float:
    unit_weight_pci = unit_weight_pcf / 1728.0
    return unit_weight_pci * cover_in


def trap_door_soil_pressure_psi(unit_weight_pcf: float, cover_in: float, pipe_diameter_in: float, friction_angle_deg: float) -> float:
    unit_weight_pci = unit_weight_pcf / 1728.0
    phi = math.radians(friction_angle_deg)
    active_earth_coefficient = math.tan(math.radians(45.0) - phi / 2.0) ** 2
    denominator = 2.0 * active_earth_coefficient * math.tan(phi)
    if denominator <= 1e-9:
        return prism_soil_pressure_psi(unit_weight_pcf, cover_in)
    arching_length = pipe_diameter_in / denominator
    reduction = 1.0 - math.exp(-cover_in / arching_length)
    return unit_weight_pci * arching_length * reduction


def soil_pressure_psi(case: CrossingCase) -> float:
    if case.soil.load_model == "trap_door":
        return trap_door_soil_pressure_psi(
            case.soil.unit_weight_pcf,
            case.soil.cover_in,
            case.pipe.outside_diameter_in,
            case.soil.friction_angle_deg,
        )
    return prism_soil_pressure_psi(case.soil.unit_weight_pcf, case.soil.cover_in)


def cepa_hoop_bending_stress_psi(
    load_pressure_psi: float,
    outside_diameter_in: float,
    wall_thickness_in: float,
    kb: float,
    kz: float,
    internal_pressure_psig: float,
    youngs_modulus_psi: float,
    modulus_reaction_psi: float,
) -> float:
    diameter_to_thickness = outside_diameter_in / wall_thickness_in
    denominator = (
        1.0
        + 3.0 * kz * (internal_pressure_psig / youngs_modulus_psi) * diameter_to_thickness**3
        + 0.0915 * (modulus_reaction_psi / youngs_modulus_psi) * diameter_to_thickness**3
    )
    numerator = 3.0 * kb * load_pressure_psi * diameter_to_thickness**2
    return numerator / denominator


def internal_hoop_stress_psi(internal_pressure_psig: float, outside_diameter_in: float, wall_thickness_in: float) -> float:
    return internal_pressure_psig * outside_diameter_in / (2.0 * wall_thickness_in)


def load_offset_from_pipe_centerline(load: PointLoad, vehicle_position_in: float, crossing_angle_deg: float) -> float:
    theta = math.radians(crossing_angle_deg)
    # The pipeline centerline is the global x-axis; offset is the global y-coordinate.
    return (vehicle_position_in + load.x_in) * math.sin(theta) + load.y_in * math.cos(theta)


def live_pressure_at_position_psi(case: CrossingCase, vehicle_position_in: float) -> float:
    total = 0.0
    for load in case.vehicle.loads:
        offset = load_offset_from_pipe_centerline(load, vehicle_position_in, case.vehicle.crossing_angle_deg)
        total += boussinesq_pressure_psi(load.load_lb * case.vehicle.impact_factor, case.soil.cover_in, offset)
    return total


def scan_max_live_pressure(case: CrossingCase) -> dict[str, float]:
    max_pressure = -math.inf
    max_position = case.scan.start_in
    position = case.scan.start_in

    while position <= case.scan.stop_in + case.scan.step_in * 1e-9:
        pressure = live_pressure_at_position_psi(case, position)
        if pressure > max_pressure:
            max_pressure = pressure
            max_position = position
        position += case.scan.step_in

    return {"vehicle_position_in": max_position, "live_pressure_psi": max_pressure}


def hoop_stresses_at_pressure(case: CrossingCase, internal_pressure_psig: float, live_pressure_psi: float) -> dict[str, float]:
    pipe = case.pipe
    soil = case.soil
    soil_pressure = soil_pressure_psi(case)
    live_hoop = cepa_hoop_bending_stress_psi(
        live_pressure_psi,
        pipe.outside_diameter_in,
        pipe.wall_thickness_in,
        soil.kb,
        soil.kz,
        internal_pressure_psig,
        pipe.youngs_modulus_psi,
        soil.modulus_reaction_psi,
    )
    soil_hoop = cepa_hoop_bending_stress_psi(
        soil_pressure,
        pipe.outside_diameter_in,
        pipe.wall_thickness_in,
        soil.kb,
        soil.kz,
        internal_pressure_psig,
        pipe.youngs_modulus_psi,
        soil.modulus_reaction_psi,
    )
    pressure_hoop = internal_hoop_stress_psi(internal_pressure_psig, pipe.outside_diameter_in, pipe.wall_thickness_in)
    total = live_hoop + soil_hoop + pressure_hoop
    return {
        "internal_pressure_psig": internal_pressure_psig,
        "live_pressure_psi": live_pressure_psi,
        "soil_pressure_psi": soil_pressure,
        "live_hoop_bending_psi": live_hoop,
        "soil_hoop_bending_psi": soil_hoop,
        "pressure_hoop_psi": pressure_hoop,
        "total_hoop_stress_psi": total,
        "total_hoop_percent_smys": 100.0 * total / pipe.smys_psi,
    }


def calculate_case(case: CrossingCase) -> dict[str, Any]:
    validate_case(case)
    critical = scan_max_live_pressure(case)
    live_pressure = critical["live_pressure_psi"]
    return {
        "critical_position": critical,
        "zero_pressure": hoop_stresses_at_pressure(case, 0.0, live_pressure),
        "mop": hoop_stresses_at_pressure(case, case.pipe.mop_psig, live_pressure),
    }
