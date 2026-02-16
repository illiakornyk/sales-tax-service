import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BigIntSerializationInterceptor } from './common/interceptors/bigint-serialization.interceptor';
import { ENV_KEYS } from './config/constants/env.constants';
import { JsonLogger } from './common/logging/json.logger';

async function bootstrap() {
  const logger = new JsonLogger();
  const app = await NestFactory.create(AppModule, { logger });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new BigIntSerializationInterceptor());

  const corsOrigin = process.env[ENV_KEYS.CORS_ORIGIN] as string;
  const port = Number(process.env[ENV_KEYS.PORT]);
  if (!Number.isFinite(port)) {
    throw new Error(`${ENV_KEYS.PORT} must be a valid number`);
  }

  app.enableCors({
    origin: [corsOrigin],
    credentials: false,
  });

  const config = new DocumentBuilder().setTitle('Sales tax service').build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(port);
}
void bootstrap();
