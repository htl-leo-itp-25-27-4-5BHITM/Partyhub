FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY target/quarkus-app/ ./
# Copy profile pictures for users to have avatars
COPY src/main/resources/uploads/profiles ./uploads/profiles/
EXPOSE 8080

CMD ["java", "-Dquarkus.profile=prod", "-jar", "quarkus-run.jar"]
