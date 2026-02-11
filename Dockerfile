FROM eclipse-temurin:25-jre-alpine

WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 80

CMD ["java", "-Dquarkus.profile=prod" , "-jar", "app.jar"]
# ENTRYPOINT ["java", "-jar", "app.jar"]
