from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ElectricityInput(BaseModel):
    consumption_kwh: float = 0


class FuelInput(BaseModel):
    essence_litres: float = 0
    diesel_litres: float = 0
    gpl_litres: float = 0
    gaz_naturel_m3: float = 0


class TransportInput(BaseModel):
    voiture_km: float = 0
    motorisation: Literal["thermique", "hybride", "electrique"] = "thermique"
    occupants: float = 1  # personnes dans le véhicule (covoiturage) — divise la part personnelle
    moto_km: float = 0
    bus_km: float = 0
    train_km: float = 0
    avion_km: float = 0


class BuildingInput(BaseModel):
    surface_m2: float = 0
    household_size: float = 1  # personnes du foyer — divise l'allocation logement par personne


class IndustryInput(BaseModel):
    quantite_produite: float = 0


class FoodInput(BaseModel):
    diet_type: Literal["omnivore", "flexitarien", "vegetarien", "vegan", "sans_objet"] = "omnivore"


class WasteInput(BaseModel):
    non_trie_kg_semaine: float = 0
    trie_kg_semaine: float = 0


class CalculationCreate(BaseModel):
    user_id: int
    label: str | None = None
    electricity: ElectricityInput = ElectricityInput()
    fuel: FuelInput = FuelInput()
    transport: TransportInput = TransportInput()
    building: BuildingInput = BuildingInput()
    industry: IndustryInput = IndustryInput()
    food: FoodInput = FoodInput()
    waste: WasteInput = WasteInput()


class CalculationResponse(BaseModel):
    id: int
    user_id: int
    label: str | None
    breakdown: dict
    total_co2eq_kg: float
    created_at: datetime

    class Config:
        from_attributes = True