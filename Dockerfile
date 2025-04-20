# Build pipeline in go
FROM golang:1.24-alpine AS pipeline

RUN apk add --no-cache --update \
  brotli-dev \
  g++ \
  gcc

COPY . /solar-system

RUN go build -C /solar-system/pipeline -o /usr/local/bin/pipeline

FROM node:23-slim

COPY --from=pipeline /usr/local/bin/pipeline /usr/local/bin/pipeline
COPY . /solar-system

WORKDIR /solar-system

RUN npm install && npm run build
