# Basis-Java-Image
FROM eclipse-temurin:25-jre-alpine

# Arbeitsverzeichnis
WORKDIR /app

# JAR-Datei ins Image kopieren
COPY target/*.jar app.jar

# Port (optional)
EXPOSE 8080

# Startbefehl
ENTRYPOINT ["java", "-jar", "app.jar"]
