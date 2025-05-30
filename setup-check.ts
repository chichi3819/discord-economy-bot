#!/usr/bin/env bun
import { config } from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables
config();

console.log('🔍 Discord Economy Bot Setup Validation\n');

const checks = [
  {
    name: 'Environment file exists',
    check: () => existsSync('.env'),
    suggestion: 'Copy .env.example to .env and configure it'
  },
  {
    name: 'Discord token configured',
    check: () => !!process.env.DISCORD_TOKEN,
    suggestion: 'Set DISCORD_TOKEN in your .env file'
  },
  {
    name: 'Client ID configured',
    check: () => !!process.env.CLIENT_ID,
    suggestion: 'Set CLIENT_ID in your .env file'
  },
  {
    name: 'MongoDB URI configured',
    check: () => !!process.env.MONGODB_URI,
    suggestion: 'Set MONGODB_URI in your .env file'
  },
  {
    name: 'Bot owner ID configured',
    check: () => !!process.env.BOT_OWNER_ID,
    suggestion: 'Set BOT_OWNER_ID in your .env file'
  }
];

let allPassed = true;

for (const test of checks) {
  const passed = test.check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${test.name}`);

  if (!passed) {
    console.log(`   💡 ${test.suggestion}`);
    allPassed = false;
  }
}

console.log('\n📋 Setup Summary:');

if (allPassed) {
  console.log('✅ All checks passed! Your bot is ready to run.');
  console.log('\n🚀 Next steps:');
  console.log('1. Deploy commands: bun run deploy');
  console.log('2. Start the bot: bun run dev');
} else {
  console.log('❌ Some configuration is missing. Please fix the issues above.');
}

console.log('\n📚 For detailed setup instructions, see README.md');