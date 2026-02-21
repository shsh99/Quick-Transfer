FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./
COPY common/build.gradle common/
COPY common/src common/src
COPY account-service/build.gradle account-service/
COPY account-service/src account-service/src

RUN chmod +x ./gradlew && ./gradlew :account-service:bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/account-service/build/libs/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
