#!/usr/bin/env bash

pushd application-server
    mvn --batch-mode clean compile
popd
pushd frontend
    npm install
popd

cat <<EOF

############
To start the application open 3 Terminals
1.  start docker compose

    cd compose
    mvn quarkus:dev

2. start the application-server
    cd application-server
    mvn quarkus:dev

3. start the frontend
    cd frontend
    npm install
    npm start

############

EOF
