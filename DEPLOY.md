# 🚀 Deploy to Server

## Files created (don't touch local dev files)

```
Plateform/
├── docker-compose.yml          ← orchestrates all services
├── .env.docker                 ← your server config (edit this)
├── academy-backend/
│   └── Dockerfile              ← builds the Spring Boot JAR
└── template/
    ├── Dockerfile              ← builds React + runs Nginx
    └── nginx/
        └── nginx.conf          ← Nginx: port 80, proxy to backend
```

## Architecture on server

```
Internet
   │  port 80
   ▼
[Nginx + React]  ← frontend container
   ├── /            → serves React static files
   ├── /api/*       → proxies to backend:8080
   ├── /files/*     → proxies to backend:8080
   └── /ws/*        → proxies to backend:8080 (WebSocket)
        │
        ▼
   [Spring Boot]   ← backend container (internal only)
        │
        ▼
   [PostgreSQL]    ← db container (internal only)
```

## Steps

### 1. On your server — install Docker
```bash
curl -fsSL https://get.docker.com | sh
```

### 2. Copy project to server
```bash
# From your machine:
scp -r C:/Users/PC/Plateform user@YOUR_SERVER_IP:/opt/academy
```
Or use Git:
```bash
git clone your-repo /opt/academy
```

### 3. Edit .env.docker
```bash
cd /opt/academy
nano .env.docker
```
Change **only** this line:
```
SERVER_IP=YOUR_SERVER_IP   ← replace with your actual server IP
```
All other values are already filled from local dev.

### 4. Build and start
```bash
docker compose --env-file .env.docker up -d --build
```

### 5. Check status
```bash
docker compose ps
docker compose logs -f backend    # watch Spring Boot logs
docker compose logs -f frontend   # watch Nginx logs
```

### 6. Access the app
Open browser: `http://YOUR_SERVER_IP`

---

## Update after code changes
```bash
docker compose --env-file .env.docker up -d --build
```
Only changed services rebuild. DB data is preserved in Docker volumes.

## Stop
```bash
docker compose down
```

## Reset everything (⚠️ deletes database!)
```bash
docker compose down -v
```
