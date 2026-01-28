// httpyac.config.js
module.exports = {
  // options...
  log: {
    level: "info",
    supportAnsiColors: true,
  },
  cookieJarEnabled: true,
  environments: {
    "$shared": {
        "BACKEND_URL": "http://localhost:8080/api",
        "MOCKSERVER": "http://localhost:1080/mockserver"
    },
    "local": {
        "KEYCLOAK_URL": "http://localhost:8000",
    },
    "mock": {
        "KEYCLOAK_URL": "http://localhost:1080",
    }
  }
}