import { execSync } from 'child_process';

const env = process.env.NODE_ENV;

if (!env) {
    console.error('❌ NODE_ENV is not set. Please set it to "production" or "development"');
    process.exit(1);
}

if (env === 'production') {
    console.log('🚀 Running production seed...');
    execSync('node prisma/seeds/seed.prod.js', { stdio: 'inherit' });
} else {
    console.log('🛠️  Running development seed...');
    execSync('node prisma/seeds/seed.dev.js', { stdio: 'inherit' });
}