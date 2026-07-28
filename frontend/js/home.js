const session = typeof getSession === "function" ? getSession() : null;
const navActions = document.getElementById("navActions");

if (session && navActions) {
  const fullName = session.full_name || session.user?.full_name || "";
  const firstName = fullName.trim().split(/\s+/)[0] || "Utilisateur";

  navActions.innerHTML = `
    <span class="nav__user">Bonjour, ${firstName}</span>
    <button class="btn btn--outline" id="logoutBtn">Se déconnecter</button>
  `;

  document.getElementById("logoutBtn").addEventListener("click", () => {
    clearSession();
    window.location.reload();
  });
}

// Révélation au scroll
const revealEls = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("is-visible");
  });
}, { threshold: 0.15 });
revealEls.forEach((el) => observer.observe(el));

// Carte "Votre empreinte carbone" : count-up + donut animé + toggle période
// ponytail: deux jeux de données (annuel démo / mensuel = annuel÷12) tant qu'il n'y a pas
// d'historique multi-période côté API ; à brancher sur un vrai endpoint quand il existera.
const heroCard = document.getElementById("heroCard");
if (heroCard) {
  const CIRC = 251.2;
  const periods = {
    annuel: { value: 2.45, sub: "Empreinte totale", badge: "-12% vs année précédente", pct: { energie: 45, transport: 30, alimentation: 15, dechets: 10 } },
    mensuel: { value: 2.45 / 12, sub: "Empreinte du mois", badge: "-8% vs mois précédent", pct: { energie: 45, transport: 30, alimentation: 15, dechets: 10 } },
  };
  let currentPeriod = "annuel";
  let animated = false;

  const segs = {
    energie: document.getElementById("segEnergie"),
    transport: document.getElementById("segTransport"),
    alimentation: document.getElementById("segAlimentation"),
    dechets: document.getElementById("segDechets"),
  };
  const valueEl = document.getElementById("heroValue");
  const subEl = document.getElementById("heroSubLabel");
  const badgeEl = document.getElementById("heroBadge");
  const toggleBtn = document.getElementById("periodToggle");

  function render(period, { animateValue }) {
    const data = periods[period];
    subEl.textContent = data.sub;
    badgeEl.textContent = data.badge;

    let offset = 0;
    Object.entries(data.pct).forEach(([key, pct]) => {
      const len = (pct / 100) * CIRC;
      segs[key].style.strokeDasharray = `${len} ${CIRC - len}`;
      segs[key].style.strokeDashoffset = -offset;
      document.getElementById(`pct${key[0].toUpperCase()}${key.slice(1)}`).textContent = `${pct}%`;
      offset += len;
    });

    if (!animateValue) { valueEl.textContent = data.value.toFixed(2); return; }
    const start = performance.now();
    const from = parseFloat(valueEl.textContent) || 0;
    const to = data.value;
    function tick(now) {
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - t, 3);
      valueEl.textContent = (from + (to - from) * eased).toFixed(2);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        render(currentPeriod, { animateValue: true });
      }
    });
  }, { threshold: 0.3 });
  cardObserver.observe(heroCard);

  toggleBtn?.addEventListener("click", () => {
    currentPeriod = currentPeriod === "annuel" ? "mensuel" : "annuel";
    toggleBtn.textContent = `${currentPeriod === "annuel" ? "Annuel" : "Mensuel"} ▾`;
    render(currentPeriod, { animateValue: true });
  });
}

document.getElementById("loginBtn")?.addEventListener("click", () => {
  window.location.href = "connexion.html";
});
document.getElementById("signupBtn")?.addEventListener("click", () => {
  window.location.href = "inscription.html";
});

function handleStart() {
  if (!(typeof getSession === "function" && getSession())) {
    window.location.href = "connexion.html";
    return;
  }
  window.location.href = "calculateur.html";
}
document.getElementById("startBtn")?.addEventListener("click", handleStart);
document.getElementById("navCta")?.addEventListener("click", handleStart);

document.getElementById("demoBtn")?.addEventListener("click", () => {
  document.querySelector(".solution").scrollIntoView({ behavior: "smooth" });
});
document.getElementById("heroDetailBtn")?.addEventListener("click", handleStart);