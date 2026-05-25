// PM2 process configuration for sibermas-YT
// Runs Next.js production server on port 3100
module.exports = {
  apps: [
    {
      name: 'sibermas',
      cwd: '/home/rizqunaid/sibermas-yt',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3100 --hostname 127.0.0.1',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: '3100'
      },
      error_file: '/home/rizqunaid/sibermas-worker/logs/sibermas-err.log',
      out_file: '/home/rizqunaid/sibermas-worker/logs/sibermas-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      time: true
    }
  ]
};
