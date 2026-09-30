import { betterAuth } from 'better-auth';
import { getMigrations } from 'better-auth/db/migration';
import { env } from 'cloudflare:workers';

let migrations: Promise<void> | null = null;

function getAuth() {
  if (!env.DB) throw new Error('The account database is not configured.');
  if (!env.BETTER_AUTH_SECRET) throw new Error('Authentication is not configured yet.');
  return betterAuth({
    appName: 'Or',
    baseURL: env.BETTER_AUTH_URL || 'http://localhost:3000',
    secret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    trustedOrigins: [env.BETTER_AUTH_URL || 'http://localhost:3000'],
    user: { modelName: 'auth_users', fields: { emailVerified: 'email_verified', createdAt: 'created_at', updatedAt: 'updated_at' } },
    session: { modelName: 'auth_sessions', fields: { userId: 'user_id', expiresAt: 'expires_at', ipAddress: 'ip_address', userAgent: 'user_agent', createdAt: 'created_at', updatedAt: 'updated_at' } },
    account: { modelName: 'auth_accounts', fields: {
      userId: 'user_id', accountId: 'account_id', providerId: 'provider_id', accessToken: 'access_token',
      refreshToken: 'refresh_token', accessTokenExpiresAt: 'access_token_expires_at',
      refreshTokenExpiresAt: 'refresh_token_expires_at', idToken: 'id_token', createdAt: 'created_at', updatedAt: 'updated_at',
    } },
    verification: { modelName: 'auth_verifications', fields: { expiresAt: 'expires_at', createdAt: 'created_at', updatedAt: 'updated_at' } },
    socialProviders: env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET ? {
      github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET },
    } : {},
  });
}

export async function getSessionUser(request: Request) {
  const auth = getAuth();
  if (!migrations) {
    migrations = (async () => {
      const { runMigrations } = await getMigrations(getAuth().options);
      await runMigrations();
    })().catch((error) => { migrations = null; throw error; });
  }
  await migrations;
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function handleAuth(request: Request) {
  if (!migrations) {
    migrations = (async () => {
      const { runMigrations } = await getMigrations(getAuth().options);
      await runMigrations();
    })().catch((error) => { migrations = null; throw error; });
  }
  await migrations;
  const auth = getAuth();
  return auth.handler(request);
}
