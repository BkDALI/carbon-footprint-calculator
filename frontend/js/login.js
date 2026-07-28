const API_BASE = "https://carbon-footprint-api.onrender.com";

const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    document.getElementById("email")?.focus();
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
  });
});

const form = document.getElementById("loginForm");
const emailField = document.getElementById("emailField");
const passwordField = document.getElementById("passwordField");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const formError = document.getElementById("formError");
const formErrorText = document.getElementById("formErrorText");

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function setFieldError(fieldEl, hasError) {
  fieldEl.classList.toggle("has-error", hasError);
}

emailInput.addEventListener("input", () => {
  if (emailField.classList.contains("has-error") && isValidEmail(emailInput.value.trim())) {
    setFieldError(emailField, false);
  }
});
passwordInput.addEventListener("input", () => {
  if (passwordField.classList.contains("has-error") && passwordInput.value.length > 0) {
    setFieldError(passwordField, false);
  }
});

function validate() {
  let valid = true;
  const emailOk = isValidEmail(emailInput.value.trim());
  setFieldError(emailField, !emailOk);
  if (!emailOk) valid = false;

  const passwordOk = passwordInput.value.length > 0;
  setFieldError(passwordField, !passwordOk);
  if (!passwordOk) valid = false;

  return valid;
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.classList.remove("is-visible");

    if (!validate()) return;

    submitBtn.classList.add("is-loading");
    submitBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.value.trim(),
          password: passwordInput.value,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Email ou mot de passe incorrect.");
      }

      const user = await res.json();
      saveSession(user);
      window.location.href = "index.html";
    } catch (err) {
      formErrorText.textContent = err.message || "Email ou mot de passe incorrect.";
      formError.classList.add("is-visible");
    } finally {
      submitBtn.classList.remove("is-loading");
      submitBtn.disabled = false;
    }
  });
}
