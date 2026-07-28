const API_BASE = "https://carbon-footprint-calculator-nqv9.onrender.com";

const session = typeof getSession === "function" ? getSession() : null;
if (!session) window.location.href = "connexion.html";

if (session) {
  const user = session.user || session;
const fullName = user.full_name || user.name || "";
const firstName = fullName.trim().split(/\s+/)[0] || "Utilisateur";

document.getElementById("accountName").textContent = firstName;
  document.getElementById("accountAvatar").textContent = session.full_name
    .split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

document.getElementById("accountTrigger")?.addEventListener("click", () => {
  document.getElementById("accountDropdown").classList.toggle("hidden");
});
document.addEventListener("click", (e) => {
  if (!document.getElementById("accountMenu").contains(e.target)) {
    document.getElementById("accountDropdown").classList.add("hidden");
  }
});

function doLogout() {
  clearSession();
  window.location.href = "index.html";
}
document.getElementById("logoutBtn")?.addEventListener("click", doLogout);
document.getElementById("logoutBtn2")?.addEventListener("click", doLogout);

// ---------- Historique ----------

const historyModal = document.getElementById("historyModal");
const historyBody = document.getElementById("historyBody");

function openHistoryModal() {
  historyModal.classList.remove("hidden");
  historyBody.innerHTML = '<p class="results-placeholder">Chargement…</p>';
  fetch(`${API_BASE}/calculations/user/${session.id}`)
    .then((res) => {
      if (!res.ok) throw new Error("Impossible de charger l'historique.");
      return res.json();
    })
    .then(renderHistory)
    .catch((err) => {
      historyBody.innerHTML = `<p class="results-placeholder">${err.message}</p>`;
    });
}

function renderHistory(items) {
  if (!items.length) {
    historyBody.innerHTML = '<p class="results-placeholder">Aucun calcul enregistré pour le moment.</p>';
    return;
  }
  historyBody.innerHTML = items.map((item) => {
    const date = new Date(item.created_at).toLocaleDateString("fr-FR");
    return `
      <div class="history-item">
        <div>
          <div class="history-item__label">${item.label || "Calcul sans nom"}</div>
          <div class="history-item__meta">${date}</div>
        </div>
        <div class="history-item__total">${(item.total_co2eq_kg / 1000).toFixed(2)} tCO₂e</div>
        <div class="history-item__actions">
  <button type="button" onclick="downloadReport(${item.id}, 'pdf')">
    PDF
  </button>

  <button type="button" onclick="downloadReport(${item.id}, 'excel')">
    Excel
  </button>
</div>
      </div>`;
  }).join("");
}

function closeHistoryModal() {
  historyModal.classList.add("hidden");
}

document.getElementById("historyLink")?.addEventListener("click", (e) => {
  e.preventDefault();
  openHistoryModal();
});
document.getElementById("historyCloseBtn")?.addEventListener("click", closeHistoryModal);
document.getElementById("historyBackdrop")?.addEventListener("click", closeHistoryModal);

// ---------- Questions (une à la fois, façon Nos Gestes Climat) ----------

const CATEGORY_LABELS = {
  logement: { individu: "Logement", entreprise: "Locaux", projet: "Installations" },
  transport: "Transport",
  industrie: { individu: "Industrie", entreprise: "Production", projet: "Matériaux" },
  alimentation: "Alimentation",
  dechets: "Déchets",
};

const ICONS = {
  building_type: '<path d="M4 11 L12 4 L20 11 V20 H4 Z"/><path d="M10 20v-6h4v6"/>',
  surface_m2: '<path d="M4 11 L12 4 L20 11 V20 H4 Z"/><path d="M10 20v-6h4v6"/>',
  household_size: '<circle cx="9" cy="7" r="3"/><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/><circle cx="17" cy="8" r="2.5"/><path d="M15 21v-1a4 4 0 0 0-1-2.6"/>',
  equipment: '<rect x="4" y="7" width="16" height="10" rx="2"/><path d="M9 7V4M15 7V4"/>',
  electricity_kwh: '<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="3"/>',
  has_gaz: '<path d="M12 3c-4 4-7 8-7 12a7 7 0 0 0 14 0c0-4-3-8-7-12z"/>',
  gaz_naturel_m3: '<path d="M12 3c-4 4-7 8-7 12a7 7 0 0 0 14 0c0-4-3-8-7-12z"/>',
  has_gpl: '<path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12z"/>',
  gpl_litres: '<path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12z"/>',
  has_car: '<rect x="3" y="10" width="18" height="8" rx="2"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/>',
  motorisation: '<rect x="3" y="10" width="18" height="8" rx="2"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/>',
  car_fuel: '<rect x="3" y="10" width="18" height="8" rx="2"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/>',
  voiture_km: '<rect x="3" y="10" width="18" height="8" rx="2"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/>',
  occupants: '<circle cx="9" cy="7" r="3"/><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/><circle cx="17" cy="8" r="2.5"/><path d="M15 21v-1a4 4 0 0 0-1-2.6"/>',
  has_moto: '<circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M8.5 17h7M11 17l2-5h3l2 4M9 12H6l-1 3"/>',
  moto_km: '<circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M8.5 17h7M11 17l2-5h3l2 4M9 12H6l-1 3"/>',
  essence_litres: '<path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12z"/>',
  diesel_litres: '<path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12z"/>',
  has_bus: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 14h16M8 18v2M16 18v2"/>',
  bus_km: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 14h16M8 18v2M16 18v2"/>',
  has_train: '<rect x="5" y="5" width="14" height="12" rx="2"/><path d="M5 13h14M9 21l-2-4M15 21l2-4"/>',
  train_km: '<rect x="5" y="5" width="14" height="12" rx="2"/><path d="M5 13h14M9 21l-2-4M15 21l2-4"/>',
  has_plane: '<path d="M2 12l8-3 3-8 2 1-2 7 7 2v2l-7-1-2 7-2 1-1-7-8-1z"/>',
  avion_km: '<path d="M2 12l8-3 3-8 2 1-2 7 7 2v2l-7-1-2 7-2 1-1-7-8-1z"/>',
  quantite_produite: '<rect x="4" y="8" width="16" height="13"/><path d="M9 21V13h6v8"/><path d="M4 8l8-5 8 5"/>',
  fleet_size: '<rect x="3" y="10" width="18" height="8" rx="2"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/>',
  diet_type: '<path d="M12 2c-4 4-7 8-7 12a7 7 0 0 0 14 0c0-4-3-8-7-12z"/>',
  waste_non_trie: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
  waste_habits: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
  waste_trie: '<path d="M4 4l16 16M20 4L4 20"/><circle cx="12" cy="12" r="9"/>',
};

// pick() resolves a field that may be either a plain value (same for every profile)
// or an object keyed by profile ({individu, entreprise, projet}) — arrays and plain
// strings/numbers pass through untouched.
function pick(value, profileType) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return value;
  return value[profileType] ?? value.individu;
}

