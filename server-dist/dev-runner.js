import { spawn } from 'node:child_process';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [spawn(npm, ['run', 'dev:server'], { stdio: 'inherit', shell: process.platform === 'win32' }), spawn(npm, ['run', 'dev:web'], { stdio: 'inherit', shell: process.platform === 'win32' })];
function stop() { for (const child of children)
    child.kill(); process.exit(); }
for (const child of children)
    child.on('exit', code => { if (code && code !== 0)
        stop(); });
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
