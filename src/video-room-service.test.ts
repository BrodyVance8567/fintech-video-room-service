import assert from "node:assert/strict";
import { decideSession } from "./video-room-service.js";

assert.equal(decideSession(0.7), "allow");
assert.equal(decideSession(0.71), "review");
console.log("risk decision test passed");
