import { execSync } from 'child_process';
import { env, isProd } from "../src/config/env.js";

const nodeEnv = env.nodeEnv;

if (!nodeEnv) {
    console.error('❌ NODE_ENV is not set. Please set it to "production" or "development"');
    process.exit(1);
}

if (isProd) {
    console.log('🚀 Running production seed...');
    execSync('node prisma/seeds/seed.prod.js', { stdio: 'inherit' });
} else {
    console.log('🛠️  Running development seed...');
    execSync('node prisma/seeds/seed.dev.js', { stdio: 'inherit' });
}