"""Module to download and parse the MPCORB.dat file to a pandas.DataFrame."""

import gzip
import json
import logging
import os
import shutil
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import requests
from tqdm import tqdm

URL = 'http://www.minorplanetcenter.net/iau/MPCORB/MPCORB.DAT.gz'
FOLDER = 'data/asteroids/'
SCHEMA_PATH = 'pipeline/asteroids/schema.json'

logger = logging.getLogger(__name__)


def download_latest(chunk_size=1024):
    """Downloads the current MPCORB.dat file.

    See directory of data at:
        https://minorplanetcenter.net/data

    Args:
        chunk_size (int): Size of download chunks in bytes.
    """
    zip_path = os.path.join(FOLDER, 'asteroids.dat.gz')
    unzip_path = os.path.join(FOLDER, 'asteroids.dat')

    response = requests.get(URL, stream=True)
    response.raise_for_status()
    content_length = int(response.headers.get('content-length'))

    logger.info(f"Downloading {zip_path} ...")
    with open(zip_path, 'wb') as dat:
        with tqdm(total=content_length, unit_scale=True, unit='B') as bar:
            for chunk in response.iter_content(chunk_size=chunk_size):
                dat.write(chunk)
                bar.update(chunk_size)

    # Unzip file
    logger.info(f'Unzipping {zip_path} to {unzip_path}')
    with gzip.open(zip_path, 'rb') as f_zipped:
        with open(unzip_path, 'wb') as f_unzipped:
            shutil.copyfileobj(f_zipped, f_unzipped)


def get_schema():
    """Get columns schema from file.

    The schema was drawn from the readme for the MPC orbital data:
        https://www.minorplanetcenter.net/iau/info/MPOrbitFormat.html

    Args:
        path (str): path to schema file.

    Returns:
        list: Dataframe column names.
        list: (int, int) Half-open intervals corresponding to columns.
        list: Datatypes of values.
    """
    with open(SCHEMA_PATH) as schema_file:
        schema = json.load(schema_file)

    dtype_mapping = {'str': str, 'float': np.float64}

    names = [field['column_name'] for field in schema]
    colspecs = [tuple(field['colspec']) for field in schema]

    dtype = {}
    for field in schema:
        dtype[field['column_name']] = dtype_mapping[field['dtype']]
    return names, colspecs, dtype


def packed_letter_to_number(letter):
    """Unpack a letter to the corresponding number according to MPC.

    See:
        https://www.minorplanetcenter.net/iau/info/DesDoc.html

    Args:
        letter (str): Single character to decode.

    Returns:
        int: Corresponding number.
    """
    try:
        int(letter)
        return letter.rjust(2, '0')
    except ValueError:
        ord_letter = ord(letter)
        if ord_letter >= 97 and ord_letter <= 122:
            return str(ord_letter - 61)
        elif ord_letter >= 65 and ord_letter <= 96:
            return str(ord_letter - 55)
        else:
            raise ValueError(f'Letter "{letter}" is invalid')


def unpack_designation(packed):
    """Unpack the asteroid designation in the list of values, MPC format.

    See:
        https://www.minorplanetcenter.net/iau/info/PackedDes.html

    Args:
        packed (str): Packed designation.

    Returns:
        str: Unpacked designation.
    """
    # Tests if the designation is already an integer, e.g. "00001" or "98575"
    try:
        return str(int(packed))
    except ValueError:
        pass

    # Test if the designation is a packed Asteroid Number
    try:
        int(packed[1:])
        tail = packed[1:]
        head = packed_letter_to_number(packed[0])
        return head + tail
    except ValueError:
        pass

    # Test for survey Asteroid formats
    if packed[2] == "S":
        head = packed[3:]
        tail = packed[0] + "-" + packed[1]
        return head + " " + tail

    new_desig = (packed_letter_to_number(packed[0]) + packed[1:3] + " " +
                 packed[3] + packed[6])

    try:
        int(packed[4:6])
        is_int = True
    except ValueError:
        is_int = False

    if is_int:
        if int(packed[4:6]) != 0:
            new_desig += str(int(packed[4:6]))
    else:
        new_desig += packed_letter_to_number(packed[4]) + packed[5]

    return new_desig


def unpack_epoch(epoch_packed):
    """Unpack epoch to date based on MPC format.

    See:
        https://www.minorplanetcenter.net/iau/info/PackedDates.html

    Args:
        epoch_packed (str): Packed epoch string.

    Returns:
        str: Date in yyyy-mm-dd.
    """
    epoch_unpacked = (packed_letter_to_number(epoch_packed[0]) +
                      epoch_packed[1:3] + '-' +
                      packed_letter_to_number(epoch_packed[3]) + '-' +
                      packed_letter_to_number(epoch_packed[4]))
    epoch_unpacked = ''.join([
        packed_letter_to_number(epoch_packed[0]), epoch_packed[1:3], '-',
        packed_letter_to_number(epoch_packed[3]), '-',
        packed_letter_to_number(epoch_packed[4])
    ])
    return epoch_unpacked