const QUESTIONS = [
  { id: "building_type", category: "logement", type: "choice",
    title: { individu: "Quel type de logement habitez-vous ?", entreprise: "Quel type de locaux votre entreprise occupe-t-elle ?", projet: "Quel type d'installation utilise votre projet ?" },
    subtitle: "Cela nous aide à proposer une consommation de départ réaliste.", default: "appartement",
    options: {
      individu: [{ value: "appartement", label: "Appartement", emoji: "🏢" }, { value: "maison", label: "Maison individuelle", emoji: "🏠" }],
      entreprise: [{ value: "bureau", label: "Bureau", emoji: "🏢" }, { value: "commerce", label: "Commerce / atelier", emoji: "🏪" }, { value: "entrepot", label: "Entrepôt / usine", emoji: "🏭" }],
      projet: [{ value: "bureau", label: "Bureau de projet", emoji: "🏢" }, { value: "commerce", label: "Chantier / site", emoji: "🚧" }, { value: "entrepot", label: "Entrepôt de stockage", emoji: "🏭" }],
    } },
  { id: "surface_m2", category: "logement", type: "slider",
    title: { individu: "Quelle est la surface de votre logement ?", entreprise: "Quelle est la surface de vos locaux ?", projet: "Quelle est la surface des installations du projet ?" },
    subtitle: { individu: "Surface chauffée ou climatisée.", entreprise: "Surface chauffée ou climatisée de vos locaux.", projet: "Surface chauffée ou climatisée des installations." },
    unit: "m²",
    min: { individu: 20, entreprise: 20, projet: 20 }, max: { individu: 300, entreprise: 3000, projet: 3000 }, step: { individu: 5, entreprise: 10, projet: 10 },
    defaultFn: (a, profileType) => {
      if (profileType === "individu") return a.building_type === "maison" ? 120 : 70;
      return { bureau: 150, commerce: 250, entrepot: 600 }[a.building_type] || 200;
    },
    presets: {
      individu: [{ label: "Studio", value: 35 }, { label: "1 chambre", value: 55 }, { label: "2 chambres", value: 80 }, { label: "3 chambres", value: 110 }, { label: "+4 chambres", value: 150 }],
      entreprise: [{ label: "Petit local", value: 80 }, { label: "Moyen", value: 250 }, { label: "Grand site", value: 800 }],
      projet: [{ label: "Petit site", value: 80 }, { label: "Moyen", value: 250 }, { label: "Grand chantier", value: 800 }],
    } },
  { id: "household_size", category: "logement", type: "slider", showIf: (a, ctx) => ctx.profileType === "individu",
    title: "Combien de personnes vivent dans votre foyer (vous inclus) ?",
    subtitle: "Cela permet de répartir équitablement l'empreinte de votre logement entre les personnes qui le partagent.",
    unit: "personne(s)", min: 1, max: 12, step: 1, default: 1,
    presets: [{ label: "Seul", value: 1 }, { label: "Couple", value: 2 }, { label: "Famille", value: 4 }, { label: "Grand foyer", value: 6 }] },
  { id: "equipment", category: "logement", type: "multichoice", showIf: (a, ctx) => ctx.profileType === "individu",
    title: "Quels équipements possédez-vous dans votre logement ?",
    default: [],
    options: [
      { value: "clim", label: "Climatisation", emoji: "❄️" },
      { value: "chauffe_eau_elec", label: "Chauffe-eau électrique", emoji: "🚿" },
      { value: "solaire", label: "Panneaux solaires photovoltaïques", emoji: "☀️" },
      { value: "none", label: "Aucun", emoji: "❌", exclusive: true },
    ] },
  { id: "electricity_kwh", category: "logement", type: "slider",
    title: { individu: "Quelle est votre consommation annuelle d'électricité ?", entreprise: "Quelle est la consommation électrique annuelle de vos locaux ?", projet: "Quelle est la consommation électrique annuelle des installations ?" },
    unit: "kWh",
    min: 0, max: { individu: 8000, entreprise: 100000, projet: 100000 }, step: { individu: 100, entreprise: 500, projet: 500 },
    defaultFn: (a, profileType) => {
      if (profileType !== "individu") return { bureau: 8000, commerce: 20000, entrepot: 40000 }[a.building_type] || 15000;
      let base = a.building_type === "maison" ? 3500 : 1800;
      const eq = a.equipment || [];
      if (eq.includes("clim")) base += 900;
      if (eq.includes("chauffe_eau_elec")) base += 700;
      if (eq.includes("solaire")) base = Math.round(base * 0.6);
      return base;
    },
    presets: {
      individu: [{ label: "Faible", value: 1200 }, { label: "Moyenne", value: 2500 }, { label: "Élevée", value: 5000 }],
      entreprise: [{ label: "Petite structure", value: 5000 }, { label: "Moyenne", value: 20000 }, { label: "Grande", value: 50000 }],
      projet: [{ label: "Petite installation", value: 5000 }, { label: "Moyenne", value: 20000 }, { label: "Grande", value: 50000 }],
    } },
  { id: "has_gaz", category: "logement", type: "bool",
    title: { individu: "Votre logement est-il raccordé au gaz naturel de ville ?", entreprise: "Vos locaux sont-ils raccordés au gaz naturel (chauffage, process) ?", projet: "Les installations sont-elles raccordées au gaz naturel ?" },
    default: false, resets: ["gaz_naturel_m3"] },
  { id: "gaz_naturel_m3", category: "logement", type: "slider", showIf: (a) => a.has_gaz,
    title: "Quelle est la consommation annuelle de gaz naturel ?", unit: "m³",
    min: 0, max: { individu: 1500, entreprise: 15000, projet: 15000 }, step: { individu: 25, entreprise: 100, projet: 100 },
    default: { individu: 300, entreprise: 1500, projet: 1500 },
    presets: {
      individu: [{ label: "Faible", value: 150 }, { label: "Moyenne", value: 400 }, { label: "Élevée", value: 800 }],
      entreprise: [{ label: "Faible", value: 500 }, { label: "Moyenne", value: 2000 }, { label: "Élevée", value: 6000 }],
      projet: [{ label: "Faible", value: 500 }, { label: "Moyenne", value: 2000 }, { label: "Élevée", value: 6000 }],
    } },
  { id: "has_gpl", category: "logement", type: "bool",
    title: { individu: "Utilisez-vous des bombonnes de GPL pour la cuisine ?", entreprise: "Votre activité utilise-t-elle des bombonnes de GPL ?", projet: "Le projet utilise-t-il des bombonnes de GPL ?" },
    default: false, resets: ["gpl_litres"] },
  { id: "gpl_litres", category: "logement", type: "slider", showIf: (a) => a.has_gpl,
    title: "Combien de litres de GPL sont utilisés par an ?", unit: "L",
    min: 0, max: { individu: 400, entreprise: 3000, projet: 3000 }, step: { individu: 10, entreprise: 20, projet: 20 },
    default: { individu: 60, entreprise: 300, projet: 300 },
    presets: {
      individu: [{ label: "Faible", value: 30 }, { label: "Moyenne", value: 80 }, { label: "Élevée", value: 150 }],
      entreprise: [{ label: "Faible", value: 100 }, { label: "Moyenne", value: 400 }, { label: "Élevée", value: 1000 }],
      projet: [{ label: "Faible", value: 100 }, { label: "Moyenne", value: 400 }, { label: "Élevée", value: 1000 }],
    } },

  { id: "has_car", category: "transport", type: "bool",
    title: { individu: "Possédez-vous un véhicule personnel ?", entreprise: "L'entreprise dispose-t-elle d'un véhicule ou d'une flotte ?", projet: "Le projet dispose-t-il d'un véhicule ou d'engins motorisés ?" },
    default: false, resets: ["motorisation", "fleet_size", "occupants", "voiture_km", "essence_litres", "diesel_litres"] },
  { id: "fleet_size", category: "transport", type: "choice", showIf: (a, ctx) => a.has_car && ctx.profileType !== "individu",
    title: { entreprise: "Combien de véhicules compte la flotte de l'entreprise ?", projet: "Combien de véhicules/engins sont affectés au projet ?" },
    default: "1",
    options: [{ value: "1", label: "1 véhicule", emoji: "🚗" }, { value: "2-5", label: "2 à 5 véhicules", emoji: "🚙" }, { value: "6-15", label: "6 à 15 véhicules", emoji: "🚐" }, { value: "15+", label: "Plus de 15 véhicules", emoji: "🚛" }] },
  { id: "motorisation", category: "transport", type: "choice", showIf: (a) => a.has_car,
    title: { individu: "Quel est le type de motorisation de votre véhicule ?", entreprise: "Quel est le type de motorisation principal de la flotte ?", projet: "Quel est le type de motorisation principal des véhicules/engins ?" },
    subtitle: {
      individu: "En Tunisie, l'électricité provient majoritairement du gaz naturel : une voiture électrique reste avantageuse mais n'est pas neutre en carbone.",
      entreprise: "En Tunisie, l'électricité provient majoritairement du gaz naturel : un véhicule électrique reste avantageux mais n'est pas neutre en carbone.",
      projet: "En Tunisie, l'électricité provient majoritairement du gaz naturel : un véhicule électrique reste avantageux mais n'est pas neutre en carbone.",
    },
    default: "thermique",
    options: [{ value: "thermique", label: "Thermique (essence/diesel)", emoji: "⛽" }, { value: "hybride", label: "Hybride", emoji: "🔋" }, { value: "electrique", label: "Électrique", emoji: "🔌" }] },
  { id: "car_fuel", category: "transport", type: "choice", showIf: (a) => a.has_car && a.motorisation === "thermique",
    title: { individu: "Quel carburant utilise votre véhicule ?", entreprise: "Quel carburant utilise la flotte ?", projet: "Quel carburant utilisent les véhicules/engins ?" },
    default: "essence", options: [{ value: "essence", label: "Essence", emoji: "⛽" }, { value: "diesel", label: "Diesel", emoji: "🛢️" }] },
  { id: "voiture_km", category: "transport", type: "slider", showIf: (a) => a.has_car,
    title: { individu: "Combien de kilomètres parcourez-vous en voiture par an ?", entreprise: "Combien de kilomètres la flotte parcourt-elle au total par an ?", projet: "Combien de kilomètres les véhicules/engins parcourent-ils au total par an ?" },
    unit: "km",
    min: 0, max: { individu: 35000, entreprise: 500000, projet: 500000 }, step: { individu: 500, entreprise: 1000, projet: 1000 },
    defaultFn: (a, profileType) => {
      if (profileType === "individu") return 8000;
      return { "1": 12000, "2-5": 40000, "6-15": 120000, "15+": 300000 }[a.fleet_size] || 12000;
    },
    presets: {
      individu: [{ label: "Peu", value: 3000 }, { label: "Moyen", value: 10000 }, { label: "Beaucoup", value: 20000 }],
      entreprise: [{ label: "Petite flotte", value: 15000 }, { label: "Flotte moyenne", value: 60000 }, { label: "Grande flotte", value: 200000 }],
      projet: [{ label: "Petit chantier", value: 15000 }, { label: "Moyen", value: 60000 }, { label: "Grand chantier", value: 200000 }],
    } },
  { id: "occupants", category: "transport", type: "slider", showIf: (a, ctx) => a.has_car && ctx.profileType === "individu",
    title: "En moyenne, combien de personnes voyagent dans la voiture (vous inclus) ?",
    subtitle: "Le covoiturage partage votre part personnelle de l'empreinte du trajet.",
    unit: "personne(s)", min: 1, max: 6, step: 1, default: 1,
    presets: [{ label: "Seul", value: 1 }, { label: "À deux", value: 2 }, { label: "Covoiturage", value: 3 }] },
  { id: "essence_litres", category: "transport", type: "slider", showIf: (a) => a.has_car && a.motorisation === "thermique" && a.car_fuel === "essence",
    title: { individu: "Combien de litres d'essence consommez-vous par an ?", entreprise: "Combien de litres d'essence la flotte consomme-t-elle par an ?", projet: "Combien de litres d'essence les véhicules consomment-ils par an ?" },
    unit: "L",
    min: 0, max: { individu: 2500, entreprise: 40000, projet: 40000 }, step: { individu: 25, entreprise: 100, projet: 100 },
    default: { individu: 600, entreprise: 3500, projet: 3500 },
    presets: {
      individu: [{ label: "Peu", value: 300 }, { label: "Moyen", value: 800 }, { label: "Beaucoup", value: 1500 }],
      entreprise: [{ label: "Peu", value: 1500 }, { label: "Moyen", value: 5000 }, { label: "Beaucoup", value: 15000 }],
      projet: [{ label: "Peu", value: 1500 }, { label: "Moyen", value: 5000 }, { label: "Beaucoup", value: 15000 }],
    } },
  { id: "diesel_litres", category: "transport", type: "slider", showIf: (a) => a.has_car && a.motorisation === "thermique" && a.car_fuel === "diesel",
    title: { individu: "Combien de litres de diesel consommez-vous par an ?", entreprise: "Combien de litres de diesel la flotte consomme-t-elle par an ?", projet: "Combien de litres de diesel les véhicules/engins consomment-ils par an ?" },
    unit: "L",
    min: 0, max: { individu: 2500, entreprise: 40000, projet: 40000 }, step: { individu: 25, entreprise: 100, projet: 100 },
    default: { individu: 700, entreprise: 4000, projet: 4000 },
    presets: {
      individu: [{ label: "Peu", value: 350 }, { label: "Moyen", value: 900 }, { label: "Beaucoup", value: 1600 }],
      entreprise: [{ label: "Peu", value: 1800 }, { label: "Moyen", value: 6000 }, { label: "Beaucoup", value: 18000 }],
      projet: [{ label: "Peu", value: 1800 }, { label: "Moyen", value: 6000 }, { label: "Beaucoup", value: 18000 }],
    } },
  { id: "has_moto", category: "transport", type: "bool", showIf: (a, ctx) => ctx.profileType === "individu",
    title: "Utilisez-vous un scooter ou une moto ?",
    default: false, resets: ["moto_km"] },
  { id: "moto_km", category: "transport", type: "slider", showIf: (a) => a.has_moto,
    title: "Combien de kilomètres parcourez-vous en scooter/moto par an ?",
    unit: "km", min: 0, max: 15000, step: 250, default: 3000,
    presets: [{ label: "Peu", value: 1000 }, { label: "Moyen", value: 4000 }, { label: "Beaucoup", value: 8000 }] },
  { id: "has_bus", category: "transport", type: "bool",
    title: { individu: "Utilisez-vous les transports en commun (bus, métro léger) ?", entreprise: "Vos employés utilisent-ils les transports en commun pour des déplacements professionnels ?", projet: "L'équipe utilise-t-elle les transports en commun pour le projet ?" },
    default: false, resets: ["bus_km"] },
  { id: "bus_km", category: "transport", type: "slider", showIf: (a) => a.has_bus,
    title: { individu: "Combien de kilomètres en bus/métro parcourez-vous par an ?", entreprise: "Combien de kilomètres en bus/métro pour les déplacements professionnels par an ?", projet: "Combien de kilomètres en bus/métro pour le projet par an ?" },
    unit: "km",
    min: 0, max: { individu: 12000, entreprise: 30000, projet: 30000 }, step: { individu: 250, entreprise: 250, projet: 250 },
    default: { individu: 1500, entreprise: 2500, projet: 2500 },
    presets: {
      individu: [{ label: "Peu", value: 500 }, { label: "Moyen", value: 2000 }, { label: "Beaucoup", value: 5000 }],
      entreprise: [{ label: "Peu", value: 1000 }, { label: "Moyen", value: 4000 }, { label: "Beaucoup", value: 10000 }],
      projet: [{ label: "Peu", value: 1000 }, { label: "Moyen", value: 4000 }, { label: "Beaucoup", value: 10000 }],
    } },
  { id: "has_train", category: "transport", type: "bool",
    title: { individu: "Prenez-vous le train ?", entreprise: "Vos employés voyagent-ils en train pour des missions professionnelles ?", projet: "L'équipe voyage-t-elle en train pour le projet ?" },
    default: false, resets: ["train_km"] },
  { id: "train_km", category: "transport", type: "slider", showIf: (a) => a.has_train,
    title: { individu: "Combien de kilomètres en train parcourez-vous par an ?", entreprise: "Combien de kilomètres en train pour les missions professionnelles par an ?", projet: "Combien de kilomètres en train pour le projet par an ?" },
    unit: "km",
    min: 0, max: { individu: 8000, entreprise: 20000, projet: 20000 }, step: { individu: 100, entreprise: 200, projet: 200 },
    default: { individu: 500, entreprise: 1000, projet: 1000 },
    presets: {
      individu: [{ label: "Peu", value: 200 }, { label: "Moyen", value: 800 }, { label: "Beaucoup", value: 2000 }],
      entreprise: [{ label: "Peu", value: 500 }, { label: "Moyen", value: 2000 }, { label: "Beaucoup", value: 6000 }],
      projet: [{ label: "Peu", value: 500 }, { label: "Moyen", value: 2000 }, { label: "Beaucoup", value: 6000 }],
    } },
  { id: "has_plane", category: "transport", type: "bool",
    title: { individu: "Avez-vous pris l'avion au cours des 12 derniers mois ?", entreprise: "Vos employés prennent-ils l'avion pour des missions professionnelles ?", projet: "L'équipe prend-elle l'avion pour le projet ?" },
    default: false, resets: ["avion_km"] },
  { id: "avion_km", category: "transport", type: "slider", showIf: (a) => a.has_plane,
    title: { individu: "Combien de kilomètres avez-vous parcourus en avion ?", entreprise: "Combien de kilomètres en avion pour les missions professionnelles par an ?", projet: "Combien de kilomètres en avion pour le projet par an ?" },
    subtitle: "Un aller-retour Tunis–Paris ≈ 3 000 km, Tunis–Istanbul ≈ 2 400 km.",
    unit: "km",
    min: 0, max: { individu: 20000, entreprise: 60000, projet: 60000 }, step: { individu: 250, entreprise: 250, projet: 250 },
    default: { individu: 3000, entreprise: 6000, projet: 6000 },
    presets: {
      individu: [{ label: "Court-courrier", value: 1500 }, { label: "Europe", value: 3000 }, { label: "Long-courrier", value: 9000 }],
      entreprise: [{ label: "Peu de missions", value: 3000 }, { label: "Régulier", value: 8000 }, { label: "Fréquent", value: 20000 }],
      projet: [{ label: "Peu de missions", value: 3000 }, { label: "Régulier", value: 8000 }, { label: "Fréquent", value: 20000 }],
    } },

  { id: "quantite_produite", category: "industrie", type: "slider", showIf: (a, ctx) => ctx.profileType !== "individu",
    title: { entreprise: "Quel est le volume de production ou de service annuel de l'entreprise ?", projet: "Quel est le volume de matériaux/production associé au projet ?" },
    subtitle: { entreprise: "Unités produites ou prestations réalisées par an.", projet: "Unités de matériaux ou de production utilisées par le projet." },
    unit: "unités", min: 0, max: 2000, step: 10, default: 50,
    presets: [{ label: "Faible", value: 20 }, { label: "Moyen", value: 100 }, { label: "Élevé", value: 500 }] },

  { id: "diet_type", category: "alimentation", type: "choice", showIf: (a, ctx) => ctx.profileType === "individu",
    title: "Quel est votre régime alimentaire habituel ?", default: "omnivore", columns: 1,
    options: [
      { value: "omnivore", label: "Viande à chaque repas", emoji: "🍖" },
      { value: "flexitarien", label: "Flexitarien (viande occasionnelle)", emoji: "🍗" },
      { value: "vegetarien", label: "Végétarien", emoji: "🥗" },
      { value: "vegan", label: "Végan", emoji: "🌱" },
    ] },

  { id: "waste_habits", category: "dechets", type: "multichoice",
    title: { individu: "Que faites-vous pour limiter le poids de votre poubelle ?", entreprise: "Que fait l'entreprise pour limiter ses déchets ?", projet: "Que fait le projet pour limiter ses déchets ?" },
    default: [],
    options: {
      individu: [
        { value: "compost", label: "Je composte", emoji: "🌱" },
        { value: "no_waste", label: "Je ne gaspille pas d'aliments", emoji: "🍽️" },
        { value: "bulk", label: "J'achète en vrac", emoji: "🛍️" },
        { value: "none", label: "Aucun", emoji: "❌", exclusive: true },
      ],
      entreprise: [
        { value: "compost", label: "Tri sélectif systématique", emoji: "♻️" },
        { value: "no_waste", label: "Réduction des emballages", emoji: "📦" },
        { value: "bulk", label: "Filière de recyclage dédiée", emoji: "🔄" },
        { value: "none", label: "Aucun", emoji: "❌", exclusive: true },
      ],
      projet: [
        { value: "compost", label: "Tri sélectif sur site", emoji: "♻️" },
        { value: "no_waste", label: "Réduction des chutes/déchets de chantier", emoji: "📦" },
        { value: "bulk", label: "Filière de recyclage dédiée", emoji: "🔄" },
        { value: "none", label: "Aucun", emoji: "❌", exclusive: true },
      ],
    } },
  { id: "waste_non_trie", category: "dechets", type: "slider",
    title: { individu: "Combien de déchets non triés produisez-vous par semaine ?", entreprise: "Combien de déchets d'activité non triés par semaine ?", projet: "Combien de déchets de chantier non triés par semaine ?" },
    unit: "kg/sem.",
    min: 0, max: { individu: 25, entreprise: 300, projet: 300 }, step: { individu: 0.5, entreprise: 1, projet: 1 },
    defaultFn: (a, profileType) => {
      const habitCount = (a.waste_habits || []).filter((h) => h !== "none").length;
      const base = profileType === "individu" ? 5 : 30;
      const step = profileType === "individu" ? 1.2 : 7;
      const floor = profileType === "individu" ? 1.5 : 8;
      return Math.max(floor, base - habitCount * step);
    },
    presets: {
      individu: [{ label: "Peu", value: 2 }, { label: "Moyen", value: 5 }, { label: "Beaucoup", value: 10 }],
      entreprise: [{ label: "Peu", value: 10 }, { label: "Moyen", value: 30 }, { label: "Beaucoup", value: 80 }],
      projet: [{ label: "Peu", value: 10 }, { label: "Moyen", value: 30 }, { label: "Beaucoup", value: 80 }],
    } },
  { id: "waste_trie", category: "dechets", type: "slider",
    title: { individu: "Combien de déchets triés/recyclés produisez-vous par semaine ?", entreprise: "Combien de déchets d'activité triés/recyclés par semaine ?", projet: "Combien de déchets de chantier triés/recyclés par semaine ?" },
    unit: "kg/sem.",
    min: 0, max: { individu: 15, entreprise: 150, projet: 150 }, step: { individu: 0.5, entreprise: 1, projet: 1 },
    default: { individu: 2, entreprise: 12, projet: 12 },
    presets: {
      individu: [{ label: "Peu", value: 1 }, { label: "Moyen", value: 3 }, { label: "Beaucoup", value: 6 }],
      entreprise: [{ label: "Peu", value: 5 }, { label: "Moyen", value: 15 }, { label: "Beaucoup", value: 35 }],
      projet: [{ label: "Peu", value: 5 }, { label: "Moyen", value: 15 }, { label: "Beaucoup", value: 35 }],
    } },
];

