import { Module } from "@nestjs/common";
import { ConfigModule } from "./config.module.js";
import { HealthModule } from "./health/health.module.js";
import { LobbyModule } from "./lobby/lobby.module.js";

@Module({
  imports: [ConfigModule, HealthModule, LobbyModule],
})
export class AppModule {}
