from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Pipe:
    outside_diameter_in: float
    wall_thickness_in: float
    mop_psig: float
    smys_psi: float
    youngs_modulus_psi: float = 30_000_000.0


@dataclass(frozen=True)
class Soil:
    cover_in: float
    unit_weight_pcf: float
    modulus_reaction_psi: float
    kb: float
    kz: float
    load_model: str = "prism"
    friction_angle_deg: float = 30.0


@dataclass(frozen=True)
class PointLoad:
    name: str
    x_in: float
    y_in: float
    load_lb: float


@dataclass(frozen=True)
class Vehicle:
    crossing_angle_deg: float
    impact_factor: float
    loads: tuple[PointLoad, ...]


@dataclass(frozen=True)
class Scan:
    start_in: float
    stop_in: float
    step_in: float


@dataclass(frozen=True)
class CrossingCase:
    pipe: Pipe
    soil: Soil
    vehicle: Vehicle
    scan: Scan


def case_from_dict(data: dict) -> CrossingCase:
    pipe = Pipe(**data["pipe"])
    soil = Soil(**data["soil"])
    vehicle_data = data["vehicle"].copy()
    vehicle_data["loads"] = tuple(PointLoad(**load) for load in vehicle_data["loads"])
    vehicle = Vehicle(**vehicle_data)
    scan = Scan(**data.get("scan", {"start_in": -240.0, "stop_in": 240.0, "step_in": 2.0}))
    return CrossingCase(pipe=pipe, soil=soil, vehicle=vehicle, scan=scan)
