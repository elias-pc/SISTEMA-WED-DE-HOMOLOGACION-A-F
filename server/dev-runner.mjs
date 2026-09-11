import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const isWindows = process.platform === 'win32';
const children = [
  spawn(process.execPath, [resolve('server-dist/index.js')], { stdio: 'inherit' }),
  spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js')], { stdio: 'inherit' }),
];

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid) continue;
    if (isWindows) spawnSync('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
    else child.kill('SIGTERM');
  }
  process.exit(exitCode);
}

for (const child of children) child.on('exit', (code) => {
  if (!stopping && code && code !== 0) stop(code);
});
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
