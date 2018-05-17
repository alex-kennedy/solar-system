import json

import numpy as np
import pandas as pd

FOLDER = 'astro/bright_stars/'

def get_schema(path):
    """
    Get columns schema from file. 

    The schema was drawn from the readme for the Bright Star Catalogue:
        http://tdc-www.harvard.edu/catalogs/bsc5.readme

    Args:
        path (str): path to schema file

    Returns:
        list: value labels
        list: starting column of values in each row
        list: ending column values in each row
        list: datatypes of values
    """
    with open(path) as schema_file:
        schema = json.load(schema_file)

    labels = [field['label'] for field in schema]
    start_col = [field['start_col'] for field in schema]
    end_col = [field['end_col'] for field in schema]
    dtype = [field['type'] for field in schema]

    return labels, start_col, end_col, dtype


def data_line_to_list(line, start_col, end_col):
    """
    Split a string to a list of strings by start_col and end_col

    Args:
        line (str): a line from the .dat file to parse
        start_col (list): starting column of values in each row
        end_col (list): ending column values in each row

    Returns:
        list: list of strings separated as specified in start and end col
    """
    separate_values = []
    for i in range(len(start_col)):
        lower = start_col[i] - 1 # -1 due to 0 indexing
        upper = end_col[i]       # -1 due to 0 indexing, +1 due to exclusive indexing

        value = line[lower:upper].strip()
        separate_values.append(value)

    return separate_values


def parse_to_float(df, labels, dtype):
    """
    Convert columns of a dataframe to given datatypes

    Args:
        df (pandas.DataFrame): dataframe to process
        labels (list): names of columns to cast to new datatypes
        dtype (list): datatypes corresponding to labels

    Returns: 
        pandas.DataFrame: altered dataframe
    """
    for i in range(len(labels)):
        if dtype[i] == 'float':
            df[labels[i]] = pd.to_numeric(df[labels[i]])

    return df


def get_ra(rah, ram, ras):
    """
    Determine right ascension

    All parameters should be equinox J2000, epoch 2000.0. 

    Args:
        rah (float): hours right ascension
        ram (float): minutes right ascension
        ras (float): seconds right ascension
    
    Returns:
        float: right ascension in radians
    """
    ra = ((1./24) * rah + (1./1440) * ram + (1./86400) * ras) * 2*np.pi
    return ra


def get_declination(ded, dem, des):
    """
    Determine declination angle
    
    All parameters should be equinox J2000, epoch 2000.0.

    Args:
        ded (float): degrees declination 
        dem (float): minutes declination
        des (float): seconds declination
    
    Returns:
        float: declination in radians
    """
    dec = (ded + (1./60)*dem + (1./3600)*des) * 2*np.pi / 360
    return dec


def get_cartesian(ra, dec, r=100, ndigits=2):
    """
    Determines cartesian coordinates of a star on the celestial sphere

    Args:
        ra (float): right ascension in radians
        dec (float): declination in radians
        r (float): radius of the celestial sphere (arbitrary units)
        ndigits (int): number of digits to round results to

    Returns: 
        float: x coordinate
        float: y coordinate
        float: z coordinate
    """
    x = r * np.cos(dec) * np.cos(ra)
    y = r * np.cos(dec) * np.sin(ra)
    z = r * np.sin(dec)

    x = x.apply(round, ndigits=ndigits)
    y = y.apply(round, ndigits=ndigits)
    z = z.apply(round, ndigits=ndigits)
    
    return x, y, z


def get_intensity(vmag, ndigits=2):
    """
    Determine a measure of intensity from the visual magnitude. 

    This value is later used to determine the size of the star rendered on the
    celestial sphere. All sizes normalised to within 0 and 10. 

    Args: 
        vmag (pandas.Series): visual magnitude of the stars

    Returns:
        float: intensity value normalised to (0, 10)
    """
    intensity = vmag.apply(lambda x: (100 ** (1./5)) ** (7.96 - x))
    intensity = intensity.apply(np.log)
    intensity *= 10/intensity.max()
    intensity = intensity.apply(round, ndigits=ndigits)
    
    return intensity


def get_stars_df():
    """
    Produce an enriched dataframe of the Bright Stars Catalogue.
    
    Parses the Bright Star Catalogue to a Pandas data frame from a schema.
    Script should be run from the repository root directory. 

    Returns:
        panda.DataFrame: enriched dataframe from the catalogue
    """
    labels, start_col, end_col, dtype = get_schema(FOLDER + 'schema.json')

    with open(FOLDER + 'catalog.txt') as dat:
        lines = dat.readlines()

    data = [data_line_to_list(line, start_col, end_col) for line in lines]

    df = pd.DataFrame(data, columns=labels)
    df = parse_to_float(df, labels, dtype)
    df.dropna(subset=['RAh'], inplace=True)

    df['intensity'] = get_intensity(df['Vmag'])
    df['ra'] = get_ra(df['RAh'], df['RAm'], df['RAs'])
    df['dec'] = get_declination(df['DEd'], df['DEm'], df['DEs'])

    df['x'], df['y'], df['z'] = get_cartesian(df['ra'], df['dec'], ndigits=2)

    return df


def stars_to_csv(df, file_name):
    """
    Produce a CSV of the bright star catalogue of the form expected by the 
    react app. 

    Deprecated. 

    Args:
        df (pandas.DataFrame): bright stars catalogue data frame
        file_name: path to CSV file
    """
    df[['intensity', 'x', 'y', 'z']].to_csv(file_name, index=False)


if __name__ == '__main__':
    df = get_stars_df()
    stars_to_csv(df, FOLDER + 'bright_stars.csv')
