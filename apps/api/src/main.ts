import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import helmet from 'helmet';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigin = process.env['CORS_ORIGIN'] || 'http://localhost';
  app.use(helmet());
  app.enableCors({ origin: corsOrigin });
  app.useWebSocketAdapter(new WsAdapter(app));

  const port = process.env['PORT'] || 3000;
  await app.listen(port);

  process.on('SIGTERM', async () => {
    await app.close();
    process.exit(0);
  });
}

bootstrap();
