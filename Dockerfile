FROM python:3

WORKDIR /app

ADD . /app

RUN pip install --trusted-host pypi.python.org -r requirements.txt

ENV GOOGLE_APPLICATION_CREDENTIALS app/.credentials/site-update-back-end.json

EXPOSE 80
