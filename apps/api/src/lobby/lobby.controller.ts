import {
  LOBBIES_ROUTE,
  type LobbyResponse,
  lobbyIdSchema,
  parseLobbyResponse,
} from "@kresliarska/shared";
import { Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { LobbyService } from "./lobby.service.js";

@Controller()
export class LobbyController {
  constructor(private readonly lobbyService: LobbyService) {}

  @Post(LOBBIES_ROUTE)
  create(): LobbyResponse {
    return parseLobbyResponse({ id: this.lobbyService.create() });
  }

  @Get(`${LOBBIES_ROUTE}/:id`)
  get(@Param("id") id: string): LobbyResponse {
    if (!lobbyIdSchema.safeParse(id).success || !this.lobbyService.exists(id)) {
      throw new NotFoundException("Lobby not found");
    }
    return parseLobbyResponse({ id });
  }
}
