"""
Facteurs d'émission (kgCO2eq par unité) utilisés par CarbonFootprint TN.

Principe de transparence : chaque ligne de SOURCES_TABLE porte une étiquette
d'origine — "Tunisie" quand la valeur vient d'une donnée mesurée/officielle pour
la Tunisie, "Référence internationale" quand aucune donnée tunisienne publique
n'existe et qu'on utilise la meilleure source disponible. Aucune valeur n'est
présentée comme tunisienne si elle ne l'est pas.

Ce qui est réellement tunisien à ce jour :
- Électricité : intensité carbone mesurée du réseau tunisien (STEG), 483 gCO2eq/kWh
  en 2025 — Ember / IEA / EIA, agrégées par Low-Carbon Power
  (https://lowcarbonpower.org/region/Tunisia).
- Essence, Diesel, Gaz naturel : facteurs officiels tirés du "Document d'inventaire
  national de GES" (NID Tunisie, Édition 2024, décembre 2024), soumis par la Tunisie
  à la CCNUCC (https://unfccc.int/sites/default/files/resource/National%20Inventory
  %20Report%20Tunisia%2030.12.2024.pdf). L'essence et le diesel utilisent un facteur
  "national basé sur des mesures de la STIR" (Société Tunisienne des Industries de
  Raffinage) ; le gaz naturel utilise un facteur Tier 2 spécifique au pays, recalculé
  chaque année selon le mix gaz tunisien (STEG) / gaz algérien importé (SOTUGAT).
  Voir _derive_kg_per_litre ci-dessous pour le détail du calcul.
- Voiture électrique : calculée à partir du facteur réseau tunisien ci-dessus
  (tunisienne "par construction", même si la consommation kWh/km retenue est une
  moyenne internationale).
- Déchets : le contexte tunisien du traitement (ANGed 2023 : 70 % des déchets
  ménagers finissent en décharge contrôlée, 20 % dans la nature, seulement 8 %
  recyclés) est documenté, mais il n'existe pas de facteur kgCO2/kg publié
  spécifiquement pour les décharges tunisiennes. La valeur retenue reste donc une
  référence internationale, probablement optimiste pour la Tunisie.
- Train : le réseau SNCFT n'étant pas électrifié (traction 100 % diesel), on
  écarte volontairement les facteurs "train électrique" (type TGV) au profit d'un
  facteur diesel — choix méthodologique tunisien, même si le chiffre numérique
  vient d'une référence française faute de mesure SNCFT publiée.

Point méthodologique important — périmètre "combustion" vs "cycle de vie" :
Les facteurs officiels tunisiens du NID (essence, diesel, gaz naturel) sont des
facteurs de COMBUSTION SEULE : c'est la règle des inventaires nationaux GIEC
(comptabilité territoriale — les émissions amont d'extraction/raffinage sont
comptées dans le pays où elles ont lieu, pas dans celui qui consomme le produit
raffiné). Le facteur électrique tunisien retenu plus haut (Ember/IEA/EIA), lui,
inclut le cycle de vie complet. Il y a donc une différence de périmètre entre ces
deux familles de facteurs, assumée et documentée ici plutôt que masquée : les
facteurs carburants tunisiens excluent l'amont (extraction, raffinage, transport
international), alors que le facteur électrique tunisien l'inclut. On a choisi de
privilégier la donnée officiellement tunisienne plutôt que d'ajouter une marge
amont française pour forcer une cohérence de périmètre artificielle.

Ce qui reste une référence internationale faute de donnée tunisienne publique :
GPL, alimentation, bâtiment, industrie, bus, avion. Pour le GPL, on utilise
cependant la même valeur par défaut IPCC 2006 que l'inventaire national tunisien
lui-même (le NID ne mesure pas de facteur GPL propre à la Tunisie).

Toutes les valeurs sont indicatives et destinées à un usage pédagogique. Le détail
de chaque source est repris dans SOURCES_TABLE, réutilisé tel quel dans le rapport
PDF et l'export Excel pour que l'utilisateur puisse vérifier chaque hypothèse.
"""


def _derive_kg_per_litre(fe_kg_per_tj: float, pci_mj_per_kg: float, density_kg_per_l: float) -> float:
    """Reproduit le calcul à partir des données brutes du NID Tunisie 2024 (Tableau 16
    "FE CO2 utilisés dans l'inventaire national de GES" + tableau des PCI, section 3.2).
    fe_kg_per_tj : facteur d'émission CO2 en kg par TJ (base calorifique nette).
    pci_mj_per_kg : pouvoir calorifique inférieur en MJ/kg (numériquement = TJ/Gg).
    density_kg_per_l : masse volumique du carburant (hypothèse standard, pas issue du NID)."""
    kg_co2_per_kg_fuel = (fe_kg_per_tj / 1_000_000) * pci_mj_per_kg
    return round(kg_co2_per_kg_fuel * density_kg_per_l, 3)