function makeInitialAnswers() {
  return {
    building_type: "appartement", surface_m2: 0, household_size: 1, equipment: [], electricity_kwh: 0,
    has_gaz: false, gaz_naturel_m3: 0, has_gpl: false, gpl_litres: 0,
    has_car: false, fleet_size: "1", motorisation: "thermique", car_fuel: "essence", occupants: 1, voiture_km: 0, essence_litres: 0, diesel_litres: 0,
    has_moto: false, moto_km: 0,
    has_bus: false, bus_km: 0, has_train: false, train_km: 0, has_plane: false, avion_km: 0,
    quantite_produite: 0, diet_type: null, waste_habits: [], waste_non_trie: 0, waste_trie: 0,
  };
}

const answers = makeInitialAnswers();

let profileType = "individu";
let currentIndex = 0;
let calculationDone = false;
let resultsShown = false;
let currentSliderValidator = null;

function getVisibleQuestions() {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers, { profileType }));
}

document.querySelectorAll(".profile-toggle__btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".profile-toggle__btn").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    profileType = btn.dataset.value;
    Object.assign(answers, makeInitialAnswers());
    answers.diet_type = profileType === "individu" ? null : "sans_objet";
    currentIndex = 0;
    resultsShown = false;
    calculationDone = false;
    render();
    updateLivePreview();
  });
});

