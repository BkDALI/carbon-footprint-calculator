const API_BASE = "https://carbon-footprint-calculator-nqv9.onrender.com";

const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    window.location.href = "connexion.html";
  });
}
const signupBtn = document.getElementById("signupBtn");
if (signupBtn) {
  signupBtn.addEventListener("click", () => {
    document.getElementById("fullName")?.focus();
  });
}

document.querySelectorAll(".field__toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-toggle-for");
    const input = document.getElementById(targetId);
    if (!input) return;
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    btn.setAttribute("aria-label", isHidden ? "Masquer le mot de passe" : "Afficher le mot de passe");
    btn.classList.toggle("is-active", isHidden);
  });
});

const passwordInput = document.getElementById("password");
const strengthEl = document.getElementById("pwStrength");

function computeStrength(value) {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value) && value.length >= 10) score++;
  return score;
}

if (passwordInput && strengthEl) {
  passwordInput.addEventListener("input", () => {
    const level = passwordInput.value ? Math.max(1, computeStrength(passwordInput.value)) : 0;
    strengthEl.setAttribute("data-level", passwordInput.value ? level : 0);
  });
}

const form = document.getElementById("signupForm");
const fullNameField = document.getElementById("fullNameField");
const emailField = document.getElementById("emailField");
const passwordField = document.getElementById("passwordField");
const confirmField = document.getElementById("confirmField");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const confirmInput = document.getElementById("confirmPassword");
const submitBtn = document.getElementById("submitBtn");
const formError = document.getElementById("formError");
const formErrorText = document.getElementById("formErrorText");
const formSuccess = document.getElementById("formSuccess");

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function setFieldError(fieldEl, hasError) {
  fieldEl.classList.toggle("has-error", hasError);
}
function hideBanners() {
  formError.classList.remove("is-visible");
  formSuccess.classList.remove("is-visible");
}
hideBanners();

function validate() {
  let valid = true;

  const nameOk = fullNameInput.value.trim().length >= 2;
  setFieldError(fullNameField, !nameOk);
  if (!nameOk) valid = false;

  const emailOk = isValidEmail(emailInput.value.trim());
  setFieldError(emailField, !emailOk);
  if (!emailOk) valid = false;

  const passwordOk = passwordInput.value.length >= 8;
  setFieldError(passwordField, !passwordOk);
  if (!passwordOk) valid = false;

  const confirmOk = passwordOk && confirmInput.value === passwordInput.value && confirmInput.value.length > 0;
  setFieldError(confirmField, !confirmOk);
  if (!confirmOk) valid = false;

  return valid;
}

function revalidateIfWasInvalid(input, fieldEl, isValidFn) {
  if (fieldEl.classList.contains("has-error") && isValidFn()) {
    setFieldError(fieldEl, false);
  }
}

fullNameInput.addEventListener("input", () => {
  revalidateIfWasInvalid(fullNameInput, fullNameField, () => fullNameInput.value.trim().length >= 2);
});
emailInput.addEventListener("input", () => {
  revalidateIfWasInvalid(emailInput, emailField, () => isValidEmail(emailInput.value.trim()));
});
passwordInput.addEventListener("input", () => {
  revalidateIfWasInvalid(passwordInput, passwordField, () => passwordInput.value.length >= 8);
  revalidateIfWasInvalid(confirmInput, confirmField, () => confirmInput.value === passwordInput.value && confirmInput.value.length > 0);
});
confirmInput.addEventListener("input", () => {
  revalidateIfWasInvalid(confirmInput, confirmField, () => confirmInput.value === passwordInput.value && confirmInput.value.length > 0);
});

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideBanners();

    if (!validate()) {
      formErrorText.textContent = "Veuillez corriger les champs en surbrillance.";
      formError.classList.add("is-visible");
      return;
    }

    submitBtn.classList.add("is-loading");
    submitBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullNameInput.value.trim(),
          email: emailInput.value.trim(),
          password: passwordInput.value,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Inscription impossible.");
      }

      const authData = await res.json();
      saveSession(authData);

      formSuccess.classList.add("is-visible");
      form.reset();
      strengthEl?.setAttribute("data-level", 0);

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1400);
    } catch (err) {
      formErrorText.textContent = err.message || "Une erreur est survenue. Veuillez réessayer.";
      formError.classList.add("is-visible");
    } finally {
      submitBtn.classList.remove("is-loading");
      submitBtn.disabled = false;
    }
  });
}