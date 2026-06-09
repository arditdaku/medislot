export function login(token: string, role: string, user: object) {
  localStorage.setItem("access_token", token);
  localStorage.setItem("role", role);
  localStorage.setItem("user", JSON.stringify(user));
}

export function logout() {
  localStorage.clear();
  window.location.href = "/login";
}

export function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function getToken() {
  return localStorage.getItem("access_token");
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("access_token");
}