# Build pipeline in go
FROM golang:1.21-alpine AS pipeline

RUN apk add --no-cache --update \
  brotli-dev \
  g++ \
  gcc

COPY . /solar-system

RUN go build -C /solar-system/pipeline -o /usr/local/bin/pipeline

# Add web build dependencies
FROM rust:alpine

RUN apk add --no-cache --update \
  libressl-dev \
  g++ \
  gcc \
  nodejs \
  npm

COPY --from=pipeline /usr/local/bin/pipeline /usr/local/bin/pipeline
COPY . /solar-system

WORKDIR /solar-system

RUN npm install && npm run build
