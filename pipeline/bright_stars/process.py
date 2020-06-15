import gzip
import io
import json
import logging
import os

import numpy as np
import pandas as pd
import requests

logging.basicConfig(level=logging.WARNING)  # TODO: Move this out of here
logger = logging.getLogger(__name__)

FOLDER = 'data/bright_stars/'
SCHEMA_PATH = 'pipeline/bright_stars/schema.json'
CATALOG_DOWNLOAD_LOCATION = 'http://tdc-www.harvard.edu/catalogs/bsc5.dat.gz'


def download_catalog():
    """Downloads and unzips the bright star catalog (fixed-width text file).
    
    The file is static, hence the simple check if it exists before downloading.
    """
    file_name = os.path.join(FOLDER, 'catalog.txt')
    if os.path.exists(file_name):
        logger.info('Bright stars catalog exists, skipping download')
        return

    r = requests.get(CATALOG_DOWNLOAD_LOCATION)
    r.raise_for_status()

    zipped_io = io.BytesIO()
    zipped_io.write(r.content)
    zipped_io.seek(0)

    with gzip.GzipFile(fileobj=zipped_io, mode='rb') as zipped_f:
        with open(file_name, 'w') as f:
            f.write(zipped_f.read().decode())


def get_schema(path):
    """Get columns schema from file. 

    The schema was drawn from the readme for the Bright Star Catalogue:
        http://tdc-www.harvard.edu/catalogs/bsc5.readme

    Args:
        path (str): path to schema file

    Returns:
        list: dataframe column names
        list: (int, int) half-open intervals corresponding to columns
        list: datatypes of values
    """
    with open(path) as schema_file:
        schema = json.load(schema_file)

    dtype_mapping = {'str': str, 'float': np.float64}

    names = [field['column_name'] for field in schema]
    colspecs = [tuple(field['colspec']) for field in schema]

    dtype = {}
    for field in schema:
        dtype[field['column_name']] = dtype_mapping[field['dtype']]
    return names, colspecs, dtype


def get_ra(rah, ram, ras):
    """Determine right ascension.

    All parameters should be equinox J2000, epoch 2000.0. 

    Args:
        rah (float): hours right ascension
        ram (float): minutes right ascension
        ras (float): seconds right ascension
    
    Returns:
        float: right ascension in radians
    """
    ra = ((1. / 24) * rah + (1. / 1440) * ram + (1. / 86400) * ras) * 2 * np.pi
    return ra


def get_declination(ded, dem, des):
    """Determine declination angle.
    
    All parameters should be equinox J2000, epoch 2000.0.

    Args:
        ded (float): degrees declination 
        dem (float): minutes declination
        des (float): seconds declination
    
    Returns:
        float: declination in radians
    """
    dec = (ded + (1. / 60) * dem + (1. / 3600) * des) * 2 * np.pi / 360
    return dec


def get_cartesian(ra, dec, r=100):
    """Determines cartesian coordinates of a star on the celestial sphere.

    Note: returns integers for cheaper storage.

    Args:
        ra (float): right ascension in radians
        dec (float): declination in radians
        r (float): radius of the celestial sphere (arbitrary units)

    Returns: 
        int: x coordinate
        int: y coordinate
        int: z coordinate
    """
    x = r * np.cos(dec) * np.cos(ra)
    y = r * np.cos(dec) * np.sin(ra)
    z = r * np.sin(dec)
    return x, y, z


def get_intensity(vmag, ndigits=2):
    """Determine a measure of intensity from the visual magnitude. 

    This value is later used to determine the size of the star rendered on the
    celestial sphere. All sizes normalised to within 0 and 10. 

    Args: 
        vmag (pandas.Series): visual magnitude of the stars

    Returns:
        float: intensity value normalised to (0, 10)
    """
    intensity = vmag.apply(lambda x: (100**(1. / 5))**(7.96 - x))
    intensity = intensity.apply(np.log)
    intensity *= 10 / intensity.max()
    intensity = intensity.apply(round, ndigits=ndigits)
    return intensity


def get_stars_df():
    """Produce an enriched dataframe of the Bright Stars Catalogue.
    
    Parses the Bright Star Catalogue to a Pandas data frame from a schema.
    Script should be run from the repository root directory. 

    Returns:
        panda.DataFrame: enriched dataframe from the catalogue
    """
    names, colspecs, dtype = get_schema(SCHEMA_PATH)
    df = pd.read_fwf(os.path.join(FOLDER, 'catalog.txt'),
                     colspecs=colspecs,
                     names=names,
                     dtype=dtype)

    # There are deleted stars in the catalog which have no RAh.
    df.dropna(subset=['RAh'], inplace=True)

    df.to_csv(FOLDER + '/test.csv')

    df['intensity'] = get_intensity(df['Vmag'])
    df['ra'] = get_ra(df['RAh'], df['RAm'], df['RAs'])
    df['dec'] = get_declination(df['DEd'], df['DEm'], df['DEs'])
    df['x'], df['y'], df['z'] = get_cartesian(df['ra'], df['dec'])
    return df


def process_bright_stars():
    """Produce a JSON of the bright star coordinates."""
    download_catalog()
    df = get_stars_df()
    file_name = os.path.join(FOLDER, 'bright_stars.json')
    cols = ['intensity', 'x', 'y', 'z']
    df[cols].to_json(file_name, orient='values', double_precision=2)


if __name__ == '__main__':
    process_bright_stars()
