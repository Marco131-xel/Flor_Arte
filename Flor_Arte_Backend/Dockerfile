
# ETAPA 1: Compilar Spring Boot
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline

COPY src ./src

RUN mvn -B -ntp -DskipTests package

# ETAPA 2: Ejecutar la aplicación
FROM eclipse-temurin:21-jre

WORKDIR /app

RUN useradd --system --uid 10001 --no-create-home appuser

COPY --from=build /app/target/*.jar app.jar

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
