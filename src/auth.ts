export function isLoggedIn() {
  return Boolean(localStorage.getItem("auth_token"));
}

export function logout() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}
