import { test } from "node:test";
import assert from "node:assert/strict";
import { commentSchema } from "../src/lib/onboarding.ts";
test("comments reject empty text, oversized messages, and invalid photo references", () => {
 const valid = { id:"comment-1", text:"  Nice moment  ", author:"test@example.com", createdAt:"2026-10-30T03:00:00.000Z", photoId:"default-01" };
 assert.equal(commentSchema.parse(valid).text, "Nice moment");
 assert.equal(commentSchema.safeParse({...valid,text:"   "}).success,false);
 assert.equal(commentSchema.safeParse({...valid,text:"x".repeat(1001)}).success,false);
 assert.equal(commentSchema.safeParse({...valid,photoId:"../../other"}).success,false);
 assert.equal(commentSchema.safeParse({...valid,createdAt:"invalid"}).success,false);
});
