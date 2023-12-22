FROM golang:1.21-alpine

RUN apk add --no-cache --update nodejs npm gcc g++ brotli-dev bash

COPY . /solar-system

WORKDIR /solar-system

RUN go build -C /solar-system/pipeline -o /usr/local/bin/pipeline . && \
  npm install
