FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./
COPY common/build.gradle common/
COPY common/src common/src
COPY notification-service/build.gradle notification-service/
COPY notification-service/src notification-service/src

RUN chmod +x ./gradlew && ./gradlew :notification-service:bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/notification-service/build/libs/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
