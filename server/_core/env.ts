export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // S3 próprio do usuário
  mindiS3Bucket: process.env.MINDI_S3_BUCKET ?? "",
  mindiS3Region: process.env.MINDI_S3_REGION ?? "",
  mindiS3AccessKey: process.env.MINDI_S3_ACCESS_KEY ?? "",
  mindiS3SecretKey: process.env.MINDI_S3_SECRET_KEY ?? "",
  // iFood Integration
  ifoodClientId: process.env.IFOOD_CLIENT_ID ?? "",
  ifoodClientSecret: process.env.IFOOD_CLIENT_SECRET ?? "",
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
};
