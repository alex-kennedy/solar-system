FROM alpine:3.15


RUN apk add --no-cache --update python3 py3-pip py3-pandas py3-numpy \
  py3-brotli npm build-base

COPY . /solar-system

RUN python3 -m pip install --upgrade pip \
  && python3 -m pip install -r /solar-system/requirements.txt \
  && cd /solar-system/app && npm install
