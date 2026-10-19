import { Module } from "@nestjs/common";
import { LobbyController } from "./lobby.controller.js";
import { LobbyGateway } from "./lobby.gateway.js";
import { LobbyService } from "./lobby.service.js";

@Module({
  controllers: [LobbyController],
  providers: [LobbyService, LobbyGateway],
})
export class LobbyModule {}
