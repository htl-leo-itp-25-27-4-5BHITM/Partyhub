#!/bin/bash
mvn test -DskipTests=false > /dev/null
TEST_EXIT=$?
sleep 2
mvn quarkus:dev -Dquarkus.profile=test -Dquarkus.http.test-port=8080 -Dquarkus.http.port=8080 > /dev/null 2>&1 &
QUARKUS_PID=$!
sleep 10
cd api && npm test >> tests.log
NPM_EXIT=$?
kill $QUARKUS_PID 2>/dev/null
exit $(($TEST_EXIT || $NPM_EXIT))