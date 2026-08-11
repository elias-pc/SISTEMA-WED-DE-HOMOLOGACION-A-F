import { spawn, spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';
const command = isWindows ? (process.env.ComSpec || 'cmd.exe') : 'npm';
const commandArgs = (script) => isWindows
  ? ['/d', '/s', '/c', `npm.cmd run ${script}`]
  : ['run', script];
const children = [
  spawn(command, commandArgs('dev:server'), { stdio: 'inherit' }),
  spawn(command, commandArgs('dev:web'), { stdio: 'inherit' }),
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
