import "reflect-metadata";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterEach, beforeEach, describe, it } from "vitest";
import type { ApiConfig } from "../src/config.js";
import { createHttpTestApp } from "./http-test-app.js";

const defaultConfig: ApiConfig = {
  port: 0,
};

describe("App integration", () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createHttpTestApp(defaultConfig);
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /api/health returns ok", async () => {
    await request(app.getHttpServer()).get("/api/health").expect(200, { ok: true });
  });
});
