module.exports = {
  apps : [
    {
      name: "seguranca-ninja",
      script: "./server/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "development",
        PORT: 7007
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 7007
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 7007
      }
    },
    {
      name: "seguranca-ninja-proxy",
      script: "./browser-proxy/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "development",
        PORT: 3001
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3001
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001
      }
    },
    {
      name: "seguranca-ninja-site",
      cwd: "./site",
      script: "npm",
      args: "run dev -- --host",
      env: {
        NODE_ENV: "development",
        PORT: 5173
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 5173
      },
      env_production: {
        NODE_ENV: "production",
        script: "npm",
        args: "run preview -- --host"
      }
    }
  ]
};
