import pandas as pd

FOLDER = 'astro/planets/'
IN_FILE = FOLDER + 'planetary_elements.csv'


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
    planets_dict = df.to_dict(orient='index')
    return planets_dict
