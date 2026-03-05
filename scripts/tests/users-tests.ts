import request from "supertest";
import { createApp } from "../../src/app/app";

async function run() {
  const app = createApp();

  // 1) create user
  const payload = { name: "Test User", email: "test@example.com" };
  const r1 = await request(app).post("/api/users").send(payload);
  if (r1.status !== 201) {
    console.error("Expected 201 on first create, got", r1.status, r1.body);
    process.exit(1);
  }
  console.log("create: ok");

  // 2) conflict on same email
  const r2 = await request(app).post("/api/users").send(payload);
  if (r2.status !== 409) {
    console.error("Expected 409 on duplicate email, got", r2.status, r2.body);
    process.exit(1);
  }
  console.log("conflict: ok");

  // 3) not found for missing id
  const r3 = await request(app).get("/api/users/non-existent-id");
  if (r3.status !== 404) {
    console.error("Expected 404 for missing user, got", r3.status, r3.body);
    process.exit(1);
  }
  console.log("not-found: ok");

  console.log("ALL tests passed");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
