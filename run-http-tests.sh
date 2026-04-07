#!/bin/bash
mvn test -DskipTests=false > /dev/null
TEST_EXIT=$?
sleep 2
mvn quarkus:dev -Dquarkus.profile=test -Dquarkus.http.test-port=8082 -Dquarkus.http.port=8082 > /dev/null 2>&1 &
QUARKUS_PID=$!
sleep 25
cd api && npm test
NPM_EXIT=$?
kill $QUARKUS_PID 2>/dev/null
exit $(($TEST_EXIT || $NPM_EXIT))