# --- Essence : FE = 71 879 kg/TJ (mesuré STIR), PCI = 44,380 MJ/kg [ONEM] ---
_ESSENCE_FACTOR = _derive_kg_per_litre(fe_kg_per_tj=71_879, pci_mj_per_kg=44.380, density_kg_per_l=0.745)
# --- Diesel : FE = 72 824 kg/TJ (mesuré STIR), PCI = 42,998 MJ/kg [ONEM] ---
_DIESEL_FACTOR = _derive_kg_per_litre(fe_kg_per_tj=72_824, pci_mj_per_kg=42.998, density_kg_per_l=0.835)
# --- Gaz naturel : FE = 57 725 kg/TJ (Tier 2 pays-spécifique 2022, mix STEG/SOTUGAT) ---
# PCI moyen national/importé 2021 : (37,564 + 38,008) / 2 MJ/Nm³ [STEG, SOTUGAT]
_GAZ_NATUREL_FACTOR = round((57_725 / 1_000_000) * ((37.564 + 38.008) / 2), 3)

# Électricité — intensité carbone mesurée du réseau tunisien (STEG, ~99 % gaz naturel)
# Source : Ember / IEA / EIA, agrégées par Low-Carbon Power, données 2025
# https://lowcarbonpower.org/region/Tunisia — 483 gCO2eq/kWh
ELECTRICITY_FACTOR_KG_PER_KWH = 0.483

FUEL_FACTORS_KG_PER_LITRE = {
    "essence": _ESSENCE_FACTOR,
    "diesel": _DIESEL_FACTOR,
    "gpl": 1.86,  # IPCC 2006 par défaut — valeur aussi utilisée telle quelle par le NID Tunisie
}

GAS_FACTOR_KG_PER_M3 = _GAZ_NATUREL_FACTOR

# Voiture électrique : 0,18 kWh/km (consommation moyenne d'un VE) x facteur réseau
# tunisien ci-dessus (0,483 kgCO2e/kWh) = 0,087 kgCO2e/km — tunisien par construction.
_EV_KWH_PER_KM = 0.18
_VOITURE_ELECTRIQUE_FACTOR = round(_EV_KWH_PER_KM * ELECTRICITY_FACTOR_KG_PER_KWH, 3)

TRANSPORT_FACTORS_KG_PER_KM = {
    "voiture": 0.20,                          # thermique (essence/diesel)
    "voiture_hybride": 0.14,                  # hybride non rechargeable, consommation réduite
    "voiture_electrique": _VOITURE_ELECTRIQUE_FACTOR,
    "moto": 0.09,                             # scooter/moto thermique, moyenne deux-roues motorisés
    "bus": 0.10,
    "train": 0.04,                            # réseau SNCFT non électrifié (traction diesel)
    "avion": 0.25,
}

BUILDING_FACTOR_KG_PER_M2_YEAR = 15.0
INDUSTRY_FACTOR_KG_PER_UNIT = 500.0

# Alimentation — empreinte annuelle moyenne par régime (kgCO2eq/an)
FOOD_FACTORS_KG_PER_YEAR = {
    "omnivore": 2200,      # viande à chaque repas
    "flexitarien": 1500,   # viande occasionnelle
    "vegetarien": 1100,
    "vegan": 900,
    "sans_objet": 0,       # profil Entreprise/Projet — l'alimentation individuelle ne s'applique pas
}

# Déchets — kg CO2eq par kg de déchet (saisie hebdomadaire x 52)
WASTE_FACTORS_KG_PER_KG = {
    "non_trie": 0.45,
    "trie": 0.10,
}

# Table de sources consolidée, affichée dans le rapport PDF et l'export Excel.
# (libellé, valeur affichée, origine, source détaillée)
TUNISIE = "Tunisie"
REF_INTL = "Référence internationale"

_fmt = lambda v: str(v).replace(".", ",")

