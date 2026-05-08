# ══════════════════════════════════════════════════════
#  Stage 1 — Build the JAR with Maven
# ══════════════════════════════════════════════════════
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Download dependencies first (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Build the application
COPY src ./src
RUN mvn package -DskipTests -q

# ══════════════════════════════════════════════════════
#  Stage 2 — Minimal JRE runtime image
# ══════════════════════════════════════════════════════
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Non-root user for security
RUN addgroup -S academy && adduser -S academy -G academy

# Copy the fat JAR
COPY --from=build /app/target/cake-design-academy-1.0.0.jar app.jar

# Uploads directory (mounted as Docker volume for persistence)
RUN mkdir -p /app/uploads && chown -R academy:academy /app

USER academy

EXPOSE 8080

ENTRYPOINT ["java", \
  "-Xmx512m", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.profiles.active=prod", \
  "-jar", "app.jar"]
