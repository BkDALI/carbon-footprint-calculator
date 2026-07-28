const SESSION_KEY = "cftn_session";
const TOKEN_KEY = "cftn_access_token";

function saveSession(authData) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(authData.user)
  );

  localStorage.setItem(
    TOKEN_KEY,
    authData.access_token
  );
}

function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    clearSession();
    return null;
  }
}

function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getAuthHeaders() {
  const token = getAccessToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}