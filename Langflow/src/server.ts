import { spawn } from 'child_process';
import * as fs from 'fs';
import { parentPort } from 'worker_threads';
import { rootLogger } from './logger'; //
import { getServerConfig } from './server-config';


const logger = rootLogger.child({ module: 'server.js' });

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
  const serverConfig = getServerConfig();

  await fs.promises.writeFile(serverConfig.privateKeyFilePath, serverConfig.tlsKey, {
    mode: 0o600,
  });
  await fs.promises.writeFile(serverConfig.certificateFilePath, serverConfig.tlsCert, {
    mode: 0o600,
  });

  const langflowArgs = [
    'run',
    '--host', '0.0.0.0',
    '--port', String(serverConfig.port), 
    '--ssl-key-file-path', serverConfig.privateKeyFilePath,   
    '--ssl-cert-file-path', serverConfig.certificateFilePath, 
  ];
  
  logger.info(`Spawning langflow with args: ${langflowArgs.join(' ')}`);

  const langflowProcess = spawn('langflow', langflowArgs, {
    stdio: 'inherit',
    cwd: serverConfig.langflowPath,
    env: {
      ...process.env,
      LANGFLOW_DATABASE_URL: 'sqlite:////sp/output/langflow.db',
      LANGFLOW_CACHE_DIR: '/sp/inputs/cache',
      LANGFLOW_STORE_ENVIRONMENT_VARIABLES: 'true'
    },
  });

  langflowProcess.on('error', (err) => {
    logger.fatal({ err }, 'Failed to start Langflow process.');
    process.exit(1);
  });
};


run().catch((err) => {
  logger.fatal({ err }, `Langflow Server thread start command failed`);
});
