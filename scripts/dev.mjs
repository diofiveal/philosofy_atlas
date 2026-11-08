import { spawn } from 'node:child_process';
// Work's managed preview supplies Vite-style --host/--strictPort flags.
// Normalize those launcher arguments for the requested Next.js framework.
const args = process.argv.slice(2);
let port = process.env.PORT || '3000';
let hostname = '0.0.0.0';
for (let i = 0; i < args.length; i++) {
  if (['--port', '-p'].includes(args[i])) port = args[++i];
  else if (['--host', '--hostname', '-H'].includes(args[i])) hostname = args[++i];
}
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', hostname, '--port', port], { stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => { process.exitCode = code ?? 1; });
