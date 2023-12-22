FROM golang:1.21-alpine

RUN apk add --no-cache --update \
  bash \
  brotli-dev \
  g++ \
  gcc \
  libressl-dev \
  nodejs \
  npm \
  && rustup-init -y

COPY . /solar-system

WORKDIR /solar-system

RUN go build -C /solar-system/pipeline -o /usr/local/bin/pipeline . \
  && npm install
