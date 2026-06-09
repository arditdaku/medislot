export const TOKEN_KEY = "medislot_token";
export const ROLE_KEY = "medislot_role";


// ─── Token & Role (used by middleware + apiClient) ───
export function saveToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  // Also set as cookie so middleware.ts can read it on the edge
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Strict`;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveRole(role: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROLE_KEY, role);
}

export function getRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ROLE_KEY);
}

// ─── User object ────

export function saveUser(user: object): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("medislot_user", JSON.stringify(user));
}

export function getUser(): object | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("medislot_user");
  return user ? JSON.parse(user) : null;
}

// ─── Login / Logout ───
export function login(token: string, role: string, user: object): void{
  saveToken(token);
  saveRole(role);
  saveUser(user);
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem("medislot_user");
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

export function logout(): void {
  clearAuth();
  window.location.href = "/login";
}


// ─── Guards ───
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!getToken();
}