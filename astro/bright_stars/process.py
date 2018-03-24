import json

import numpy as np
import pandas as pd

FOLDER = 'astro/bright_stars/'

def get_schema(path):
    # Formatting from: http://tdc-www.harvard.edu/catalogs/bsc5.readme
    with open(path) as schema_file:
        schema = json.load(schema_file)

    labels = [field['label'] for field in schema]
    start_col = [field['start_col'] for field in schema]
    end_col = [field['end_col'] for field in schema]
    dtype = [field['type'] for field in schema]
    return labels, start_col, end_col, dtype


def data_line_to_list(line, start_col, end_col):
    """Split a string to a list of strings by start_col and end_col"""
    separate_values = []
    for i in range(len(start_col)):
        lower = start_col[i] - 1 # -1 due to 0 indexing
        upper = end_col[i]       # -1 due to 0 indexing, +1 due to exclusive indexing

        value = line[lower:upper].strip()
        separate_values.append(value)

    return separate_values


def parse_to_float(df, labels, dtype):
    for i in range(len(labels)):
        if dtype[i] == 'float':
            df[labels[i]] = pd.to_numeric(df[labels[i]])
    return df


def get_ra(rah, ram, ras):
    ra = ((1./24) * rah + (1./1440) * ram + (1./86400) * ras) * 2*np.pi
    return ra


def get_declination(ded, dem, des):
    dec = (ded + (1./60)*dem + (1./3600)*des) * 2*np.pi / 360
    return dec


def get_cartesian(ra, dec, r=100, ndigits=2):
    x = r * np.cos(dec) * np.cos(ra)
    y = r * np.cos(dec) * np.sin(ra)
    z = r * np.sin(dec)

    x = x.apply(round, ndigits=ndigits)
    y = y.apply(round, ndigits=ndigits)
    z = z.apply(round, ndigits=ndigits)
    return x, y, z


def get_intensity(vmag, ndigits=2):
    intensity = vmag.apply(lambda x: (100 ** (1./5)) ** (7.96 - x))
    intensity = intensity.apply(np.log)
    intensity *= 10/intensity.max()
    intensity = intensity.apply(round, ndigits=ndigits)
    return intensity


def process_bright_stars():
    # Load data schema for parsing .dat file
    labels, start_col, end_col, dtype = get_schema(FOLDER + 'schema.json')

    # Load .dat file and split the lines to a list according to the schema
    with open(FOLDER + 'catalog.txt') as dat:
        lines = dat.readlines()
    data = [data_line_to_list(line, start_col, end_col) for line in lines]

    # Create a pd.DataFrame object of the stars, convert correct strings to floats,
    # drop empty rows
    df = pd.DataFrame(data, columns=labels)
    df = parse_to_float(df, labels, dtype)
    df.dropna(subset=['RAh'], inplace=True)

    # Produce derived columns
    derived_cols = {}
    derived_cols['intensity'] = get_intensity(df['Vmag'])
    derived_cols['ra'] = get_ra(df['RAh'], df['RAm'], df['RAs'])
    derived_cols['dec'] = get_declination(df['DEd'], df['DEm'], df['DEs'])

    x, y, z = get_cartesian(derived_cols['ra'], derived_cols['dec'])
    derived_cols['x'] = x
    derived_cols['y'] = y
    derived_cols['z'] = z

    # Produce dataframe from combined cols and concatenate them
    derived_df = pd.DataFrame.from_dict(derived_cols)
    df = pd.concat([df, derived_df], axis=1)

    df.to_csv(FOLDER + 'full.csv')
    df[['intensity', 'x', 'y', 'z']].to_csv(FOLDER + 'bright_stars.csv', index=False)



if __name__ == '__main__':
    process_bright_stars()
