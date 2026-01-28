# compose-spec.json fails with valid include in docker-compose.yaml file

## Problem: include statement is not supported by schema
Using [compose-spec.json](https://raw.githubusercontent.com/compose-spec/compose-spec/master/schema/compose-spec.json) with a valid docker file reports a syntax error when a valid [include](https://docs.docker.com/compose/multiple-compose-files/include/) is used.

## Steps to reproduce:

### 1. Install latest version of docker
### 2. create a new folder and make it your working directory.
```bash
mkdir -p scratch
cd scratch
```
### 3. Write a compose file for the hello-world image and save it as hello.yaml in the current folder:
```yaml
services:
  hello:
    image: hello-world:latest
```

### 4. Save a docker-compose.yaml file in the current folder with the following contents:

```yaml
include:
  - hello.yaml
```

### 5. Verify that docker compose works with these files without problems:
Run the following:
```bash
docker compose up --build
```
You should see that everything works.

### 6. Syntax check with compose-check.json

Do a syntax check of the docker-compose.yaml file. It will report an error.

Example: If you want to do the check from the command-line, do the following:
```bash
sudo apt update
sudo apt -y upgrade
sudo apt -y install curl nodejs npm
npm init -y
npm install yaml-schema-validator
curl -L -o compose-spec.json https://raw.githubusercontent.com/compose-spec/compose-spec/master/schema/compose-spec.json
curl -L -o json-schema.json https://json-schema.org/draft/2019-09/schema#

cat <<EOF > test-scheme.js
const validateSchema = require('yaml-schema-validator')

// validate a json OR yml file
validateSchema('docker-compose.yaml', {
  schemaPath: 'json-schema.json' // can also be schema.json
})
EOF
node test-scheme.js
```

## Current Situation
Output:
```
ERROR : ====== Schema Validation Error ======
ERROR : 0 mismatches and 1 warnings found.
1. include is not present in schema
```


You get the error message that include is not present in the schema, which contradicts [docker compose include documentation](https://docs.docker.com/compose/multiple-compose-files/include/).

## Expected Behaviour

Checking a valid docker compose file with the compose-spec.json scheme should not report an error.
