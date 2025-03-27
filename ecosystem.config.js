export default {
  apps: [
    {
      name: 'authentic-internet-server',
      cwd: './server',
      script: 'server.mjs',
      instances: 1,
      autorestart: true,
      watch: ['*.mjs', 'routes/**/*.js', 'controllers/**/*.js', 'models/**/*.js', 'middleware/**/*.js'],
      ignore_watch: ['node_modules', 'logs', '*.log'],
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      error_file: './server/logs/server-error.log',
      out_file: './server/logs/server-output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      restart_delay: 2000,
      min_uptime: 5000,
      max_restarts: 10,
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
    {
      name: 'authentic-internet-client',
      cwd: './client',
      script: 'npm',
      args: 'run dev',
      instances: 1,
      autorestart: true,
      watch: false, // Vite already has its own watch system
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        VITE_API_URL: 'http://localhost:5000/api'
      },
      error_file: './client/logs/client-error.log',
      out_file: './client/logs/client-output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      restart_delay: 2000,
      min_uptime: 5000,
      max_restarts: 10,
      wait_ready: false, // Vite doesn't use the ready signal
      listen_timeout: 10000,
      kill_timeout: 5000,
    }
  ]
}; 