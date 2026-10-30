import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../src/lib/validation.ts";
import { authApi } from "../src/lib/auth-api.ts";

const originalFetch = globalThis.fetch;
const originalUrl = process.env.NEXT_PUBLIC_API_URL;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = originalUrl;
});
test("registration requires matching passwords and accepted terms", () => {
  const valid = {
    email: "test@example.com",
    password: "a long passphrase",
    confirmPassword: "a long passphrase",
    terms: true,
  };
  assert.equal(registerSchema.safeParse(valid).success, true);
  assert.equal(
    registerSchema.safeParse({ ...valid, terms: false }).success,
    false,
  );
  assert.equal(
    registerSchema.safeParse({ ...valid, confirmPassword: "different" })
      .success,
    false,
  );
  assert.equal(
    registerSchema.safeParse({ ...valid, password: "short" }).success,
    false,
  );
  assert.equal(
    loginSchema.safeParse({ email: "bad", password: "x", rememberMe: false })
      .success,
    false,
  );
});
test("login fetches CSRF first and includes cookies and the issued header", async () => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return calls.length === 1
      ? Response.json({ token: "csrf-test", headerName: "X-CSRF-TOKEN" })
      : new Response(null, { status: 204 });
  };
  await authApi.login({
    email: "test@example.com",
    password: "secret",
    rememberMe: true,
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://api.example.com/api/auth/csrf");
  assert.equal(calls[1].url, "https://api.example.com/api/auth/login");
  for (const call of calls) {
    assert.equal(call.init.credentials, "include");
    assert.equal(call.init.cache, "no-store");
    assert.equal(call.init.redirect, "error");
  }
  assert.equal(calls[1].init.headers["X-CSRF-TOKEN"], "csrf-test");
  assert.equal(JSON.parse(calls[1].init.body).rememberMe, true);
});
test("registration omits password confirmation from the request", async () => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  globalThis.fetch = async (url, init) => {
    if (url.endsWith("/csrf"))
      return Response.json({ token: "csrf", headerName: "X-CSRF-TOKEN" });
    const body = JSON.parse(init.body);
    assert.deepEqual(body, {
      email: "test@example.com",
      password: "a long passphrase",
      termsAccepted: true,
    });
    return new Response(null, { status: 201 });
  };
  await authApi.register({
    email: "test@example.com",
    password: "a long passphrase",
    confirmPassword: "a long passphrase",
    terms: true,
  });
});
test("invalid CSRF responses prevent credential submission", async () => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  let count = 0;
  globalThis.fetch = async () => {
    count++;
    return Response.json({ token: "" });
  };
  await assert.rejects(
    authApi.login({ email: "a@b.com", password: "secret", rememberMe: false }),
    /invalid security token/,
  );
  assert.equal(count, 1);
});
test("failed login never reports success", async () => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  globalThis.fetch = async (url) =>
    url.endsWith("/csrf")
      ? Response.json({ token: "csrf", headerName: "X-CSRF-TOKEN" })
      : new Response(null, { status: 401 });
  await assert.rejects(
    authApi.login({ email: "a@b.com", password: "secret", rememberMe: false }),
    /incorrect/,
  );
});
test("missing configuration prevents requests", async () => {
  delete process.env.NEXT_PUBLIC_API_URL;
  globalThis.fetch = async () => {
    assert.fail("must not send requests");
  };
  await assert.rejects(
    authApi.login({ email: "a@b.com", password: "secret", rememberMe: false }),
    /not configured/,
  );
});
test("an insecure production API URL is rejected before sending passwords", async () => {
  process.env.NEXT_PUBLIC_API_URL = "http://api.example.com";
  globalThis.fetch = async () => {
    assert.fail("must not send requests");
  };
  await assert.rejects(
    authApi.login({ email: "a@b.com", password: "secret", rememberMe: false }),
    /HTTPS/,
  );
});
test("CSRF endpoint HTML is handled without exposing the response body", async () => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  globalThis.fetch = async () =>
    new Response("<html>internal error detail</html>");
  await assert.rejects(
    authApi.login({ email: "a@b.com", password: "secret", rememberMe: false }),
    /invalid security token/,
  );
});
