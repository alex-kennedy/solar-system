FROM python:3

WORKDIR /app

ADD . /app

RUN pip install --trusted-host pypi.python.org -r astro/requirements.txt

ENV GOOGLE_APPLICATION_CREDENTIALS app/.credentials/site-update-back-end.json

CMD ["python", "astro/docker_test.py"]

EXPOSE 80
