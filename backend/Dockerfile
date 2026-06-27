# --- build stage ---
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# --- runtime stage ---
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# 클라우드(예: Railway)는 $PORT를 주입한다. application.yml의 server.port=${PORT:8080} 와 연동.
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
