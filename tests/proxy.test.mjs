import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import config from "../next.config.ts";
const original = process.env.SPRING_BOOT_API_URL;
afterEach(() => {
  if (original === undefined) delete process.env.SPRING_BOOT_API_URL;
  else process.env.SPRING_BOOT_API_URL = original;
});
test("proxy maps authentication requests to Java routes", async () => {
  process.env.SPRING_BOOT_API_URL = "http://localhost:8080/";
  assert.deepEqual(await config.rewrites(), [
    {
      source: "/api/auth/:path*",
      destination: "http://localhost:8080/auth/:path*",
    },
  ]);
});
test("direct API mode disables proxy", async () => {
  delete process.env.SPRING_BOOT_API_URL;
  assert.deepEqual(await config.rewrites(), []);
});
test("proxy rejects plaintext remote origins", async () => {
  process.env.SPRING_BOOT_API_URL = "http://api.example.com";
  await assert.rejects(config.rewrites(), /HTTPS/);
});
