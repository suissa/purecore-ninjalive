module.exports = {
  apps: [
    {
      name: "ninjameeting",
      script: "./server/index.js",
      env: {
        NODE_ENV: "production",
        PORT: 2000
      }
    },
    {
      name: "ninjameeting-proxy",
      cwd: "./browser-proxy",
      script: "index.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    }
  ]
};
