module.exports = {
  apps : [
    {
      name: "ninjameeting",
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
      name: "ninjameeting-proxy",
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
      name: "Ninjameeting site",
      cwd: "./site",
      script: "npm",
      args: "run dev",
      env: {
        NODE_ENV: "development",
        PORT: 5173
      },
      env_development: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production",
        script: "npm",
        args: "run preview"
      }
    }
  ]
};
