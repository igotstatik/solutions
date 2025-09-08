import { spawn } from 'child_process';
import * as fs from 'fs';
import { parentPort } from 'worker_threads';
import { getServerConfig } from './server-config';

// Простой logger без зависимости на config
const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  fatal: (obj: any, msg: string) => console.error(`[FATAL] ${msg}`, obj)
};

const terminationHandler = (signal: string): never => {
  logger.info(`${signal} received. Stopping`);
  process.exit(0);
};

const handledSignals = ['SIGINT', 'SIGTERM'];
parentPort?.on('message', (message) => {
  if (handledSignals.includes(message)) {
    terminationHandler(message);
  }
});

const run = async (): Promise<void> => {
  logger.info('SERVER.TS STARTED - This should appear in logs!');
  const serverConfig = getServerConfig();

  // Записываем TLS сертификаты с ограниченными правами
  await fs.promises.writeFile(serverConfig.privateKeyFilePath, serverConfig.tlsKey, {
    mode: 0o600,
  });
  await fs.promises.writeFile(serverConfig.certificateFilePath, serverConfig.tlsCert, {
    mode: 0o600,
  });

  // Запускаем Langflow на порту для tunnel client
  const langflowProcess = spawn('langflow', [
    'run',
    '--host', '0.0.0.0',
    '--port', '9000',
  ], {
    stdio: 'inherit',
    cwd: serverConfig.langflowPath,
    env: {
      ...process.env,
      LANGFLOW_DATABASE_URL: 'sqlite:///sp/output/langflow.db',
      LANGFLOW_CACHE_DIR: '/sp/inputs/input-0001',
      LANGFLOW_STORE_ENVIRONMENT_VARIABLES: 'true'
    },
  });

  // Ждем пока Langflow запустится
  logger.info('Waiting for Langflow to start...');
  await new Promise(resolve => setTimeout(resolve, 10000)); // 10 секунд
  logger.info('Langflow should be ready now');
};

run().catch((err) => {
  logger.fatal({ err }, `Dia-TTS-Server start command failed`);
});
