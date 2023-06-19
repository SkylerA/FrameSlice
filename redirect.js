// redirects.js
const redirects = {
  dev: [],
  prod: [
    { source: "/gg", destination: "/", permanent: false },
    { source: "/inputs", destination: "/", permanent: false },
  ],
};

module.exports = redirects;