def unpack_uncertainty_parameter(u):
    """Unpack uncertainty parameter (integer or single character). 

    See:
        https://www.minorplanetcenter.net/iau/info/MPOrbitFormat.html

    Args:
        u (str): Packed uncertainty parameter.

    Returns:
        int: Uncertainty parameter, or -1 if invalid.
        str: Empty string or letter if uncertainty parameter was invalid.
    """
    try:
        u = int(u)
        u_flag = ''
    except ValueError:
        u_flag = u
        u = -1
    return u, u_flag


def unpack_flags(flags_hex):
    """Unpacks 4-digit hexadecimal flags string.

    Args:
        flags_hex (str): Hexadecimal flags string.

    Returns:
        int: Object type.
        int: Near Earth Object indicator.
        int: If object is 1-km (or larger) Near Earth Object.
        int: 1-opposition object seen at earlier opposition.
        int: Critical list numbered object.
        int: Object is PHA (Potentially Hazardous Asteroid).
    """
    flags = int(flags_hex, 16)

    pha = (flags & 2**15) >> 15
    critical_list_numbered = flags >> 14 & 1
    opposition_seen_earlier = flags >> 13 & 1
    neo_1km = flags >> 12 & 1
    neo = flags >> 11 & 1
    orbit_type = flags & (2**6 - 1)
    return (orbit_type, neo, neo_1km, opposition_seen_earlier,
            critical_list_numbered, pha)


def tt_epoch_to_unix_s(epoch):
    """Converts Terrestrial Time to Unix epoch seconds.

    Args:
        epoch (str): Epoch ISO date (e.g. '2020-01-01').

    Returns:
        float: Unix seconds timestamp of the epoch.
    """
    d = datetime.fromisoformat(epoch).replace(tzinfo=timezone.utc).timestamp()
    d -= 67.6439  # see https://en.wikipedia.org/wiki/Terrestrial_Time
    return d


def shift_mean_anomaly_epoch(df):
    """Shifts the mean anomalies to be at the same epoch.
    
    Args:
        df (pd.DataFrame): MPCORB dataframe.

    Returns:
        pd.DataFrame: Modified dataframe.
    """
    new_epoch = int(df.epoch_timestamp.max())
    mean_motion = df.mean_daily_motion / 86400  # rad/day to rad/s
    df['m0'] = (df.m0 + mean_motion *
                (new_epoch - df.epoch_timestamp)) % (2 * np.pi)
    df['epoch_timestamp'] = new_epoch
    return df


def get_asteroids_df():
    """Gets a dataframe from raw MPCORB.dat file.

    Returns:
        pandas.DataFrame: Minor planets dataframe.
    """
    n_steps = 8  # Number of steps for measuring progress

    # Read from MPCORB.dat file.
    logger.info(f'1/{n_steps}:Loading MPCORB.dat...')
    names, colspecs, dtype = get_schema()
    df = pd.read_fwf(os.path.join(FOLDER, 'asteroids.dat'),
                     names=names,
                     colspecs=colspecs,
                     dtype=dtype,
                     skiprows=43)

    # Drops asteroids with NA flags
    logger.info(f'2/{n_steps}:Checking for NA flags...')
    count = df.shape[0]
    df.dropna(inplace=True, subset=['flags'])
    if count - df.shape[0] != 0:
        logger.warning(f'Dropped {count - df.shape[0]} rows with NA flags')

    # Unpacks the flags into their columns
    logger.info(f'3/{n_steps}:Unpacking flags...')
    columns = [
        'orbit_type', 'neo', 'neo_1km', 'opposition_seen_earlier',
        'critical_list_numbered', 'pha'
    ]
    unpacked_flags = list(zip(*df['flags'].map(unpack_flags)))
    for i, c in enumerate(columns):
        df[c] = unpacked_flags[i]

    # Unpacks uncertainty parameter
    logger.info(f'4/{n_steps}:Unpacking uncertainty parameter...')
    columns = ['u_number', 'u_flag']
    unpacked_u = list(zip(*df['u'].map(unpack_uncertainty_parameter)))
    for i, c in enumerate(columns):
        df[c] = unpacked_u[i]

    # Unpacks and converts epoch
    logger.info(f'5/{n_steps}:Unpacking epoch...')
    df['epoch_unpacked'] = df['epoch_packed'].apply(unpack_epoch)
    df['epoch_timestamp'] = df['epoch_unpacked'].apply(tt_epoch_to_unix_s)

    # Converts to radians
    logger.info(f'6/{n_steps}:Converting degrees to radians...')
    cols = ['m0', 'arg_perihelion', 'long_asc_node', 'i', 'mean_daily_motion']
    for c in cols:
        df[c] = np.deg2rad(df[c].values)

    # Standardises the mean anomalies to the same epoch
    logger.info(f'7/{n_steps}:Standardising epochs...')
    df = shift_mean_anomaly_epoch(df)

    logger.info(f'8/{n_steps}:Calculating perihelion distance...')
    # Calculates perihelion distance q
    df['q'] = df.a * (1 - df.e)

    return df
