#!/usr/bin/env node
/* Start an in-memory MongoDB and launch the API server pointing at it.

Usage: from apps/api run `pnpm install` then `pnpm run dev:mem`

This script uses mongodb-memory-server to create a temporary MongoDB instance,
sets process.env.MONGODB_URI to point to it, and then requires the project's
server entry (compiled or source). It prefers running the compiled `dist/server.js`
if present, otherwise it requires the TS source with ts-node/register if available.
*/

const path = require('path');
const fs = require('fs');

async function main() {
  // Lazy require so the package can be missing until pnpm install
  let MongoMemoryServer;
  try {
    // Safe CommonJS require — the package exports a named MongoMemoryServer
    const mod = require('mongodb-memory-server');
    MongoMemoryServer = mod.MongoMemoryServer || (mod.default && mod.default.MongoMemoryServer) || mod;
  } catch (err) {
    console.error('Please run `pnpm install` in apps/api to install dev deps (mongodb-memory-server).');
    process.exit(1);
  }

  const mongod = await MongoMemoryServer.create({ binary: { version: '7.0.0' } });
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  console.log('🔬 mongodb-memory-server started at', uri);

  // Prefer running built server if it exists
  const built = path.join(__dirname, '..', 'dist', 'server.js');
  const src = path.join(__dirname, '..', 'src', 'server.ts');

  if (fs.existsSync(built)) {
    console.log('▶️  Starting compiled server:', built);
    require(built);
  } else if (fs.existsSync(src)) {
    // Try to load ts-node/register so we can require TS directly
    try {
      require('ts-node/register');
      console.log('▶️  Starting TS server via ts-node:', src);
      require(src);
    } catch (err) {
      console.log('Compiled server not found and ts-node/register missing.');
      console.log('You can run `pnpm exec tsc -p tsconfig.json` to build, or add ts-node to devDeps.');
      process.exit(1);
    }
  } else {
    console.error('No server entry found at', built, 'or', src);
    process.exit(1);
  }

  // Keep process alive until terminated. Cleanup memory server on exit.
  const cleanup = async () => {
    console.log('\nShutting down mongodb-memory-server...');
    try {
      await mongod.stop();
    } catch (e) {
      // ignore
    }
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch(err => {
  console.error('dev-mem failed:', err);
  process.exit(1);
});
