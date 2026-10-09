# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /build

# Install dependencies in their own layer, so source-only changes don't download them again.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.30-alpine

# Address (host:port) of the MockHub server that /api/* is forwarded to.
ENV MOCKHUB_SERVER=mockhub:8083

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /build/dist /usr/share/nginx/html

EXPOSE 80
