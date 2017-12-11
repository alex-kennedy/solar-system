import json
import requests
import datetime
import time
import os

CONFIG_PATH = ".credentials/key.conf"
API_PATH = "https://api.nasa.gov/neo/rest/v1/neo/browse"
FILES_PATH = "~/asteroids/"

today = str(datetime.date.today())

def get_config(path):
    try:
        with open(path) as config_file:
            config = json.load(config_file)
    except ValueError:
        raise ValueError("Could not open config file.")

    return config

if __name__ == '__main__':
    config = get_config(CONFIG_PATH)
    api_key = config['API_KEY']

    today = str(datetime.date.today())

    current_page = 0
    total_pages = 881

    while current_page <= total_pages - 880:
        payload = {'api_key' : api_key, 'page' : current_page}
        response = requests.get(API_PATH, params=payload)

        if response.status_code // 100 != 2:
            raise Exception("Failed response on page {0} \n\tResponse code was {1}".format(current_page, response.status_code))

        try:
            r_json = response.json()
        except ValueError:
            raise ValueError("Failed to convert the response for page {0} to JSON".format(current_page))
            continue

        total_pages = r_json['page']['total_pages']

        file_name = FILES_PATH + today + "/page" + str(current_page) + ".json"

        if not os.path.exists(FILES_PATH + today):
            os.mkdir(FILES_PATH + today)

        with open(file_name, 'w+') as out:
            json.dump(r_json, out, indent=4)

        current_page += 1
