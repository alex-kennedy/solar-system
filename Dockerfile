FROM golang:1.21-alpine

RUN apk add --no-cache --update nodejs npm gcc g++ brotli-dev

COPY . /solar-system

WORKDIR /solar-system
