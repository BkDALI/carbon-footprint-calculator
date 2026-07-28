from sqlalchemy.orm import Session

from app.core.emission_factors import (
    ELECTRICITY_FACTOR_KG_PER_KWH,
    FUEL_FACTORS_KG_PER_LITRE,
    GAS_FACTOR_KG_PER_M3,
    TRANSPORT_FACTORS_KG_PER_KM,
    BUILDING_FACTOR_KG_PER_M2_YEAR,
    INDUSTRY_FACTOR_KG_PER_UNIT,
    FOOD_FACTORS_KG_PER_YEAR,
    WASTE_FACTORS_KG_PER_KG,
)
from app.models.calculation import Calculation
from app.schemas.calculation import CalculationCreate


def compute_breakdown(data: CalculationCreate) -> dict:
    household_size = max(data.building.household_size, 1)
    occupants = max(data.transport.occupants, 1)

    # Électricité, gaz et GPL sont une consommation partagée du foyer : on alloue la part
    # personnelle de chacun en divisant par le nombre de personnes du foyer.
    electricity = (data.electricity.consumption_kwh / household_size) * ELECTRICITY_FACTOR_KG_PER_KWH

    fuel = (
        data.fuel.essence_litres * FUEL_FACTORS_KG_PER_LITRE["essence"]
        + data.fuel.diesel_litres * FUEL_FACTORS_KG_PER_LITRE["diesel"]
        + (data.fuel.gpl_litres / household_size) * FUEL_FACTORS_KG_PER_LITRE["gpl"]
        + (data.fuel.gaz_naturel_m3 / household_size) * GAS_FACTOR_KG_PER_M3
    )

    voiture_factor = {
        "thermique": TRANSPORT_FACTORS_KG_PER_KM["voiture"],
        "hybride": TRANSPORT_FACTORS_KG_PER_KM["voiture_hybride"],
        "electrique": TRANSPORT_FACTORS_KG_PER_KM["voiture_electrique"],
    }.get(data.transport.motorisation, TRANSPORT_FACTORS_KG_PER_KM["voiture"])

    # Le covoiturage partage la part personnelle de la voiture entre occupants ; la moto/le
    # scooter reste individuel (pas de division).
    transport = (
        (data.transport.voiture_km * voiture_factor) / occupants
        + data.transport.moto_km * TRANSPORT_FACTORS_KG_PER_KM["moto"]
        + data.transport.bus_km * TRANSPORT_FACTORS_KG_PER_KM["bus"]
        + data.transport.train_km * TRANSPORT_FACTORS_KG_PER_KM["train"]
        + data.transport.avion_km * TRANSPORT_FACTORS_KG_PER_KM["avion"]
    )

    building = (data.building.surface_m2 / household_size) * BUILDING_FACTOR_KG_PER_M2_YEAR
    industry = data.industry.quantite_produite * INDUSTRY_FACTOR_KG_PER_UNIT
    food = FOOD_FACTORS_KG_PER_YEAR.get(data.food.diet_type, FOOD_FACTORS_KG_PER_YEAR["omnivore"])

    waste = (
        data.waste.non_trie_kg_semaine * 52 * WASTE_FACTORS_KG_PER_KG["non_trie"]
        + data.waste.trie_kg_semaine * 52 * WASTE_FACTORS_KG_PER_KG["trie"]
    )

    return {
        "electricity": round(electricity, 2),
        "fuel": round(fuel, 2),
        "transport": round(transport, 2),
        "building": round(building, 2),
        "industry": round(industry, 2),
        "food": round(food, 2),
        "waste": round(waste, 2),
    }


def create_calculation(db: Session, data: CalculationCreate) -> Calculation:
    breakdown = compute_breakdown(data)
    total = round(sum(breakdown.values()), 2)

    calculation = Calculation(
        user_id=data.user_id,
        label=data.label,
        input_data=data.model_dump(),
        breakdown=breakdown,
        total_co2eq_kg=total,
    )
    db.add(calculation)
    db.commit()
    db.refresh(calculation)
    return calculation


def get_user_calculations(db: Session, user_id: int):
    return (
        db.query(Calculation)
        .filter(Calculation.user_id == user_id)
        .order_by(Calculation.created_at.desc())
        .all()
    )


def get_calculation(db: Session, calculation_id: int):
    return db.query(Calculation).filter(Calculation.id == calculation_id).first()