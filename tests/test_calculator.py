import math
import unittest

from cepa_crossing.calculator import (
    boussinesq_pressure_psi,
    calculate_case,
    cepa_hoop_bending_stress_psi,
    internal_hoop_stress_psi,
    prism_soil_pressure_psi,
    trap_door_soil_pressure_psi,
)
from cepa_crossing.models import CrossingCase, Pipe, PointLoad, Scan, Soil, Vehicle


class CalculatorTests(unittest.TestCase):
    def test_boussinesq_pressure_matches_manual_formula(self):
        actual = boussinesq_pressure_psi(point_load_lb=10_000.0, cover_in=48.0, offset_in=0.0)
        expected = 3.0 * 10_000.0 / (2.0 * math.pi * 48.0**2)
        self.assertAlmostEqual(actual, expected)

    def test_prism_soil_pressure_converts_pcf_to_pci(self):
        self.assertAlmostEqual(prism_soil_pressure_psi(120.0, 48.0), 120.0 / 1728.0 * 48.0)

    def test_trap_door_soil_pressure_reduces_prism_load_with_arching(self):
        prism = prism_soil_pressure_psi(120.0, 48.0)
        trap_door = trap_door_soil_pressure_psi(120.0, 48.0, 24.0, 30.0)
        self.assertGreater(trap_door, 0)
        self.assertLess(trap_door, prism)

    def test_pressure_hoop_uses_barlow_thin_wall_equation(self):
        self.assertAlmostEqual(internal_hoop_stress_psi(720.0, 24.0, 0.375), 23_040.0)

    def test_cepa_hoop_bending_decreases_when_internal_pressure_increases(self):
        zero = cepa_hoop_bending_stress_psi(2.5, 24.0, 0.375, 0.1, 0.061, 0.0, 30_000_000.0, 1000.0)
        at_pressure = cepa_hoop_bending_stress_psi(2.5, 24.0, 0.375, 0.1, 0.061, 720.0, 30_000_000.0, 1000.0)
        self.assertLess(at_pressure, zero)

    def test_calculate_case_reports_mop_greater_than_zero_pressure_total(self):
        case = CrossingCase(
            pipe=Pipe(24.0, 0.375, 720.0, 52_000.0),
            soil=Soil(48.0, 120.0, 1000.0, 0.1, 0.061),
            vehicle=Vehicle(
                crossing_angle_deg=90.0,
                impact_factor=1.0,
                loads=(PointLoad("wheel", 0.0, 0.0, 10_000.0),),
            ),
            scan=Scan(-12.0, 12.0, 1.0),
        )
        result = calculate_case(case)
        self.assertAlmostEqual(result["critical_position"]["vehicle_position_in"], 0.0)
        self.assertGreater(result["mop"]["total_hoop_stress_psi"], result["zero_pressure"]["total_hoop_stress_psi"])


if __name__ == "__main__":
    unittest.main()
