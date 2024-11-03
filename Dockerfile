FROM node:20 AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./ .
ENV NODE_OPTIONS="--openssl-legacy-provider"
RUN npm run build

FROM nginx AS production-stage
RUN mkdir /app
COPY --from=build-stage /app/dist /app
COPY nginx.conf /etc/nginx/nginx.conf