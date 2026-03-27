# Cake Design Academy - Backend API

A production-ready Spring Boot backend for an E-Learning Platform specialized in Cake Design courses.

## Features

- **User Management**: Registration, authentication, profile management
- **Subscription System**: Yearly subscription with PayZone integration
- **Course Management**: Full CRUD for courses, modules, and lessons
- **Video Streaming**: MUX integration for video hosting and streaming
- **Community**: Posts, comments, likes, and discussions
- **Messaging**: Real-time direct messaging with WebSocket
- **Notifications**: In-app and email notifications
- **Certificates**: Auto-generated PDF certificates
- **Payment Processing**: PayZone (CMI Morocco) integration
- **Admin Dashboard**: Complete platform management

## Technology Stack

- **Framework**: Spring Boot 3.2.3
- **Java Version**: 17
- **Database**: PostgreSQL 15+
- **Security**: Spring Security 6 with JWT
- **Video Platform**: MUX
- **Payment Gateway**: PayZone (CMI Morocco)
- **Email**: Spring Mail with Thymeleaf templates
- **WebSocket**: STOMP over SockJS
- **API Documentation**: OpenAPI/Swagger
- **Migrations**: Flyway

## Project Structure

```
src/main/java/com/academy/
├── config/          # Configuration classes
├── controller/      # REST API controllers
├── dto/
│   ├── request/     # Request DTOs
│   └── response/    # Response DTOs
├── entity/          # JPA entities
│   └── enums/       # Enumerations
├── exception/       # Custom exceptions
├── integration/
│   ├── mux/         # MUX video integration
│   └── payzone/     # PayZone payment integration
├── repository/      # JPA repositories
├── security/        # Security components
├── service/
│   └── impl/        # Service implementations
├── util/            # Utility classes
└── websocket/       # WebSocket configuration
```

## Prerequisites

- Java 17 or higher
- Maven 3.8+
- PostgreSQL 15+
- MUX account (for video hosting)
- PayZone merchant account (for payments)
- SMTP server (for emails)

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd academy-backend
```

### 2. Set up PostgreSQL

```sql
CREATE DATABASE academy_db;
CREATE USER academy_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE academy_db TO academy_user;
```

### 3. Configure environment variables

Create a `.env` file or set these environment variables:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=academy_db
DB_USERNAME=academy_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-256-bit-secret-key-base64-encoded

# MUX
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
MUX_SIGNING_KEY_ID=your_signing_key_id
MUX_SIGNING_PRIVATE_KEY=your_private_key
MUX_WEBHOOK_SECRET=your_webhook_secret

# PayZone
PAYZONE_API_URL=https://api.payzone.ma
PAYZONE_MERCHANT_ID=your_merchant_id
PAYZONE_API_KEY=your_api_key
PAYZONE_SECRET_KEY=your_secret_key
PAYZONE_CALLBACK_URL=https://your-domain.com/api/v1/payments/webhook
PAYZONE_RETURN_URL=https://your-frontend.com/payment/callback

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# App
FRONTEND_URL=http://localhost:3000
FILE_UPLOAD_DIR=./uploads
FILE_BASE_URL=http://localhost:8080
```

### 4. Build and run

```bash
# Build
mvn clean package -DskipTests

# Run
java -jar target/cake-design-academy-1.0.0.jar
```

Or with Maven:

```bash
mvn spring-boot:run
```

### 5. Access the API

- API Base URL: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- API Docs: `http://localhost:8080/v3/api-docs`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/verify-email` - Verify email
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/me` - Get current user

### Courses
- `GET /api/v1/courses` - List all courses
- `GET /api/v1/courses/{id}` - Get course details
- `GET /api/v1/courses/{id}/curriculum` - Get course curriculum
- `POST /api/v1/courses/{id}/enroll` - Enroll in course
- `GET /api/v1/courses/my-courses` - Get enrolled courses

### Subscriptions
- `GET /api/v1/subscriptions/plans` - Get subscription plans
- `POST /api/v1/subscriptions/subscribe` - Subscribe
- `GET /api/v1/subscriptions/my-subscription` - Get subscription status
- `POST /api/v1/subscriptions/cancel` - Cancel subscription

### Community
- `GET /api/v1/community/posts` - Get posts
- `POST /api/v1/community/posts` - Create post
- `POST /api/v1/community/posts/{id}/like` - Like post
- `POST /api/v1/community/posts/{id}/comments` - Add comment

### Messages
- `GET /api/v1/messages/conversations` - Get conversations
- `POST /api/v1/messages/send` - Send message

## Production Deployment

### VPS Deployment Guide

#### 1. Server Requirements

- Ubuntu 22.04 LTS or similar
- 4GB RAM minimum
- 50GB storage
- Java 17 runtime

#### 2. Install dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 17
sudo apt install openjdk-17-jdk -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y
```

#### 3. Configure PostgreSQL

```bash
sudo -u postgres psql

CREATE DATABASE academy_db;
CREATE USER academy_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE academy_db TO academy_user;
\q
```

#### 4. Create application directory

```bash
sudo mkdir -p /opt/academy
sudo mkdir -p /opt/academy/uploads
sudo mkdir -p /opt/academy/logs

# Copy JAR file
sudo cp target/cake-design-academy-1.0.0.jar /opt/academy/
```

#### 5. Create systemd service

```bash
sudo nano /etc/systemd/system/academy.service
```

```ini
[Unit]
Description=Cake Design Academy Backend
After=syslog.target network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/academy
ExecStart=/usr/bin/java -jar -Dspring.profiles.active=prod cake-design-academy-1.0.0.jar
SuccessExitStatus=143
TimeoutStopSec=10
Restart=always
RestartSec=5

# Environment variables
Environment="DB_HOST=localhost"
Environment="DB_PORT=5432"
Environment="DB_NAME=academy_db"
Environment="DB_USERNAME=academy_user"
Environment="DB_PASSWORD=your_password"
Environment="JWT_SECRET=your_jwt_secret"
Environment="SPRING_PROFILES_ACTIVE=prod"
# Add other environment variables...

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable academy
sudo systemctl start academy
```

#### 6. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/academy
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    client_max_body_size 100M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/academy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

### Monitoring

Check application status:
```bash
sudo systemctl status academy
```

View logs:
```bash
sudo journalctl -u academy -f
```

## MUX Webhook Setup

Configure MUX webhooks at `https://dashboard.mux.com`:

- Webhook URL: `https://api.yourdomain.com/api/v1/mux/webhook`
- Events: `video.asset.ready`, `video.asset.errored`, `video.upload.asset_created`

## PayZone Webhook Setup

Configure PayZone webhooks in merchant dashboard:

- Webhook URL: `https://api.yourdomain.com/api/v1/payments/webhook`

## Security Considerations

1. **JWT Secret**: Use a strong, random 256-bit key
2. **Database**: Use strong passwords, limit network access
3. **HTTPS**: Always use SSL in production
4. **CORS**: Configure allowed origins properly
5. **File Uploads**: Validate file types and sizes
6. **Rate Limiting**: Implement rate limiting for auth endpoints

## Support

For issues and questions, please open an issue on GitHub.

## License

Private - All rights reserved.
