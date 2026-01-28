# Keycloak Demo Project


(c) Aberger (2025)
Do not use this code in a public repository, see [Weniger Klicks bei Onlineportalen](https://orf.at/stories/3406096)
Do not upload any of this code in any form to ChatGPT or other AI - Platforms. This would violate my copyright.


## building
```bash
./build.sh
```

## running

### start the database and keycloak

Open a Terminal and run:
```bash
cd compose
./start.sh
```

### start the backend

Open a 2nd Terminal and run:

```bash
cd application-server
mvn quarkus:dev
```

### start the frontend

Open a 3rd Terminal and run
```bash
cd frontend
npm install
npm start
```
