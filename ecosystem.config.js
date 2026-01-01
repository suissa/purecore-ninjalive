module.exports = {
  apps : [{
    name: "ninjalive SERVER",
    script: "./server/index.js",
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: "development",
      PORT: 7007
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 7007
    }
  }]
};
