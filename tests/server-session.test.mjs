import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { verifySessionCookies } from "../src/lib/server-session.ts";
const originalFetch = globalThis.fetch;
const originalBackend = process.env.SPRING_BOOT_API_URL;
afterEach(() => {
 globalThis.fetch = originalFetch;
 if (originalBackend === undefined) delete process.env.SPRING_BOOT_API_URL;
 else process.env.SPRING_BOOT_API_URL = originalBackend;
});
test("private photos require a session cookie before requesting Java", async () => {
 globalThis.fetch = async () => assert.fail("must not fetch without a session");
 assert.deepEqual(await verifySessionCookies([]), { status: "unauthorized" });
});
test("session verification forwards only session cookies and rejects expired sessions", async () => {
 process.env.SPRING_BOOT_API_URL = "https://api.example.com";
 globalThis.fetch = async (url, init) => {
  assert.equal(url, "https://api.example.com/auth/me");
  assert.equal(init.headers.Cookie, "JSESSIONID=test-session");
  assert.equal(init.cache, "no-store");
  return new Response(null, { status: 401 });
 };
 assert.deepEqual(await verifySessionCookies([{name:"JSESSIONID",value:"test-session"},{name:"unrelated",value:"private-value"}]), {status:"unauthorized"});
});
test("network errors and malformed identities never grant photo access", async () => {
 process.env.SPRING_BOOT_API_URL = "https://api.example.com";
 globalThis.fetch = async () => { throw new Error("offline"); };
 assert.deepEqual(await verifySessionCookies([{name:"SESSION",value:"test"}]), {status:"unavailable"});
 globalThis.fetch = async () => Response.json({ status: 200 });
 assert.deepEqual(await verifySessionCookies([{name:"SESSION",value:"test"}]), {status:"unavailable"});
 globalThis.fetch = async () => Response.json({ email: "test@example.com" });
 assert.deepEqual(await verifySessionCookies([{name:"SESSION",value:"test"}]), {status:"authenticated",email:"test@example.com"});
});
