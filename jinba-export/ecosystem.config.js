module.exports = {
  apps: [{
    name: 'jinba-export',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/pm2/err.log',
    out_file: './logs/pm2/out.log',
    merge_logs: true,
    watch: false,
    max_restarts: 10,
    restart_delay: 3000,
    min_uptime: '10s',
  }]
};
