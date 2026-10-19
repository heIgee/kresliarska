import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { AppModule } from "../src/app.module.js";
import type { ApiConfig } from "../src/config.js";
import { ConfigService } from "../src/config.service.js";

export const createHttpTestApp = async (config: ApiConfig): Promise<INestApplication> => {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(ConfigService)
    .useValue({ config })
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
};