SOURCES_TABLE = [
    ("Électricité", "0,483 kgCO2e/kWh", TUNISIE,
     "Ember / IEA / EIA (agrégées par Low-Carbon Power) — intensité carbone mesurée du réseau tunisien, 2025 : 483 gCO2eq/kWh, cycle de vie complet (lowcarbonpower.org/region/Tunisia)"),
    ("Essence", f"{_fmt(_ESSENCE_FACTOR)} kgCO2e/L", TUNISIE,
     "NID Tunisie, Édition 2024 (CCNUCC) — FE CO2 = 71 879 kg/TJ, facteur national basé sur des mesures de la STIR (Société Tunisienne des Industries de Raffinage) ; PCI = 44,380 MJ/kg [ONEM]. Combustion seule (hors amont extraction/raffinage/transport, par convention des inventaires nationaux GIEC) ; densité 0,745 kg/L retenue par hypothèse standard, non issue du NID"),
    ("Diesel", f"{_fmt(_DIESEL_FACTOR)} kgCO2e/L", TUNISIE,
     "NID Tunisie, Édition 2024 (CCNUCC) — FE CO2 = 72 824 kg/TJ, facteur national basé sur des mesures de la STIR ; PCI = 42,998 MJ/kg [ONEM]. Combustion seule (hors amont) ; densité 0,835 kg/L retenue par hypothèse standard, non issue du NID"),
    ("GPL", "1,86 kgCO2e/L", REF_INTL,
     "IPCC 2006 par défaut (63 100 kg/TJ) — c'est la même valeur par défaut que celle utilisée telle quelle dans le NID Tunisie 2024, faute de mesure nationale propre au GPL"),
    ("Gaz naturel", f"{_fmt(_GAZ_NATUREL_FACTOR)} kgCO2e/m³", TUNISIE,
     "NID Tunisie, Édition 2024 (CCNUCC) — FE CO2 = 57 725 kg/TJ (2022), facteur Tier 2 spécifique au pays recalculé chaque année selon le mix gaz tunisien [STEG] / gaz algérien importé [SOTUGAT] ; PCI moyen ≈ 37,8 MJ/Nm³ [STEG, SOTUGAT]. Combustion seule"),
    ("Voiture thermique", "0,20 kgCO2e/km", REF_INTL,
     "ADEME Base Carbone / Impact CO2 — voiture thermique moyenne, cycle de vie"),
    ("Voiture hybride", "0,14 kgCO2e/km", REF_INTL,
     "Estimation : ~70 % du facteur thermique (meilleure efficacité, hybride non rechargeable)"),
    ("Voiture électrique", f"{_fmt(_VOITURE_ELECTRIQUE_FACTOR)} kgCO2e/km", TUNISIE,
     f"Calculé à partir du facteur réseau tunisien ci-dessus : 0,18 kWh/km (consommation moyenne VE, référence internationale) x {_fmt(ELECTRICITY_FACTOR_KG_PER_KWH)} kgCO2e/kWh (réseau tunisien) — non neutre en carbone en Tunisie contrairement à des réseaux plus décarbonés"),
    ("Moto / scooter", "0,09 kgCO2e/km", REF_INTL,
     "ADEME Base Carbone / Impact CO2 — moyenne deux-roues motorisés thermiques"),
    ("Bus", "0,10 kgCO2e/km", REF_INTL,
     "ADEME Base Carbone — autobus urbain, moyenne par passager"),
    ("Train", "0,04 kgCO2e/km", TUNISIE,
     "Choix méthodologique tunisien : réseau SNCFT non électrifié (100 % traction diesel), donc facteur diesel retenu plutôt qu'un facteur train électrique type TGV ; valeur numérique par analogie avec les TER diesel français faute de mesure SNCFT publiée"),
    ("Avion", "0,25 kgCO2e/km", REF_INTL,
     "ADEME Base Carbone / Impact CO2 — vol moyen-courrier, moyenne par passager"),
    ("Bâtiment", "15 kgCO2e/m²/an", REF_INTL,
     "Estimation indicative : proxy simplifié pour l'enveloppe du bâtiment (carbone incorporé amorti, pertes non couvertes par les postes énergie) — pas de base ADEME dédiée ni de donnée tunisienne publiée"),
    ("Industrie", "500 kgCO2e/unité", REF_INTL,
     "Estimation générique par unité produite — à calibrer selon le secteur d'activité réel, pas de donnée sectorielle tunisienne disponible"),
    ("Alimentation", "900 à 2200 kgCO2e/an selon régime", REF_INTL,
     "ADEME / Carbone4 (Agribalyse) — empreinte alimentaire annuelle moyenne par régime, données françaises faute de données tunisiennes publiées"),
    ("Déchets", "0,10 à 0,45 kgCO2e/kg", REF_INTL,
     "ADEME Base Carbone — traitement des ordures ménagères (enfouissement/incinération vs. tri-recyclage), moyenne française. Contexte tunisien réel documenté (ANGed 2023) : 70 % des déchets ménagers finissent en décharge contrôlée, 20 % dans la nature, 8 % seulement recyclés — sans captage de méthane systématique documenté, contrairement au parc français pris en référence ici. La valeur retenue est donc probablement optimiste pour la Tunisie."),
]
