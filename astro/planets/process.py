import pandas as pd
import json

FOLDER = 'astro/planets/'
IN_FILE = FOLDER + 'planetary_elements.csv'
OUT_FILE = FOLDER + 'planetary_elements.json'

def get_planets():
    """
    Construct and return the planets' orbital data from the CSV.

    Returns:
        dict: orbital data
            each planet (or system) has the orbital elements in a list of 
            [value at J2000.0, rate of change per unit century]
    """
    df = pd.read_csv(IN_FILE)
    df = df.groupby('system').agg(lambda x: list(x))

    with open(FOLDER + 'colours.json') as in_file:
        colours = json.load(in_file)

    planets_dict = df.to_dict(orient='index')

    return planets_dict


def save_planets_json(planets_dict):
    """
    Save planets file as a JSON expected by earlier version of the react app. 

    Deprecated.
    """
    with open(OUT_FILE, 'w') as out:
        json.dump(planets_dict, out)


if __name__ == '__main__':
    planets_dict = get_planets()
    # save_planets_json(planets_dict)