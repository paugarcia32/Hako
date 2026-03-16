import { execSync } from 'node:child_process';
import * as path from 'node:path';

export async function setup() {
  execSync('prisma db push', {
    cwd: path.resolve(__dirname, '../../'),
    env: { ...process.env },
    stdio: 'inherit',
  });
}

export async function teardown() {}
