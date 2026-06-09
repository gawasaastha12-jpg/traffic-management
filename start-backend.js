const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const pythonExec = isWindows 
  ? path.join(__dirname, 'backend', '.venv', 'Scripts', 'python.exe')
  : path.join(__dirname, 'backend', '.venv', 'bin', 'python');

console.log(`Starting FastAPI backend server using: ${pythonExec}...`);

const backend = spawn(pythonExec, ['-m', 'uvicorn', 'app.main:app', '--reload', '--host', '127.0.0.1', '--port', '8000'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: false
});

backend.on('error', (err) => {
  console.error('Failed to start backend server:', err);
});

process.on('SIGINT', () => {
  backend.kill();
  process.exit();
});
