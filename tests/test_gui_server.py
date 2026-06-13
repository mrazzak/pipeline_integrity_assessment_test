import unittest
from pypdf import PdfReader
from io import BytesIO

from cepa_crossing.gui_server import (
    PASSWORD_MAX_AGE_DAYS,
    assessment_status,
    build_report_pdf,
    calculate_corlas_payload,
    calculate_annex_k_eca_payload,
    calculate_dent_assessment_payload,
    calculate_modified_b31g_payload,
    calculate_rstreng_payload,
    calculate_scc_colony_payload,
    calculate_crack_growth_payload,
    calculate_ili_screening_payload,
    parse_ili_feature_file,
    parse_ili_raw_file,
    calculate_prci_level2_dent_payload,
    calculate_interacting_anomalies_payload,
    calculate_ili_to_fea_payload,
    calculate_gui_payload,
    make_user_record,
    record_session_activity,
    make_vehicle_loads,
    mitigation_result,
    normalize_user_record,
    start_user_session,
    verify_password,
)


class GuiServerTests(unittest.TestCase):
    def sample_payload(self):
        return {
            "assessment_name": "Unit report",
            "pipe": {
                "outside_diameter_in": 24,
                "wall_thickness_in": 0.375,
                "maop_psig": 720,
                "class_location": "2",
                "design_factor": 0.8,
                "smys_psi": 52000,
                "youngs_modulus_psi": 30000000,
            },
            "vehicle": {
                "vehicle_type": "wheel",
                "axle_count": 2,
                "axle_loads_lb": [9000, 14000],
                "tire_pressures_psi": [85, 95],
                "tire_widths_in": [12, 16],
                "track_lengths_in": [],
                "contact_area_in2": 180,
                "tire_pressure_psi": 85,
                "axle_width_in": 72,
                "tire_width_in": 12,
                "axle_spacing_in": 60,
                "crossing_angle_deg": 90,
                "impact_factor": 1.15,
                "scan_step_in": 3,
            },
            "soil": {
                "profile": "asphalt_over_soil",
                "load_model": "trap_door",
                "friction_angle_deg": 30,
                "surface_layer_thickness_in": 4,
                "surface_layer_unit_weight_pcf": 145,
                "cover_in": 48,
                "unit_weight_pcf": 120,
                "modulus_reaction_psi": 1000,
                "kb": 0.1,
                "kz": 0.061,
            },
            "strain": {
                "mode": "direct",
                "bending_strain_microstrain": 100,
                "pipe_deflection_in": 0,
                "deflected_pipe_length_in": 240,
                "basis": "absolute",
            },
            "fatigue": {"enabled": False},
            "mitigation": {
                "type": "steel_plate",
                "width_in": 96,
                "length_in": 240,
                "thickness_in": 1,
                "spread_angle_deg": 45,
                "unit_weight_pcf": 490,
            },
        }

    def test_make_vehicle_loads_uses_each_axle_load(self):
        loads = make_vehicle_loads(
            {
                "vehicle_type": "wheel",
                "axle_count": 3,
                "axle_width_in": 72,
                "axle_spacing_in": 60,
                "axle_loads_lb": [8000, 12000, 16000],
            }
        )

        self.assertEqual(len(loads), 6)
        self.assertEqual([load.load_lb for load in loads], [4000, 4000, 6000, 6000, 8000, 8000])

    def test_calculate_gui_payload_returns_vehicle_metadata(self):
        result = calculate_gui_payload(self.sample_payload())

        self.assertEqual(result["vehicle"]["point_load_count"], 4)
        self.assertEqual(result["vehicle"]["pipe"]["class_location"], "2")
        self.assertEqual(result["vehicle"]["pipe"]["location_factor"], 0.9)
        self.assertAlmostEqual(result["vehicle"]["pipe"]["hoop_limit_percent_smys"], 72)
        self.assertEqual(result["vehicle"]["average_tire_width_in"], 14)
        self.assertEqual(result["vehicle"]["track_lengths_in"], [])
        self.assertEqual(result["vehicle"]["average_tire_pressure_psi"], 90)
        self.assertEqual(result["vehicle"]["soil"]["profile"], "asphalt_over_soil")
        self.assertEqual(result["vehicle"]["soil"]["load_model"], "trap_door")
        self.assertEqual(result["vehicle"]["soil"]["friction_angle_deg"], 30)
        self.assertEqual(result["mop"]["pre_existing_bending_stress_psi"], 3000)
        self.assertGreater(result["mop"]["assessment_stress_psi"], result["mop"]["total_hoop_stress_psi"])
        self.assertGreater(result["mop"]["total_hoop_stress_psi"], result["zero_pressure"]["total_hoop_stress_psi"])

    def test_wooden_bridge_mitigation_bypasses_live_load_when_covering_pipe_zone(self):
        payload = self.sample_payload()
        payload["mitigation"] = {
            "type": "wooden_bridge",
            "width_in": 144,
            "length_in": 240,
            "thickness_in": 12,
            "spread_angle_deg": 30,
            "unit_weight_pcf": 40,
        }
        result = calculate_gui_payload(payload)
        mitigation = mitigation_result(payload, result)

        self.assertTrue(mitigation["applied"])
        self.assertAlmostEqual(mitigation["bypass_factor"], 1.0)
        self.assertAlmostEqual(mitigation["factor"], 0.0)
        self.assertLess(mitigation["live_hoop_psi"], result["mop"]["live_hoop_bending_psi"])
        self.assertGreater(mitigation["self_weight_hoop_psi"], 0.0)

    def test_assessment_status_uses_mitigated_stress_when_mitigation_applies(self):
        payload = self.sample_payload()
        payload["pipe"]["class_location"] = "4"
        payload["pipe"]["maop_psig"] = 650
        payload["strain"]["bending_strain_microstrain"] = 0

        payload["mitigation"] = {"type": "none", "width_in": 0, "length_in": 0, "thickness_in": 0}
        result = calculate_gui_payload(payload)
        unmitigated = assessment_status(payload, result, mitigation_result(payload, result))

        payload["mitigation"] = {
            "type": "wooden_bridge",
            "width_in": 144,
            "length_in": 240,
            "thickness_in": 12,
            "spread_angle_deg": 30,
            "unit_weight_pcf": 40,
        }
        mitigated = assessment_status(payload, result, mitigation_result(payload, result))

        self.assertFalse(unmitigated["passes"])
        self.assertTrue(mitigated["passes"])
        self.assertLess(mitigated["assessment_stress_psi"], unmitigated["assessment_stress_psi"])
        self.assertIn("after wooden bridge mitigation", mitigated["detail"])

    def test_build_report_pdf_contains_visible_content(self):
        pdf = build_report_pdf(self.sample_payload())
        self.assertGreater(len(pdf), 1000)
        text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(pdf)).pages)
        self.assertIn("Pipeline Crossing Assessment Report", text)
        self.assertIn("Calculated Outputs", text)
        self.assertIn("PASS", text)

    def test_rstreng_effective_area_finds_controlling_segment(self):
        result = calculate_rstreng_payload(
            {
                "pipe": {
                    "outside_diameter_mm": 406.4,
                    "wall_thickness_mm": 7.14,
                    "maop_mpa": 7,
                    "smys_mpa": 359,
                    "smts_mpa": 455,
                },
                "assessment": {"assessment_factor": 0.72, "cap_flow_stress_to_smts": True},
                "profile": [
                    {"station_mm": 0, "depth_mm": 0.6},
                    {"station_mm": 25, "depth_mm": 2.4},
                    {"station_mm": 50, "depth_mm": 3.8},
                    {"station_mm": 75, "depth_mm": 4.1},
                    {"station_mm": 100, "depth_mm": 3.0},
                    {"station_mm": 125, "depth_mm": 1.4},
                    {"station_mm": 150, "depth_mm": 0.5},
                ],
            }
        )

        output = result["outputs"]
        segment = output["controlling_segment"]
        self.assertEqual(output["status"], "PASS")
        self.assertGreater(segment["effective_area_mm2"], 0)
        self.assertGreater(segment["failure_pressure_mpa"], 7)
        self.assertLessEqual(segment["start_station_mm"], 75)
        self.assertGreaterEqual(segment["end_station_mm"], 75)
        self.assertLess(output["maop_to_allowable_ratio"], 1)

    def test_scc_colony_assessment_returns_interaction_and_pressure(self):
        result = calculate_scc_colony_payload(
            {
                "pipe": {
                    "outside_diameter_mm": 762,
                    "wall_thickness_mm": 9.5,
                    "maop_mpa": 6.9,
                    "smys_mpa": 448,
                    "smts_mpa": 535,
                    "fracture_toughness_mpa_sqrt_m": 95,
                    "assessment_factor": 0.72,
                },
                "colony": {
                    "orientation": "axial",
                    "geometry_factor": 1.12,
                    "depths_mm": [1.8, 2.4, 2.1, 1.6],
                    "lengths_mm": [18, 24, 20, 15],
                    "axial_spacings_mm": [8, 12, 30],
                },
                "fatigue": {"pressure_range_mpa": 1.5, "paris_c": 1e-12, "paris_m": 3},
            }
        )

        output = result["outputs"]
        self.assertEqual(output["status"], "ACCEPTABLE")
        self.assertEqual(output["crack_count"], 4)
        self.assertGreater(output["interaction_factor"], 1)
        self.assertGreater(output["failure_pressure_mpa"], 0)
        self.assertLess(output["maop_to_allowable_ratio"], 1)
        self.assertIsNotNone(output["remaining_cycles"])

    def test_crack_growth_payload_returns_fatigue_life(self):
        result = calculate_crack_growth_payload(
            {
                "crack": {"initial_crack_mm": 1, "critical_crack_mm": 6},
                "loading": {
                    "stress_range_mpa": 80,
                    "geometry_factor": 1.12,
                    "threshold_delta_k_mpa_sqrt_m": 0,
                },
                "assessment": {
                    "paris_c": 1e-12,
                    "paris_m": 3,
                    "increment_mm": 0.001,
                    "applied_cycles": 100000,
                    "life_factor": 1,
                },
            }
        )

        output = result["outputs"]
        self.assertEqual(output["status"], "PASS")
        self.assertGreater(output["estimated_cycles"], output["applied_cycles"])
        self.assertGreater(output["remaining_cycles"], 0)
        self.assertLess(output["damage_ratio"], 1)
        self.assertGreater(output["critical_delta_k_mpa_sqrt_m"], output["initial_delta_k_mpa_sqrt_m"])

    def test_ili_screening_ranks_features_by_action_priority(self):
        result = calculate_ili_screening_payload(
            {
                "pipe": {
                    "outside_diameter_mm": 762,
                    "wall_thickness_mm": 9.5,
                    "maop_mpa": 6.9,
                    "smys_mpa": 448,
                    "assessment_factor": 0.72,
                },
                "criteria": {
                    "repair_pressure_ratio": 1,
                    "monitor_pressure_ratio": 0.8,
                    "depth_watch_percent": 50,
                    "primary_method": "corlas",
                    "fracture_toughness_mpa_sqrt_m": 95,
                    "feature_methods": {"F-104": "asme_b31g"},
                    "screening_methods": ["modified_b31g", "asme_b31g", "rstreng_simplified", "corlas", "scc_colony", "reported_pressure"],
                },
                "fatigue": {
                    "enabled": True,
                    "stress_range_mpa": 80,
                    "bending_strain_percent": 0.2,
                    "cycles_per_year": 1000,
                    "applied_cycles": 10000,
                    "paris_c": 1e-12,
                    "paris_m": 3,
                },
                "risk": {"class_location": "2", "prediction_years": 5, "annual_growth_percent": 1},
                "features": {
                    "ids": ["F-101", "F-102", "F-103", "F-104"],
                    "types": ["metal_loss", "crack", "dent", "metal_loss"],
                    "depths_percent": [42, 58, 18, 64],
                    "lengths_mm": [110, 45, 75, 180],
                    "clock_positions": ["3:00", "6:00", "12:00", "4:30"],
                    "distances_m": [1250.4, 1258.8, 1280.2, 1315.6],
                    "reported_failure_pressures_mpa": [0, 8.1, 0, 6.8],
                },
            }
        )

        output = result["outputs"]
        self.assertEqual(output["feature_count"], 4)
        self.assertEqual(output["status"], "ACTION REQUIRED")
        self.assertGreaterEqual(output["immediate_count"], 1)
        self.assertIn("most_conservative_method", output)
        self.assertIn("risk_class", output)
        self.assertEqual(output["ranked_features"][0]["rank"], 1)
        self.assertIn("conservative_method", output["ranked_features"][0])
        selected_feature = next(feature for feature in output["ranked_features"] if feature["feature_id"] == "F-104")
        self.assertEqual(selected_feature["calculation_method_key"], "asme_b31g")
        self.assertTrue(any(method["method"] == "asme_b31g" for method in selected_feature["method_results"]))
        self.assertTrue(
            any(method["method"] in {"corlas", "scc_colony"} for method in output["ranked_features"][0]["method_results"])
        )
        self.assertIn("fatigue_life_years", output["ranked_features"][0])
        self.assertIn("predicted_failure_years", output["ranked_features"][0])
        self.assertIn(output["ranked_features"][0]["priority"], {"Immediate action", "High priority"})

    def test_ili_excel_import_reads_feature_rows(self):
        from openpyxl import Workbook

        workbook = Workbook()
        sheet = workbook.active
        sheet.append(["id", "type", "depth", "length", "clock", "distance", "pressure"])
        sheet.append(["F-201", "metal_loss", 45, 120, "2:00", 1400.5, 0])
        sheet.append(["F-202", "crack", 62, 55, "5:30", 1412.0, 7.2])
        stream = BytesIO()
        workbook.save(stream)

        features = parse_ili_feature_file("ili.xlsx", stream.getvalue())

        self.assertEqual(features["ids"], ["F-201", "F-202"])
        self.assertEqual(features["types"], ["metal_loss", "crack"])
        self.assertEqual(features["depths_percent"], ["45", "62"])
        self.assertEqual(features["reported_failure_pressures_mpa"], ["0", "7.2"])

    def test_user_records_hash_passwords_and_expire_after_120_days(self):
        user = make_user_record("secure123", "user", "2026-12-31", "Secure User", "secure@example.com")

        self.assertNotIn("password", user)
        self.assertTrue(verify_password("secure123", user["password_hash"]))
        self.assertFalse(verify_password("wrong-password", user["password_hash"]))
        self.assertEqual(user["account_expires_at"], "2026-12-31")
        self.assertEqual(user["full_name"], "Secure User")
        self.assertEqual(user["email"], "secure@example.com")
        self.assertEqual(user["session_count"], 0)
        self.assertEqual(user["modules_used"], [])
        self.assertEqual(PASSWORD_MAX_AGE_DAYS, 120)

    def test_user_session_activity_tracks_hours_and_modules(self):
        users = {"operator": make_user_record("secure123", "user", full_name="Pipeline Operator")}
        session_id = start_user_session(users, "operator")

        record_session_activity(users, "operator", session_id, 1800, "Pipeline Crossing Assessment")
        record_session_activity(users, "operator", session_id, 5400, "CorLAS Failure Pressure Calculation", finished=True)
        public = normalize_user_record(users["operator"])[0]

        self.assertEqual(public["session_count"], 1)
        self.assertAlmostEqual(public["total_session_seconds"], 5400)
        self.assertEqual(public["modules_used"], ["CorLAS Failure Pressure Calculation", "Pipeline Crossing Assessment"])
        self.assertEqual(public["active_sessions"], {})

    def test_plaintext_user_records_are_migrated_to_hashes(self):
        user, changed = normalize_user_record({"password": "legacy", "role": "admin"})

        self.assertTrue(changed)
        self.assertNotIn("password", user)
        self.assertEqual(user["role"], "admin")
        self.assertEqual(user["full_name"], "")
        self.assertEqual(user["email"], "")
        self.assertTrue(verify_password("legacy", user["password_hash"]))
        self.assertIn("password_expires_at", user)

    def test_corlas_payload_matches_workbook_macro_outputs(self):
        result = calculate_corlas_payload(
            {
                "geometry": {"outside_diameter_mm": 406.4, "wall_thickness_mm": 7.14},
                "crack": {"depth_mm": 2.9, "length_mm": 26},
                "material": {
                    "yield_strength_mpa": 359,
                    "tensile_strength_mpa": 450,
                    "elastic_modulus_mpa": 207000,
                    "fracture_toughness_j": 225,
                },
                "solver": {"flow_stress_coefficient": 0.5, "pressure_step_mpa": 0.01, "max_iterations": 100000},
            }
        )

        self.assertAlmostEqual(result["outputs"]["fracture_pressure_mpa"], 13.68, places=2)
        self.assertAlmostEqual(result["outputs"]["collapse_pressure_mpa"], 13.7878, places=3)
        self.assertAlmostEqual(result["outputs"]["failure_pressure_mpa"], 13.68, places=2)
        self.assertEqual(result["outputs"]["controlling_mode"], "Fracture")
        self.assertGreaterEqual(result["intermediate"]["total_j"], 225)

    def test_corlas_eq17_toughness_and_internal_crack_face_pressure(self):
        eq17_payload = {
            "geometry": {"outside_diameter_mm": 406.4, "wall_thickness_mm": 7.14},
            "crack": {"depth_mm": 2.9, "length_mm": 26, "profile": "semi_elliptical", "location": "external"},
            "material": {
                "yield_strength_mpa": 359,
                "tensile_strength_mpa": 450,
                "elastic_modulus_mpa": 207000,
                "cvn_j": 18,
                "charpy_area_in2": 0.124,
                "fracture_toughness_method": "eq17_cvn",
                "fracture_toughness_j": 225,
            },
            "solver": {"flow_stress_coefficient": 0.5, "pressure_step_mpa": 0.01, "max_iterations": 100000},
        }
        eq17 = calculate_corlas_payload(eq17_payload)
        manual_payload = {
            **eq17_payload,
            "material": {
                **eq17_payload["material"],
                "fracture_toughness_method": "manual",
                "fracture_toughness_j": 225,
            },
        }
        external = calculate_corlas_payload(manual_payload)
        internal_payload = dict(manual_payload)
        internal_payload["crack"] = {**manual_payload["crack"], "location": "internal"}
        internal = calculate_corlas_payload(internal_payload)

        self.assertAlmostEqual(eq17["inputs"]["fracture_toughness_j"], 12 * 18 / 0.124)
        self.assertLess(internal["outputs"]["fracture_pressure_mpa"], external["outputs"]["fracture_pressure_mpa"])

    def test_corlas_crack_profile_changes_effective_area(self):
        base_payload = {
            "geometry": {"outside_diameter_mm": 406.4, "wall_thickness_mm": 7.14},
            "crack": {"depth_mm": 2.9, "length_mm": 26, "location": "external", "profile": "semi_elliptical"},
            "material": {
                "yield_strength_mpa": 359,
                "tensile_strength_mpa": 450,
                "elastic_modulus_mpa": 207000,
                "fracture_toughness_j": 225,
            },
            "solver": {"flow_stress_coefficient": 0.5, "pressure_step_mpa": 0.01, "max_iterations": 100000},
        }
        semi = calculate_corlas_payload(base_payload)
        rectangular = calculate_corlas_payload({**base_payload, "crack": {**base_payload["crack"], "profile": "rectangular"}})

        self.assertGreater(rectangular["intermediate"]["effective_flaw_area_mm2"], semi["intermediate"]["effective_flaw_area_mm2"])
        self.assertLess(rectangular["outputs"]["collapse_pressure_mpa"], semi["outputs"]["collapse_pressure_mpa"])

    def test_modified_b31g_matches_reference_equation_shape(self):
        result = calculate_modified_b31g_payload(
            {
                "pipe": {
                    "outside_diameter_mm": 406.4,
                    "wall_thickness_mm": 7.14,
                    "maop_mpa": 7,
                    "smys_mpa": 359,
                    "smts_mpa": 455,
                },
                "defect": {"depth_mm": 2.5, "length_mm": 50},
                "assessment": {"assessment_factor": 0.72, "cap_flow_stress_to_smts": True},
            }
        )

        z = 50**2 / (406.4 * 7.14)
        m = (1 + 0.6275 * z - 0.003375 * z**2) ** 0.5
        flow = min(359 + 69, 455)
        expected_stress = flow * (1 - 0.85 * 2.5 / 7.14) / (1 - 0.85 * 2.5 / (7.14 * m))
        expected_pressure = 2 * 7.14 * expected_stress / 406.4

        self.assertAlmostEqual(result["outputs"]["z_parameter"], z)
        self.assertAlmostEqual(result["outputs"]["folias_factor"], m)
        self.assertAlmostEqual(result["outputs"]["failure_pressure_mpa"], expected_pressure)
        self.assertEqual(result["outputs"]["status"], "PASS")

    def test_prci_level2_dent_matches_workbook_macro_sample(self):
        result = calculate_prci_level2_dent_payload(
            {
                "pipe": {"outside_diameter_mm": 406.4, "wall_thickness_mm": 12.5, "operating_pressure_mpa": 10, "smys_mpa": 359},
                "dent": {"depth_mm": 3, "radius_mm": 3},
                "fatigue": {"stress_cycles": 10, "stress_concentration_factor": 0.5},
                "crack_growth": {
                    "enabled": True,
                    "initial_crack_mm": 1,
                    "critical_crack_mm": 1.01,
                    "stress_range_mpa": 80,
                    "paris_c": 1e-12,
                    "paris_m": 3,
                    "increment_mm": 0.001,
                },
            }
        )

        self.assertAlmostEqual(result["outputs"]["dent_depth_percent"], 0.7381889763779528)
        self.assertAlmostEqual(result["outputs"]["hoop_stress_mpa"], 162.56)
        self.assertAlmostEqual(result["outputs"]["bending_strain"], 2.0833333333333335)
        self.assertAlmostEqual(result["outputs"]["equivalent_stress_mpa"], 81.28)
        self.assertAlmostEqual(result["outputs"]["fatigue_life_cycles"], 1364.6599861837378)
        self.assertAlmostEqual(result["outputs"]["remaining_strength_factor"], 4.416830708661418)
        self.assertEqual(result["outputs"]["assessment_result"], "EXCESSIVE STRAIN - REPAIR REQUIRED")
        self.assertEqual(result["outputs"]["criteria"][0]["label"], "Bending strain")
        self.assertEqual(result["outputs"]["criteria"][0]["status"], "FAIL")
        self.assertIn("greater than the 0.06", result["outputs"]["criteria"][0]["message"])
        self.assertIn("repair is required", result["outputs"]["repair_required_reasons"][0])
        self.assertTrue(result["outputs"]["crack_growth"]["enabled"])

    def test_interacting_anomalies_returns_framework_metrics(self):
        result = calculate_interacting_anomalies_payload(
            {
                "pipe": {
                    "outside_diameter_mm": 762,
                    "wall_thickness_mm": 9.5,
                    "maop_mpa": 6.9,
                    "smys_mpa": 448,
                    "smts_mpa": 535,
                    "elastic_modulus_mpa": 207000,
                    "fracture_toughness_mpa_sqrt_m": 95,
                    "model_length_factor": 8,
                },
                "loading": {
                    "secondary_stress_mpa": 0,
                    "residual_stress_fraction": 0.2,
                    "pressure_range_mpa": 1.5,
                    "paris_c": 1e-12,
                    "paris_m": 3,
                },
                "uncertainty": {
                    "case": "nominal",
                    "depth_tolerance_mm": 0.5,
                    "length_tolerance_mm": 10,
                    "width_tolerance_mm": 10,
                },
                "mesh": {"refinement": "standard", "solver_strategy": "implicit_riks"},
                "anomalies": [
                    {
                        "type": "metal_loss",
                        "surface": "external",
                        "axial_location_mm": -120,
                        "clock_position_deg": 20,
                        "length_mm": 180,
                        "width_mm": 90,
                        "depth_mm": 3.5,
                        "orientation_deg": 0,
                    },
                    {
                        "type": "crack",
                        "surface": "external",
                        "axial_location_mm": 70,
                        "clock_position_deg": 35,
                        "length_mm": 120,
                        "width_mm": 45,
                        "depth_mm": 2.5,
                        "orientation_deg": 0,
                    },
                ],
            }
        )

        output = result["outputs"]
        self.assertGreater(output["interaction_factor"], 1.0)
        self.assertIn(output["interaction_classification"], {"Negligible", "Moderate", "Strong"})
        self.assertGreater(output["combined_failure_pressure_mpa"], 0)
        self.assertGreater(result["mesh"]["through_ligament_elements"], 5)
        self.assertIn("boundary_conditions", result["mesh"])

    def test_ili_to_fea_translates_features_and_governs_mop(self):
        result = calculate_ili_to_fea_payload(
            {
                "pipe": {
                    "outside_diameter_mm": 762,
                    "wall_thickness_mm": 9.5,
                    "maop_mpa": 6.9,
                    "smys_mpa": 448,
                    "smts_mpa": 535,
                    "elastic_modulus_mpa": 207000,
                    "fracture_toughness_mpa_sqrt_m": 95,
                    "assessment_factor": 0.72,
                },
                "loading": {
                    "pressure_range_mpa": 1.5,
                    "cycles_per_year": 1000,
                    "applied_cycles": 10000,
                    "paris_c": 1e-12,
                    "paris_m": 3,
                    "residual_stress_fraction": 0.2,
                },
                "model": {
                    "interaction_distance_mm": 500,
                    "model_length_factor": 8,
                    "mesh_refinement": "standard",
                    "solver_strategy": "implicit_riks",
                    "sizing_case": "conservative",
                    "screening_method": "modified_b31g",
                    "class_location": "2",
                    "prediction_years": 5,
                    "annual_growth_percent": 1,
                },
                "features": {
                    "ids": ["F-101", "F-102", "F-103"],
                    "types": ["metal_loss", "crack", "dent"],
                    "depths_percent": [42, 58, 18],
                    "lengths_mm": [110, 45, 75],
                    "widths_mm": [70, 20, 90],
                    "clock_positions": ["3:00", "3:30", "12:00"],
                    "distances_m": [1250.0, 1250.2, 1280.0],
                    "orientations_deg": [0, 10, 0],
                    "surfaces": ["external", "external", "external"],
                    "reported_failure_pressures_mpa": [0, 8.1, 0],
                },
                "raw_data": {
                    "mfl_samples": [
                        {"feature_id": "F-101", "axial_offset_mm": 0, "circumferential_offset_mm": 0, "depth_percent": 42}
                    ],
                    "crack_samples": [
                        {
                            "feature_id": "F-102",
                            "axial_offset_mm": 0,
                            "circumferential_offset_mm": 0,
                            "depth_mm": 5.51,
                            "opening_mm": 0.4,
                        }
                    ],
                    "caliper_samples": [
                        {
                            "feature_id": "F-103",
                            "axial_offset_mm": 0,
                            "circumferential_offset_mm": 0,
                            "radial_deformation_mm": -1.7,
                        }
                    ],
                },
            }
        )

        self.assertEqual(result["outputs"]["feature_count"], 3)
        self.assertGreaterEqual(result["outputs"]["interaction_model_count"], 1)
        self.assertEqual(result["translated_features"][0]["clock_position_deg"], 90)
        self.assertAlmostEqual(result["translated_features"][1]["depth_mm"], 5.51)
        self.assertGreater(result["outputs"]["maximum_mop_mpa"], 0)
        self.assertIn(result["outputs"]["governing_source"], {"F-101", "F-102", "F-103", "FEA-F-101-F-102"})
        self.assertIn("mesh", result["fea_models"][0])
        self.assertEqual(result["outputs"]["raw_sample_count"], 3)
        self.assertGreater(result["raw_mesh"]["node_count"], 0)
        self.assertEqual(result["translated_features"][1]["raw_sample_counts"]["crack"], 1)
        self.assertEqual(result["translated_features"][0]["geometry_source"], "raw_tool_data")
        self.assertTrue(result["raw_mesh"]["geometry_coupled_to_assessment"])
        self.assertGreater(result["outputs"]["removed_crack_elements"], 0)
        self.assertTrue(result["raw_mesh"]["adaptive_refinement"])
        self.assertGreater(result["raw_mesh"]["local_to_remote_density_ratio"], 1)
        self.assertEqual(result["surrogate"]["validation"]["benchmark_case_count"], 29)
        self.assertGreater(result["surrogate"]["validation"]["r_squared"], 0.99)
        self.assertTrue(result["reliability"]["available"])
        self.assertIn("b31_8_status", result["strain_assessment"])
        self.assertEqual(len(result["workflow"]), 6)

    def test_ili_to_fea_uses_weld_specific_capacity_model(self):
        result = calculate_ili_to_fea_payload(
            {
                "pipe": {
                    "outside_diameter_mm": 762,
                    "wall_thickness_mm": 9.5,
                    "maop_mpa": 6.9,
                    "smys_mpa": 448,
                    "smts_mpa": 535,
                    "elastic_modulus_mpa": 207000,
                    "fracture_toughness_mpa_sqrt_m": 95,
                    "assessment_factor": 0.72,
                },
                "weld": {
                    "yield_strength_mpa": 480,
                    "fracture_toughness_mpa_sqrt_m": 75,
                    "residual_stress_factor": 0.6,
                    "cap_width_mm": 12,
                    "haz_width_mm": 6,
                },
                "loading": {"pressure_range_mpa": 1.5, "cycles_per_year": 1000},
                "model": {"interaction_distance_mm": 500, "mesh_refinement": "standard"},
                "features": {
                    "ids": ["W-1", "B-1"],
                    "types": ["crack", "metal_loss"],
                    "depths_percent": [45, 35],
                    "lengths_mm": [55, 90],
                    "widths_mm": [15, 55],
                    "clock_positions": ["3:00", "6:00"],
                    "distances_m": [1000, 1010],
                    "weld_types": ["pipe_seam", "none"],
                    "weld_offsets_mm": [0, 0],
                },
                "raw_data": {"mfl_samples": [], "crack_samples": [], "caliper_samples": []},
            }
        )
        weld_feature = result["translated_features"][0]
        self.assertEqual(weld_feature["weld_zone"], "weld_metal")
        self.assertEqual(result["outputs"]["weld_feature_count"], 1)
        self.assertEqual(result["weld_assessment"]["features"][0]["failure_mode"], "Weld/HAZ fracture")
        self.assertNotIn("W-1", {item["feature_id"] for item in result["surrogate"]["predictions"]})
        self.assertIn("ERW HIGH FREQUENCY FAD", result["weld_assessment"]["features"][0]["calculation_method"])

    def test_ili_to_fea_can_disable_reliability_module(self):
        payload = {
            "pipe": {
                "outside_diameter_mm": 762,
                "wall_thickness_mm": 9.5,
                "maop_mpa": 6.9,
                "smys_mpa": 448,
                "smts_mpa": 535,
                "elastic_modulus_mpa": 207000,
                "fracture_toughness_mpa_sqrt_m": 95,
                "assessment_factor": 0.72,
            },
            "weld": {"pipe_weld_type": "spiral_dsaw", "spiral_turns": 2},
            "loading": {"pressure_range_mpa": 1.5, "cycles_per_year": 1000},
            "model": {"reliability_enabled": False, "reliability_samples": 1},
            "features": {
                "ids": ["M-1"],
                "types": ["metal_loss"],
                "depths_percent": [45],
                "lengths_mm": [200],
                "clock_positions": ["3:00"],
                "distances_m": [1000],
                "weld_types": ["pipe_seam"],
                "weld_offsets_mm": [0],
            },
            "raw_data": {"mfl_samples": [], "crack_samples": [], "caliper_samples": []},
        }
        result = calculate_ili_to_fea_payload(payload)
        self.assertFalse(result["reliability"]["enabled"])
        self.assertFalse(result["reliability"]["available"])
        self.assertEqual(result["reliability"]["samples"], 0)
        self.assertIsNone(result["outputs"]["probability_of_failure"])
        self.assertEqual(result["translated_features"][0]["weld_type"], "spiral_seam")
        self.assertEqual(result["translated_features"][0]["manufacturing_process"], "spiral_dsaw")

    def test_raw_ili_file_import_and_raw_only_geometry(self):
        mfl = parse_ili_raw_file(
            "mfl.csv",
            (
                b"feature_id,distance_m,clock_position,axial_offset_mm,circumferential_offset_mm,depth_percent\n"
                b"M-1,1000,3:00,-50,-20,35\nM-1,1000,3:00,50,20,62\n"
            ),
            "mfl",
        )
        crack = parse_ili_raw_file(
            "crack.txt",
            (
                b"feature_id,distance_m,clock_position,axial_offset_mm,circumferential_offset_mm,depth_mm,"
                b"opening_mm,orientation_deg,crack_id,anomaly_type\n"
                b"SCC-1,1000.2,3:20,-25,-8,4.2,0.2,5,C1,scc\n"
                b"SCC-1,1000.2,3:20,25,8,5.0,0.3,5,C2,scc\n"
            ),
            "crack",
        )
        result = calculate_ili_to_fea_payload(
            {
                "pipe": {
                    "outside_diameter_mm": 762,
                    "wall_thickness_mm": 9.5,
                    "maop_mpa": 6.9,
                    "smys_mpa": 448,
                    "smts_mpa": 535,
                    "elastic_modulus_mpa": 207000,
                    "fracture_toughness_mpa_sqrt_m": 95,
                    "assessment_factor": 0.72,
                },
                "loading": {"pressure_range_mpa": 1.5, "cycles_per_year": 1000},
                "model": {
                    "geometry_source": "raw",
                    "interaction_distance_mm": 500,
                    "mesh_refinement": "standard",
                    "screening_method": "modified_b31g",
                },
                "features": {},
                "raw_data": {"mfl_samples": mfl, "crack_samples": crack, "caliper_samples": []},
            }
        )
        self.assertEqual(result["outputs"]["feature_count"], 2)
        self.assertEqual(result["inputs"]["geometry_source"], "raw")
        self.assertEqual(result["translated_features"][0]["depth_percent"], 62)
        self.assertEqual(result["translated_features"][1]["source_type"], "scc")
        self.assertGreater(result["translated_features"][1]["effective_geometry"]["crack_front_points"], 0)

    def test_annex_k_eca_matches_workbook_sample(self):
        result = calculate_annex_k_eca_payload(
            {
                "geometry": {"outside_diameter_mm": 508, "wall_thickness_mm": 12.7},
                "material": {
                    "smys_mpa": 483,
                    "weld_yield_strength_mpa": 520,
                    "base_yield_strength_mpa": 505,
                    "elastic_modulus_mpa": 200000,
                    "poisson_ratio": 0.3,
                    "thermal_coefficient_per_c": 0.0000117,
                    "kmat_mpa_sqrt_m": 95,
                },
                "loads": {"pressure_mpa": 9.93, "temperature_change_c": 45, "bending_moment_kn_m": 120},
                "flaw": {
                    "misalignment_mm": 1.5,
                    "measured_height_mm": 2,
                    "measured_length_mm": 25,
                    "height_nde_allowance_mm": 0.5,
                    "length_nde_allowance_mm": 2,
                },
                "assessment": {"service_type": "liquid", "longitudinal_strain_percent": 0, "residual_stress_factor": 0.6},
            }
        )

        output = result["outputs"]
        self.assertAlmostEqual(output["effective_flaw_height_mm"], 2.5)
        self.assertAlmostEqual(output["effective_flaw_length_mm"], 27)
        self.assertAlmostEqual(output["scf"], 1.3895, places=3)
        self.assertAlmostEqual(output["hoop_stress_mpa"], 198.6, places=1)
        self.assertAlmostEqual(output["strength_mismatch_ratio"], 1.03, places=2)
        self.assertEqual(output["status"], "STATUS: ACCEPTABLE")

    def test_statistical_dent_assessment_matches_workbook_macro_method(self):
        result = calculate_dent_assessment_payload(
            {
                "pipe": {"outside_diameter_in": 24, "wall_thickness_in": 0.5},
                "dent": {
                    "circumferential_radius_in": -15,
                    "longitudinal_radius_in": -10,
                    "depth_in": 3,
                    "length_in": 14,
                },
                "simulation": {
                    "measurement_error_fraction": 0.1,
                    "strain_limit": 0.06,
                    "num_simulations": 20000,
                    "seed": 8675309,
                },
            }
        )

        output = result["outputs"]
        self.assertAlmostEqual(output["mean_peak_strain"], 0.0457, places=3)
        self.assertAlmostEqual(output["p95_strain"], 0.0546, places=3)
        self.assertLess(output["probability_exceedance"], 0.03)
        self.assertEqual(output["status"], "ACCEPTABLE")
        self.assertIn("advanced FFS", " ".join(output["framework_notes"]))


if __name__ == "__main__":
    unittest.main()
