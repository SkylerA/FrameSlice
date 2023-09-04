// redirects.js
const redirects = {
  dev: [],
  prod: [
    // Re-routing WIP features to main index
    { source: "/gg", destination: "/", permanent: false },
    { source: "/inputs", destination: "/", permanent: false },
  ],
};

module.exports = redirects;
