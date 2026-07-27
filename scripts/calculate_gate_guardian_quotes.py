"""Reproduce planning quotes for the gate guardian proxy.

The constants mirror the public pricing formulas and catalog values observed
on 2026-07-28. Vendor-side final review and shipping can change the total.
"""

from __future__ import annotations

import math


VOLUME_CM3 = 52.0
SURFACE_CM2 = 180.7
TRIANGLES = 22_316
MAX_DIMENSION_MM = 170.0
BUILD_HEIGHT_MM = 10.0


def round_krw(value: float) -> int:
    return round(value)


def fabcube(process: str, material_krw_per_g: float, quantity: int = 1) -> dict:
    rules = {
        "fdm": {
            "minimum": 20_000,
            "price_multiplier": 2.105,
            "setup_minutes": 12,
            "labor_per_hour": 20_000,
            "labor_cap": 35,
            "machine_per_hour": 1_800,
            "density": 1.24,
            "minutes_per_cm3": 1.0,
            "minutes_per_mm": 0.1,
            "support_factor": 0.12,
            "lead_days": 4,
            "infill": 0.15,
        },
        "resin": {
            "minimum": 50_000,
            "price_multiplier": 2.40,
            "setup_minutes": 18,
            "labor_per_hour": 26_000,
            "labor_cap": 45,
            "machine_per_hour": 2_600,
            "density": 1.1,
            "minutes_per_cm3": 0.05,
            "minutes_per_mm": 0.7,
            "support_factor": 0.18,
            "lead_days": 5,
            "infill": 0.15,
        },
        "sls": {
            "minimum": 250_000,
            "price_multiplier": 1.484,
            "setup_minutes": 24,
            "labor_per_hour": 30_000,
            "labor_cap": 45,
            "machine_per_hour": 4_200,
            "density": 1.01,
            "minutes_per_cm3": 1.5,
            "minutes_per_mm": 0.3,
            "support_factor": 0.04,
            "lead_days": 6,
            "infill": 1.0,
        },
    }[process]

    complexity = 1 + min(0.18, TRIANGLES / 600_000)
    shell_cm3 = SURFACE_CM2 * 0.2
    interior_cm3 = max(0.0, VOLUME_CM3 - shell_cm3)
    effective_cm3 = min(
        VOLUME_CM3, shell_cm3 + interior_cm3 * rules["infill"]
    )
    support_multiplier = 1 + rules["support_factor"]
    grams = effective_cm3 * rules["density"] * support_multiplier
    material_cost = grams * material_krw_per_g
    print_minutes = (
        effective_cm3 * rules["minutes_per_cm3"]
        + MAX_DIMENSION_MM * rules["minutes_per_mm"]
    ) * support_multiplier * complexity
    machine_cost = print_minutes / 60 * rules["machine_per_hour"]
    labor_minutes = rules["setup_minutes"] + min(
        rules["labor_cap"], max(6, print_minutes * 0.08)
    )
    labor_cost = labor_minutes / 60 * rules["labor_per_hour"]
    unit_price = (
        (material_cost + machine_cost + labor_cost)
        * complexity
        * rules["price_multiplier"]
    )
    computed = unit_price * max(quantity**0.88, quantity * 0.70)
    supply = max(rules["minimum"], round_krw(computed))
    vat = round_krw(supply * 0.1)
    lead_days = rules["lead_days"] + (
        0 if quantity < 8 else math.ceil((quantity - 7) / 10)
    )
    return {
        "quantity": quantity,
        "computed_krw": round_krw(computed),
        "supply_krw": supply,
        "vat_included_krw": supply + vat,
        "lead_days": lead_days,
    }


def farm_volume_price(volume_cm3: float, rate: float = 300) -> float:
    tiers = (
        (50, 1.0),
        (200, 0.67),
        (500, 0.5),
        (math.inf, 0.33),
    )
    total = 0.0
    previous = 0.0
    for upper, ratio in tiers:
        if volume_cm3 <= previous:
            break
        total += (min(volume_cm3, upper) - previous) * rate * ratio
        previous = upper
    return total


def threedfarm(
    volume_cm3: float = VOLUME_CM3,
    material_multiplier: float = 1.0,
    quality_multiplier: float = 1.0,
    quantity: int = 1,
    support_removal: bool = False,
) -> dict:
    part = math.ceil(
        farm_volume_price(volume_cm3)
        * material_multiplier
        * quality_multiplier
    )
    support_fee = 0
    if support_removal:
        support_fee = 1_000 * round(
            max(2_000, volume_cm3 * 300 * 0.1) / 1_000
        )
    unit_price = max(3_000, part + support_fee)
    discount = 0.8 if quantity >= 10 else 0.85 if quantity >= 5 else 0.9 if quantity >= 2 else 1.0
    subtotal = 1_000 * math.ceil(
        unit_price * quantity * discount / 1_000
    )
    total = 5_000 + subtotal
    shipping = 3_000 if total < 30_000 else 0
    return {
        "quantity": quantity,
        "unit_price_krw": unit_price,
        "quote_krw": total,
        "shipping_krw": shipping,
        "delivered_krw": total + shipping,
    }


def wow3d() -> dict:
    # Current public defaults: PLA, 20% infill, 0.20 mm, support enabled.
    material_grams = VOLUME_CM3 * max(0.2 * 1.24, 0.2 * 1.24)
    fdm_layers = math.ceil(BUILD_HEIGHT_MM / 0.2)
    fdm_hours = max(
        0.5,
        0.0297 * (material_grams + 1) ** 0.85
        + 0.08 * 0.04 * fdm_layers
        + 0.00126 * (SURFACE_CM2 + 1) ** 0.8,
    )
    # Flat back contributes about 52 cm2 to the public overhang calculation.
    fdm_raw = (
        50 * material_grams
        + 50 * 52
        + fdm_hours * 4_600
        + 6_500
    )

    def resin(
        price_per_ml: float,
        exposure_seconds: float,
        hourly_rate: float,
        minimum: float,
        consumables: float,
        labor: float,
    ) -> int:
        layers = math.ceil(BUILD_HEIGHT_MM / 0.05)
        hours = max(
            0.5,
            0.953
            * (layers * (exposure_seconds + 8.5) / 3_600 + 0.1) ** 0.9,
        )
        raw = (
            price_per_ml * VOLUME_CM3
            + consumables
            + labor
            + hours * hourly_rate
        )
        return round(max(raw, minimum) * 1.1 / 100) * 100

    return {
        "fdm_vat_included_krw": round(max(fdm_raw, 20_000) * 1.1 / 100)
        * 100,
        "dlp_vat_included_krw": resin(
            300, 3, 4_000, 50_000, 4_000, 10_000
        ),
        "sla_vat_included_krw": resin(
            500, 8, 20_000, 100_000, 5_000, 10_000
        ),
    }


def main() -> None:
    print("FabCube")
    for process, price in (("fdm", 18), ("resin", 19.8), ("sls", 163)):
        print(process, [fabcube(process, price, qty) for qty in (1, 3, 10)])

    print("\n3DFARM")
    for quality, multiplier in (
        ("standard", 1.0),
        ("fine", 1.3),
        ("extra_fine", 1.8),
    ):
        print(
            quality,
            [threedfarm(quality_multiplier=multiplier, quantity=q) for q in (1, 3, 10)],
        )

    print("\nWOW3D")
    print(wow3d())


if __name__ == "__main__":
    main()
