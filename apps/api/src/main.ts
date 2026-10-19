import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { WsAdapter } from "@nestjs/platform-ws";
import { AppModule } from "./app.module.js";
import { ConfigService } from "./config.service.js";

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.useWebSocketAdapter(new WsAdapter(app));
  const { port } = app.get(ConfigService).config;
  await app.listen(port);
};

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[api] fatal: ${message}`);
  process.exit(1);
});
