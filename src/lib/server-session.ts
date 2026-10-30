type SessionCookie = { name: string; value: string };
type SessionResult =
  | { status: "authenticated"; email: string }
  | { status: "unauthorized" | "unavailable" };

// Verify against Java on every request. Never cache authentication across users.
export async function verifySessionCookies(
  cookies: SessionCookie[],
): Promise<SessionResult> {
  const session = cookies.filter((cookie) =>
    ["JSESSIONID", "SESSION"].includes(cookie.name),
  );
  if (!session.length) return { status: "unauthorized" };
  try {
    const backend = process.env.SPRING_BOOT_API_URL;
    const base = backend || process.env.NEXT_PUBLIC_API_URL;
    if (!base) return { status: "unavailable" };
    const url = new URL(base);
    if (
      url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      )
    )
      return { status: "unavailable" };
    const response = await fetch(
      `${base.replace(/\/$/, "")}${backend ? "/auth/me" : "/api/auth/me"}`,
      {
        headers: {
          Cookie: session
            .map((cookie) => `${cookie.name}=${cookie.value}`)
            .join("; "),
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      },
    );
    if ([401, 403].includes(response.status)) return { status: "unauthorized" };
    if (response.ok) {
      const user = await response.json();
      if (
        typeof user.email === "string" &&
        user.email.length > 0 &&
        user.email.length <= 254
      )
        return { status: "authenticated", email: user.email };
    }
  } catch {
    /* A network or payload failure must not grant access. */
  }
  return { status: "unavailable" };
}
