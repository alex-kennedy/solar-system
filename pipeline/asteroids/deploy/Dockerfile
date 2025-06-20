FROM golang:1.24-alpine AS build

COPY . /solar-system

WORKDIR /solar-system

RUN apk add gcc g++ musl-dev brotli-dev && \
  go build -o /bin/asteroids-deploy ./pipeline/asteroids/deploy

FROM golang:1.24-alpine

RUN apk add brotli

COPY --from=build /bin/asteroids-deploy /bin/asteroids-deploy

ENTRYPOINT ["/bin/asteroids-deploy"]
