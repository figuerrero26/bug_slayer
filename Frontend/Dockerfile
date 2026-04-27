FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Variables inyectadas en build-time desde docker-compose.yml
ARG VITE_SEARCH_URL=/api/search
ARG VITE_DASHBOARD_URL=/api/dashboard
ENV VITE_SEARCH_URL=$VITE_SEARCH_URL
ENV VITE_DASHBOARD_URL=$VITE_DASHBOARD_URL

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
