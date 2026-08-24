import pino from 'pino';
import { config } from '@/config';

const transport =
  config.isDev
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: true,
        },
      })
    : undefined;

export const logger = pino(
  {
    level: config.logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport
);
