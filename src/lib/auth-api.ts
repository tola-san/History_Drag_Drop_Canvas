import type { LoginValues, RegisterValues } from "./validation";
export function apiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base)
    throw new Error(
      "Authentication is not configured. Set NEXT_PUBLIC_API_URL and restart the app.",
    );
  const url = new URL(base);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("The authentication API must use HTTPS.");
  return base.replace(/\/$/, "") + path;
}
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
export async function authRequest(path: string, init?: RequestInit) {
  const url = apiUrl(path);
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      credentials: "include",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error(
      "We couldn’t reach the authentication service. Please try again.",
    );
  }
  if (!response.ok) {
    if (response.status === 401)
      throw new ApiError(
        "Your session expired or the credentials are incorrect. Please log in again.",
        401,
      );
    if (response.status === 403)
      throw new ApiError(
        "Your security token expired or the request was denied. Please try again.",
        403,
      );
    if (response.status === 429)
      throw new Error("Too many attempts. Please wait and try again.");
    throw new ApiError(
      "We couldn’t complete your request. Please try again or contact support.",
      response.status,
    );
  }
  return response;
}
export async function authMutation(
  path: string,
  body?: unknown,
  method = "POST",
) {
  // A fresh session-bound CSRF token is fetched before every mutation.
  const response = await authRequest("/api/auth/csrf");
  let csrf: unknown;
  try {
    csrf = await response.json();
  } catch {
    throw new Error("The service returned an invalid security token.");
  }
  if (
    !csrf ||
    typeof csrf !== "object" ||
    !("token" in csrf) ||
    !("headerName" in csrf) ||
    typeof csrf.token !== "string" ||
    !csrf.token ||
    typeof csrf.headerName !== "string" ||
    !/^X-[A-Za-z0-9-]+$/i.test(csrf.headerName)
  )
    throw new Error("The service returned an invalid security token.");
  return authRequest(path, {
    method,
    headers: {
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      [csrf.headerName]: csrf.token,
    },
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}
export const authApi = {
  login: (values: LoginValues) => authMutation("/api/auth/login", values),
  register: ({ email, password, terms }: RegisterValues) =>
    authMutation("/api/auth/register", {
      email,
      password,
      termsAccepted: terms,
    }),
  me: () => authRequest("/api/auth/me"),
  logout: () => authMutation("/api/auth/logout"),
};
