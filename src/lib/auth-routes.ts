export const LOGIN_PATH = "/login";
export const REGISTER_LOGIN_PATH = "/login?registro";

export function isRegisterLoginSearch(search: string) {
  const params = new URLSearchParams(search);
  return params.has("registro") || params.get("mode") === "register";
}
