# ══════════════════════════════════════════════════════
#  Stage 1 — Build the React app
# ══════════════════════════════════════════════════════
FROM node:20-alpine AS build
WORKDIR /app

# Build-time arguments (baked into the JS bundle)
ARG REACT_APP_API_URL
ARG REACT_APP_WS_URL
ARG REACT_APP_NAME=Academy
ARG REACT_APP_MUX_ENV_KEY

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
ENV REACT_APP_NAME=$REACT_APP_NAME
ENV REACT_APP_MUX_ENV_KEY=$REACT_APP_MUX_ENV_KEY

# Install dependencies (cached unless package-lock changes)
COPY package*.json ./
RUN npm ci --silent

# Build production bundle
COPY . .
RUN npm run build

# ══════════════════════════════════════════════════════
#  Stage 2 — Serve with Nginx (reverse proxy + SPA)
# ══════════════════════════════════════════════════════
FROM nginx:1.27-alpine

# Replace default Nginx config with ours
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React files
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
