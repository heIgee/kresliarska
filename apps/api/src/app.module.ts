import { Module } from "@nestjs/common";
import { ConfigModule } from "./config.module.js";
import { HealthModule } from "./health/health.module.js";

@Module({
  imports: [ConfigModule, HealthModule],
})
export class AppModule {}
