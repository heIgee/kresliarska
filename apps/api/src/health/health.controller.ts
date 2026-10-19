import { HEALTH_ROUTE, type HealthResponse, parseHealthResponse } from "@kresliarska/shared";
import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get(HEALTH_ROUTE)
  getHealth(): HealthResponse {
    return parseHealthResponse({ ok: true });
  }
}