const progressBar = document.getElementById("progressBar");
const recapProgress = document.getElementById("recapProgress");
const stepperEl = document.getElementById("stepper");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const questionCard = document.getElementById("questionCard");
const resultsCardEl = document.getElementById("resultsCard");

function renderStepper(currentCategory) {
  const order = [];
  getVisibleQuestions().forEach((q) => { if (!order.includes(q.category)) order.push(q.category); });
  const currentPos = order.indexOf(currentCategory);
  stepperEl.innerHTML = order.map((cat, i) => {
    const state = i < currentPos ? "done" : i === currentPos ? "active" : "";
    return `<div class="stepper__item stepper__item--${state}">
      <span class="stepper__circle">${i < currentPos ? "✓" : i + 1}</span>
      <span class="stepper__label">${pick(CATEGORY_LABELS[cat], profileType)}</span>
    </div>`;
  }).join("");
}

function questionIcon(id) {
  return `<div class="wizard-question__icon-chip"><svg class="q-card__icon" viewBox="0 0 24 24">${ICONS[id] || ""}</svg></div>`;
}

function renderQuestionBody(q) {
  const subtitle = q.subtitle ? `<p class="wizard-question__subtitle">${q.subtitle}</p>` : "";

  if (q.type === "bool") {
    const current = answers[q.id];
    return `
      <div class="wizard-question__header">${questionIcon(q.id)}<h2>${q.title}</h2></div>
      ${subtitle}
      <div class="bool-choice">
        <button type="button" class="bool-choice__btn ${current === true ? "is-active" : ""}" data-value="true">Oui</button>
        <button type="button" class="bool-choice__btn ${current === false ? "is-active" : ""}" data-value="false">Non</button>
      </div>`;
  }

  if (q.type === "choice") {
    const current = answers[q.id];
    return `
      <div class="wizard-question__header">${questionIcon(q.id)}<h2>${q.title}</h2></div>
      ${subtitle}
      <div class="choice-grid ${q.columns === 1 ? "choice-grid--1col" : ""}">
        ${q.options.map((o) => `
          <button type="button" class="choice-card ${current === o.value ? "is-active" : ""}" data-value="${o.value}">
            <span class="choice-card__emoji">${o.emoji}</span><span>${o.label}</span>
          </button>`).join("")}
      </div>`;
  }

  if (q.type === "multichoice") {
    const current = answers[q.id] || [];
    return `
      <div class="wizard-question__header">${questionIcon(q.id)}<h2>${q.title}</h2></div>
      ${subtitle}
      <div class="choice-grid">
        ${q.options.map((o) => `
          <button type="button" class="choice-card choice-card--check ${current.includes(o.value) ? "is-active" : ""}" data-value="${o.value}">
            <span class="choice-card__emoji">${o.emoji}</span><span>${o.label}</span>
          </button>`).join("")}
      </div>
      <button type="button" class="skip-link" id="skipLink">Je ne sais pas répondre</button>`;
  }

  // slider
  const value = answers[q.id];
  return `
    <div class="wizard-question__header">${questionIcon(q.id)}<h2>${q.title}</h2></div>
    ${subtitle}
    <div class="slider-block">
      <div class="slider-block__value">
        <input type="number" id="sliderNumber" min="0" step="${q.step}" value="${value}" inputmode="decimal">
        <span class="slider-block__unit">${q.unit}</span>
      </div>
      <p class="slider-block__hint">Vous connaissez le chiffre exact ? Tapez-le directement ci-dessus — aucune limite.</p>
      <input type="range" id="sliderRange" min="${q.min}" max="${q.max}" step="${q.step}" value="${value}">
      <div class="slider-block__presets">
        ${q.presets.map((p) => `<button type="button" class="preset-chip" data-value="${p.value}">${p.label}<small>${p.value} ${q.unit}</small></button>`).join("")}
      </div>
      <p class="field-error" id="fieldError"></p>
    </div>
    <button type="button" class="skip-link" id="skipLink">Je ne sais pas répondre — utiliser une valeur moyenne</button>`;
}

