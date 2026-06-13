from __future__ import annotations

import argparse
import json
from pathlib import Path

from .calculator import calculate_case
from .models import case_from_dict


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Calculate CEPA-style total hoop stress for a vehicle crossing.")
    parser.add_argument("case_file", type=Path, help="Path to a JSON crossing case file.")
    parser.add_argument("--pretty", action="store_true", help="Print a human-readable summary instead of JSON.")
    return parser


def format_summary(result: dict) -> str:
    lines = [
        "CEPA crossing hoop stress result",
        f"Critical vehicle position: {result['critical_position']['vehicle_position_in']:.3f} in",
        f"Critical live pressure: {result['critical_position']['live_pressure_psi']:.3f} psi",
        "",
    ]
    for label, key in (("Zero pressure", "zero_pressure"), ("MOP", "mop")):
        block = result[key]
        lines.extend(
            [
                label,
                f"  Live hoop bending: {block['live_hoop_bending_psi']:.1f} psi",
                f"  Soil hoop bending: {block['soil_hoop_bending_psi']:.1f} psi",
                f"  Pressure hoop: {block['pressure_hoop_psi']:.1f} psi",
                f"  Total hoop stress: {block['total_hoop_stress_psi']:.1f} psi",
                f"  Total hoop / SMYS: {block['total_hoop_percent_smys']:.2f}%",
                "",
            ]
        )
    return "\n".join(lines).rstrip()


def main() -> None:
    args = build_parser().parse_args()
    data = json.loads(args.case_file.read_text(encoding="utf-8"))
    result = calculate_case(case_from_dict(data))
    if args.pretty:
        print(format_summary(result))
    else:
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
