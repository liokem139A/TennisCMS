import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Application
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  logLevel: process.env.LOG_LEVEL || 'info',

  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tennis_cms',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'tennis_cms',
    ssl: process.env.DB_SSL === 'true',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    },
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://:redis123@localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || 'redis123',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key',
    expiry: process.env.JWT_EXPIRY || '7d',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },

  // AWS
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },

  // ECS
  ecs: {
    clusterProd: process.env.ECS_CLUSTER_PROD,
    clusterStaging: process.env.ECS_CLUSTER_STAGING,
  },

  // Email
  email: {
    service: process.env.EMAIL_SERVICE || 'sendgrid',
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@celadontennis.com',
  },

  // Slack
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
  },

  // CORS
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3001').split(','),
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Feature flags
  features: {
    ambassadorProgram: process.env.FEATURE_AMBASSADOR_PROGRAM === 'true',
    tournamentManagement: process.env.FEATURE_TOURNAMENT_MANAGEMENT === 'true',
    sponsorPortal: process.env.FEATURE_SPONSOR_PORTAL === 'true',
  },

  // Development
  isDev: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  isProd: process.env.NODE_ENV === 'production',
};