function wireQuestionEvents(q) {
  currentSliderValidator = null;

  if (q.type === "bool") {
    questionCard.querySelectorAll(".bool-choice__btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = btn.dataset.value === "true";
        answers[q.id] = value;
        if (!value && q.resets) {
          q.resets.forEach((fieldId) => {
            const current = answers[fieldId];
            if (typeof current === "boolean") answers[fieldId] = false;
            else if (typeof current === "string") answers[fieldId] = QUESTIONS.find((qq) => qq.id === fieldId)?.default ?? "";
            else if (Array.isArray(current)) answers[fieldId] = [];
            else answers[fieldId] = 0;
          });
        }
        updateLivePreview();
        goNext();
      });
    });
    return;
  }

  if (q.type === "choice") {
    questionCard.querySelectorAll(".choice-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        answers[q.id] = btn.dataset.value;
        updateLivePreview();
        goNext();
      });
    });
    return;
  }

  if (q.type === "multichoice") {
    questionCard.querySelectorAll(".choice-card--check").forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = btn.dataset.value;
        const opt = q.options.find((o) => o.value === value);
        let current = answers[q.id] || [];
        if (opt.exclusive) {
          current = current.includes(value) ? [] : [value];
        } else {
          current = current.includes(value) ? current.filter((v) => v !== value) : [...current.filter((v) => !q.options.find((o) => o.value === v)?.exclusive), value];
        }
        answers[q.id] = current;
        questionCard.querySelectorAll(".choice-card--check").forEach((b) => b.classList.toggle("is-active", current.includes(b.dataset.value)));
        updateLivePreview();
      });
    });
    document.getElementById("skipLink")?.addEventListener("click", goNext);
    return;
  }

  // slider
  const range = document.getElementById("sliderRange");
  const numberInput = document.getElementById("sliderNumber");
  const chips = questionCard.querySelectorAll(".preset-chip");
  const errorEl = document.getElementById("fieldError");

  function clearFieldError() {
    errorEl.textContent = "";
    numberInput.classList.remove("has-error");
  }

  function applyValue(value) {
    clearFieldError();
    answers[q.id] = value;
    numberInput.value = value;
    range.value = Math.min(q.max, Math.max(q.min, value)); // the drag handle can only show within its own physical bounds
    chips.forEach((chip) => chip.classList.toggle("is-active", Number(chip.dataset.value) === value));
    updateLivePreview();
  }
  function syncFromDrag(v) { applyValue(Math.min(q.max, Math.max(q.min, v))); }
  function syncFromTyped(v) { applyValue(v); } // no clamping at all — trust the exact value the user typed; min/empty is enforced by validation on "Suivant", not by silent correction

  range.addEventListener("input", () => syncFromDrag(Number(range.value)));
  numberInput.addEventListener("input", () => {
    clearFieldError();
    const raw = numberInput.value.trim();
    if (raw === "") {
      // let the field stay genuinely empty instead of forcing a value back in — validated on "Suivant" instead
      answers[q.id] = null;
      chips.forEach((chip) => chip.classList.remove("is-active"));
      return;
    }
    const v = Number(raw);
    if (Number.isNaN(v)) return;
    syncFromTyped(v);
  });
  chips.forEach((chip) => chip.addEventListener("click", () => syncFromDrag(Number(chip.dataset.value))));
  document.getElementById("skipLink")?.addEventListener("click", () => {
    applyValue(q.resolvedDefault);
    goNext();
  });
  applyValue(answers[q.id]);

  currentSliderValidator = () => {
    const value = answers[q.id];
    if (value === null || value === undefined || Number.isNaN(value)) {
      errorEl.textContent = "Veuillez remplir ce champ.";
      numberInput.classList.add("has-error");
      numberInput.focus();
      return false;
    }
    if (value < q.min) {
      errorEl.textContent = `La valeur minimale est ${q.min} ${q.unit}.`;
      numberInput.classList.add("has-error");
      numberInput.focus();
      return false;
    }
    return true;
  };
}

