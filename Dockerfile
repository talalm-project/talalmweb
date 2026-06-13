FROM node:22-alpine AS build

WORKDIR /app

ARG API_BASE_URL=http://localhost:3000
ARG TOKEN_BEARER=ADMIN_PANEL_TOKEN_BEARER
ARG CURRENT_USER=ADMIN_PANEL_CURRENT_USER
ARG API_VERSION=

ENV API_BASE_URL=${API_BASE_URL}
ENV TOKEN_BEARER=${TOKEN_BEARER}
ENV CURRENT_USER=${CURRENT_USER}
ENV API_VERSION=${API_VERSION}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/public /usr/share/nginx/html

EXPOSE 8000
