import datetime
import gzip
import json
import logging
import os
import shutil
import time
from datetime import datetime

import brotli
import numpy as np
import pandas as pd
import requests
from tqdm import tqdm

URL = 'http://www.minorplanetcenter.net/iau/MPCORB/MPCORB.DAT.gz'
FOLDER = 'data/asteroids/'
SCHEMA_PATH = 'pipeline/asteroids/schema.json'

logging.basicConfig(level=logging.INFO)  # TODO: Move this out of here
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
        with tqdm(total=content_length, unit_scale=True) as bar:
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
        path (str): path to schema file

    Returns:
        list: dataframe column names
        list: (int, int) half-open intervals corresponding to columns
        list: datatypes of values
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


def tt_epoch_to_unix_s(epoch):
    d = datetime.fromisoformat(epoch).timestamp()
    d -= 67.6439  # see https://en.wikipedia.org/wiki/Terrestrial_Time
    d = round(d)
    return d


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


def get_asteroids_df():
    """Gets a dataframe from raw MPCORB.dat file.

    Returns:
        pandas.DataFrame: Minor planets dataframe.
    """
    n_steps = 6  # Number of steps for measuring progress

    # Read from MPCORB.dat file.
    names, colspecs, dtype = get_schema()
    df = pd.read_fwf(os.path.join(FOLDER, 'asteroids.dat'),
                     names=names,
                     colspecs=colspecs,
                     dtype=dtype,
                     skiprows=43)
    logger.info(f'1/{n_steps} Loaded MPCORB.dat')

    # Drops asteroids with NA flags
    count = df.shape[0]
    df.dropna(inplace=True, subset=['flags'])
    if count - df.shape[0] != 0:
        logger.warning(f'Dropped {count - df.shape[0]} rows with NA flags')
    logger.info(f'2/{n_steps} Checked for NA flags')

    # Unpacks the flags into their columns
    columns = [
        'orbit_type', 'neo', 'neo_1km', 'opposition_seen_earlier',
        'critical_list_numbered', 'pha'
    ]
    unpacked_flags = list(zip(*df['flags'].map(unpack_flags)))
    for i, c in enumerate(columns):
        df[c] = unpacked_flags[i]
    logger.info(f'3/{n_steps} Unpacked flags')

    # Unpacks uncertainty parameter
    columns = ['u_number', 'u_flag']
    unpacked_u = list(zip(*df['u'].map(unpack_uncertainty_parameter)))
    for i, c in enumerate(columns):
        df[c] = unpacked_u[i]
    logger.info(f'4/{n_steps} Unpacked uncertainty parameter')

    # Unpacks and converts epoch
    df['epoch_unpacked'] = df['epoch_packed'].apply(unpack_epoch)
    df['epoch_timestamp'] = df['epoch_unpacked'].apply(
        tt_epoch_to_unix_s).astype(int)
    logger.info(f'5/{n_steps} Unpacked epoch')

    # Converts to radians
    cols = ['m0', 'arg_perihelion', 'long_asc_node', 'i', 'mean_daily_motion']
    for c in cols:
        df[c] = np.deg2rad(df[c].values)
    logger.info(f'6/{n_steps} Converted degrees to radians')
    return df


def get_web_payload(df):
    """Converts a dataframe to unserialised web payload. 

    Note, the `steps` are used to partition the dataframe into categories
    relevant to the front end. This is simply used to keep the size down while
    providing some characterisation for styling and whatnot. Changes should
    correspond to front-end changes.

    Args:
        df (pandas.DataFrame): Dataframe of minor planets. 

    Returns:
        dict: Front-end payload ready to be serialised.

    """
    # Columns to send to the browser
    columns_to_include = [
        'm0', 'epoch_timestamp', 'mean_daily_motion', 'e', 'arg_perihelion',
        'long_asc_node', 'i', 'a'
    ]

    # Processing steps to take (name, filter function, keep/remove)
    steps = (
        ('too_uncertain', lambda d:
         (d['u_number'].values >= 6) | (d['u_number'].values == -1), False),
        ('too_distant', lambda d: d['orbit_type'].values == 10, False),
        ('neo', lambda d: d['neo'].values == 1, True),
        ('hungaria', lambda d: d['orbit_type'].values == 6, True),
        ('trojan', lambda d: d['orbit_type'].values == 8, True),
        ('hilda', lambda d: d['orbit_type'].values == 9, True),
        ('q_bound', lambda d: d['orbit_type'].values == 5, True),
    )

    original_count = df.shape[0]
    dropped = 0

    # Collects into categories
    payload = {}
    for step in steps:
        mask = step[1](df)
        if step[2] is True:
            payload[step[0]] = df.iloc[mask, :][columns_to_include]
        else:
            dropped += len(mask[mask])
        df = df.iloc[~mask, :]
    payload['other'] = df[columns_to_include]

    logger.info(f'{df.shape[0]}/{original_count} in other. {dropped} dropped.')

    # Precision control (linear variables need less precision on the front)
    linear_variables = ['arg_perihelion', 'long_asc_node', 'i', 'a']
    for k, df in payload.items():
        for c in df:
            if c == 'epoch_timestamp':
                df[c] = df[c].astype(int)
            elif c in linear_variables:
                df[c] = df[c].apply(lambda x: float(f'{x:.4e}'))
            else:
                df[c] = df[c].apply(lambda x: float(f'{x:.9e}'))
        payload[k] = df.values.tolist()
    return payload


def write_web_payload(payload, write_uncompressed=False):
    """Serialises and compresses a payload ready for the web.

    Args:
        payload (dict): Payload to be serialised.
        write_uncompressed (bool): Whether to write the uncompressed JSON file.
    """
    uncompressed = json.dumps(payload).encode('utf-8')
    if write_uncompressed:
        with open(os.path.join(FOLDER, 'asteroids.json'), 'wb') as f:
            f.write(uncompressed)

    compressed = brotli.compress(uncompressed)
    with open(os.path.join(FOLDER, 'asteroids.json.br'), 'wb') as f:
        f.write(compressed)


def copy_to_public():
    shutil.copyfile(os.path.join(FOLDER, 'asteroids.json.br'),
                    'app/public/assets/asteroids.json.br')


def run_all(download=True, write_csv=False, write_uncompressed_json=False):
    """Run all the download, processing, and compression steps.

    Args:
        download (bool): Whether to download the MPCORB.dat, or to expect it 
            to be there (for debugging).
        write_csv (bool): Whether to write the full dataframe as a CSV (for
            debugging).
        write_uncompressed_json (bool): Whether to write the uncompressed
            serialisation to JSON before compression (for debugging).
    """
    if download is True:
        download_latest()
    df = get_asteroids_df()
    if write_csv is True:
        df.to_csv(os.path.join(FOLDER, 'asteroids.csv'))
    payload = get_web_payload(df)
    write_web_payload(payload, write_uncompressed_json)
    copy_to_public()


if __name__ == '__main__':
    # Essentially runs in debug mode
    run_all(False, True, True)