function resolveQuestion(q, profileType) {
  return {
    ...q,
    title: pick(q.title, profileType),
    subtitle: pick(q.subtitle, profileType),
    options: pick(q.options, profileType),
    presets: pick(q.presets, profileType),
    min: pick(q.min, profileType),
    max: pick(q.max, profileType),
    step: pick(q.step, profileType),
    default: pick(q.default, profileType),
  };
}

function renderQuestion() {
  const visible = getVisibleQuestions();
  const rawQ = visible[currentIndex];
  const q = resolveQuestion(rawQ, profileType);
  if (q.type === "slider") {
    q.resolvedDefault = rawQ.defaultFn ? rawQ.defaultFn(answers, profileType) : q.default;
    if (answers[q.id] === 0 || answers[q.id] === undefined || answers[q.id] === null) {
      answers[q.id] = q.resolvedDefault;
    }
  }
  if ((q.type === "choice" || q.type === "bool") && answers[q.id] === undefined) {
    answers[q.id] = q.default;
  }
  if (q.type === "multichoice" && !Array.isArray(answers[q.id])) {
    answers[q.id] = q.default || [];
  }

  questionCard.innerHTML = renderQuestionBody(q);
  wireQuestionEvents(q);

  renderStepper(q.category);
  progressBar.style.width = `${((currentIndex + 1) / visible.length) * 100}%`;
  recapProgress.textContent = `${currentIndex + 1} / ${visible.length}`;
  prevBtn.disabled = currentIndex === 0;
  nextBtn.textContent = currentIndex === visible.length - 1 ? "Calculer mon empreinte →" : "Suivant →";
}

