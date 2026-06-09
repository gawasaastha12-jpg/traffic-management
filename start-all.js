const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const pythonExec = isWindows 
  ? path.join(__dirname, 'backend', '.venv', 'Scripts', 'python.exe')
  : path.join(__dirname, 'backend', '.venv', 'bin', 'python');

console.log('Starting RENEW Smart Traffic Digital Twin (Frontend + Backend)...');

// Start Backend (shell: false prevents path space splitting)
const backend = spawn(pythonExec, ['-m', 'uvicorn', 'app.main:app', '--reload', '--host', '127.0.0.1', '--port', '8000'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: false
});

// Start Frontend (shell: true is required on Windows to run batch commands like npm)
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

backend.on('error', (err) => {
  console.error('Failed to start backend server:', err);
});

frontend.on('error', (err) => {
  console.error('Failed to start frontend dev server:', err);
});

const cleanup = () => {
  console.log('\nShutting down servers...');
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
