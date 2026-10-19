import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { ConfigService } from "./config.service.js";

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const { port } = app.get(ConfigService).config;
  await app.listen(port);
};

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[api] fatal: ${message}`);
  process.exit(1);
});