function showResults() {
  resultsShown = true;
  questionCard.classList.add("hidden");
  resultsCardEl.classList.remove("hidden");
  progressBar.style.width = "100%";
  recapProgress.textContent = "Terminé";
  prevBtn.textContent = "↺ Nouveau calcul";
  prevBtn.disabled = false;
  nextBtn.textContent = "Terminer";
}

function render() {
  if (resultsShown) { showResults(); return; }
  questionCard.classList.remove("hidden");
  resultsCardEl.classList.add("hidden");
  prevBtn.textContent = "← Précédent";
  renderQuestion();
}

async function goNext() {
  if (resultsShown) { window.location.href = "index.html"; return; }
  if (currentSliderValidator && !currentSliderValidator()) return;
  const visible = getVisibleQuestions();
  if (currentIndex === visible.length - 1) {
    const ok = await submitCalculation();
    if (!ok) return;
    showResults();
    return;
  }
  currentIndex++;
  render();
}

nextBtn.addEventListener("click", goNext);

prevBtn.addEventListener("click", () => {
  if (resultsShown) { window.location.reload(); return; }
  if (currentIndex > 0) { currentIndex--; render(); }
});

document.getElementById("viewDetailBtn").addEventListener("click", () => {
  if (!calculationDone) return;
  showResults();
});

render();

// ---------- Calcul en direct (aperçu) ----------

const FACTORS = {
  electricity_kwh: 0.483,
  gaz_naturel_m3: 2.181,
  gpl_litres: 1.86,
  essence_litres: 2.377,
  diesel_litres: 2.615,
  building_m2: 15.0,
  industry_unit: 500.0,
  transport_km: { voiture: 0.20, voiture_hybride: 0.14, voiture_electrique: 0.087, moto: 0.09, bus: 0.10, train: 0.04, avion: 0.25 },
  food_year: { omnivore: 2200, flexitarien: 1500, vegetarien: 1100, vegan: 900, sans_objet: 0 },
  waste_kg: { non_trie: 0.45, trie: 0.10 },
};

const CATEGORY_META = {
  electricity: { label: "Électricité", color: "#0F7A5C", advice: "Passez au LED et éteignez les appareils en veille." },
  fuel:        { label: "Carburant",   color: "#F5B93F", advice: "Réduisez les trajets courts en voiture, entretenez le moteur." },
  transport:   { label: "Transport",   color: "#3B82F6", advice: "Privilégiez le covoiturage, le bus ou le vélo quand c'est possible." },
  building:    { label: "Bâtiment",    color: "#7ADBA0", advice: "Améliorez l'isolation et limitez la climatisation excessive." },
  industry:    { label: "Industrie",   color: "#A855F7", advice: "Optimisez les procédés et l'efficacité énergétique des équipements." },
  food:        { label: "Alimentation",color: "#C17A4B", advice: "Réduisez la viande rouge, privilégiez les légumineuses et produits locaux." },
  waste:       { label: "Déchets",     color: "#94A3B8", advice: "Triez vos déchets et compostez les biodéchets quand c'est possible." },
};

