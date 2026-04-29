FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY target/quarkus-app/ ./
EXPOSE 8080

CMD ["java", "-Dquarkus.profile=prod", "-jar", "quarkus-run.jar"]