function computeBreakdown(s) {
  const householdSize = Math.max(s.household_size || 1, 1);
  const occupants = Math.max(s.occupants || 1, 1);

  // Électricité, gaz et GPL sont une consommation partagée du foyer : on divise par le
  // nombre de personnes du foyer (même logique que le backend).
  const electricity = (s.electricity_kwh / householdSize) * FACTORS.electricity_kwh;
  const fuel = s.essence_litres * FACTORS.essence_litres
             + s.diesel_litres * FACTORS.diesel_litres
             + (s.gpl_litres / householdSize) * FACTORS.gpl_litres
             + (s.gaz_naturel_m3 / householdSize) * FACTORS.gaz_naturel_m3;
  const voitureFactor = s.motorisation === "electrique" ? FACTORS.transport_km.voiture_electrique
                       : s.motorisation === "hybride" ? FACTORS.transport_km.voiture_hybride
                       : FACTORS.transport_km.voiture;
  // Le covoiturage partage la part personnelle de la voiture ; la moto reste individuelle.
  const transport = (s.voiture_km * voitureFactor) / occupants
                   + (s.moto_km || 0) * FACTORS.transport_km.moto
                   + s.bus_km * FACTORS.transport_km.bus
                   + s.train_km * FACTORS.transport_km.train
                   + s.avion_km * FACTORS.transport_km.avion;
  const building = (s.surface_m2 / householdSize) * FACTORS.building_m2;
  const industry = s.quantite_produite * FACTORS.industry_unit;
  const food = FACTORS.food_year[s.diet_type] ?? 0;
  const waste = s.waste_non_trie * 52 * FACTORS.waste_kg.non_trie + s.waste_trie * 52 * FACTORS.waste_kg.trie;
  return { electricity, fuel, transport, building, industry, food, waste };
}

function renderDonut(svgEl, entries, total) {
  svgEl.innerHTML = '<circle cx="50" cy="50" r="40" fill="none" stroke="#EEF2EE" stroke-width="14"/>';
  if (total <= 0) return;
  const circumference = 2 * Math.PI * 40;
  let offset = 0;
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", "rotate(-90 50 50)");
  entries.forEach(([key, value]) => {
    if (value <= 0) return;
    const frac = value / total;
    const length = frac * circumference;
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "50"); circle.setAttribute("cy", "50"); circle.setAttribute("r", "40");
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", CATEGORY_META[key]?.color ?? "#999");
    circle.setAttribute("stroke-width", "14");
    circle.setAttribute("stroke-dasharray", `${length} ${circumference - length}`);
    circle.setAttribute("stroke-dashoffset", `${-offset}`);
    g.appendChild(circle);
    offset += length;
  });
  svgEl.appendChild(g);
}

function updateLivePreview() {
  const breakdown = computeBreakdown(answers);
  const entries = Object.entries(breakdown).filter(([, v]) => v > 0);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  document.getElementById("liveTotal").textContent = (total / 1000).toFixed(2);
  document.getElementById("recapSub").textContent = calculationDone ? "Calcul enregistré" : "Estimation partielle";
  document.getElementById("recapBadge").textContent = calculationDone ? "Terminé" : "En cours";

  renderDonut(document.getElementById("liveDonut"), entries, total);

  const legend = document.getElementById("liveLegend");
  const allKeys = ["electricity", "transport", "food", "waste", "fuel", "building", "industry"];
  legend.innerHTML = allKeys.map((key) => {
    const value = breakdown[key] || 0;
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return `<li><span><i class="dot" style="background:${CATEGORY_META[key].color}"></i>${CATEGORY_META[key].label}</span><b>${pct}%</b></li>`;
  }).join("");
}

updateLivePreview();

// ---------- Soumission finale ----------

async function submitCalculation() {
  nextBtn.disabled = true;
  const originalText = nextBtn.textContent;
  nextBtn.textContent = "Calcul en cours...";

  const payload = {
    user_id: session.id,
    label: document.getElementById("label").value.trim() || `Calcul du ${new Date().toLocaleDateString("fr-FR")}`,
    electricity: { consumption_kwh: answers.electricity_kwh },
    fuel: { essence_litres: answers.essence_litres, diesel_litres: answers.diesel_litres, gpl_litres: answers.gpl_litres, gaz_naturel_m3: answers.gaz_naturel_m3 },
    transport: { voiture_km: answers.voiture_km, motorisation: answers.motorisation, occupants: answers.occupants, moto_km: answers.moto_km, bus_km: answers.bus_km, train_km: answers.train_km, avion_km: answers.avion_km },
    building: { surface_m2: answers.surface_m2, household_size: answers.household_size },
    industry: { quantite_produite: answers.quantite_produite },
    food: { diet_type: answers.diet_type },
    waste: { non_trie_kg_semaine: answers.waste_non_trie, trie_kg_semaine: answers.waste_trie },
  };

  try {
    const res = await fetch(`${API_BASE}/calculations/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Le calcul a échoué. Vérifiez que le serveur tourne.");
    const data = await res.json();
    renderFinalResults(data);
    calculationDone = true;
    document.getElementById("viewDetailBtn").disabled = false;
    updateLivePreview();
    return true;
  } catch (err) {
    alert(err.message);
    return false;
  } finally {
    nextBtn.disabled = false;
    nextBtn.textContent = originalText;
  }
}

function renderFinalResults(data) {
  document.getElementById("resultsPlaceholder").classList.add("hidden");
  document.getElementById("resultsDetail").classList.remove("hidden");

  const entries = Object.entries(data.breakdown).filter(([, v]) => v > 0);
  const tbody = document.querySelector("#breakdownTable tbody");
  tbody.innerHTML = "";
  entries.forEach(([key, value]) => {
    const pct = ((value / data.total_co2eq_kg) * 100).toFixed(1);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${CATEGORY_META[key]?.label ?? key}</td><td>${value.toFixed(2)}</td><td>${pct}%</td>`;
    tbody.appendChild(tr);
  });

  const dominant = entries.sort((a, b) => b[1] - a[1])[0];
  document.getElementById("advice").textContent = dominant ? `💡 ${CATEGORY_META[dominant[0]]?.advice ?? ""}` : "";

  document.getElementById("downloadPdfBtn").href = `${API_BASE}/calculations/${data.id}/pdf`;
  document.getElementById("downloadExcelBtn").href = `${API_BASE}/calculations/${data.id}/excel`;
}

async function downloadReport(calculationId, type) {
  try {
    const response = await fetch(
      `${API_BASE}/calculations/${calculationId}/${type}`,
      {
        headers: {
          ...getAuthHeaders(),
        },
      }
    );

    if (response.status === 401) {
      clearSession();
      window.location.href = "connexion.html";
      return;
    }

    if (response.status === 403) {
      alert(
        "Vous n'avez pas accès à ce rapport."
      );
      return;
    }

    if (!response.ok) {
      throw new Error(
        "Impossible de télécharger le rapport."
      );
    }

    const blob =
      await response.blob();

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      type === "pdf"
        ? `rapport_empreinte_${calculationId}.pdf`
        : `empreinte_${calculationId}.xlsx`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);

  } catch (error) {
    alert(error.message);
  }
}