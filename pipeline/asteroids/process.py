import datetime
import gzip
import json
import logging
import os
import shutil
import time
from datetime import datetime, timezone

import brotli
import numpy as np
import pandas as pd
import requests
from tqdm import tqdm

import mpcorb

FOLDER = 'data/asteroids/'

logger = logging.getLogger(__name__)


def get_web_payload(df, include_other=False):
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
    logger.info('Preparing web payload...')

    # Columns to send to the browser. The six orbital elements for asteroids.
    columns_to_include = [
        'e', 'a', 'i', 'long_asc_node', 'arg_perihelion', 'm0'
    ]

    # Gets the dataframe epoch
    if len(df.epoch_timestamp.unique()) != 1:
        raise ValueError('More than one epoch. Standardise the epochs.')
    epoch = int(df.epoch_timestamp.iloc[0])

    # Processing steps to take (name, filter function, keep/remove)
    steps = (
        ('too_uncertain', lambda d:
         (d['u_number'].values >= 6) | (d['u_number'].values == -1), False),
        ('distant', lambda d: d['orbit_type'].values == 10, False),
        ('neo', lambda d: d['neo'].values == 1, True),
        ('hungaria', lambda d: d['orbit_type'].values == 6, True),
        ('trojan', lambda d: d['orbit_type'].values == 8, True),
        ('hilda', lambda d: d['orbit_type'].values == 9, True),
        ('q_bound', lambda d: d['orbit_type'].values == 5, True),
        ('belt', lambda d:
         (d['q'].values <= 3.27) & (d['q'].values >= 2.06), True),
    )
    original_count = df.shape[0]
    dropped = 0

    # Collects into categories
    asteroids = {}
    for step in steps:
        mask = step[1](df)
        if step[2] is True:
            asteroids[step[0]] = df.iloc[mask, :][columns_to_include]
        else:
            dropped += len(mask[mask])
        df = df.iloc[~mask, :]
    if include_other:
        asteroids['other'] = df[columns_to_include]

    logger.info(f'{df.shape[0]}/{original_count} in the other category. '
                f'{dropped} asteroids dropped.')

    # Precision control (linear variables need less precision client-side)
    linear_variables = ['arg_perihelion', 'long_asc_node', 'i']
    for k, df in asteroids.items():
        for c in df:
            if c in linear_variables:
                df[c] = df[c].apply(lambda x: float(f'{x:.3e}'))
            else:
                df[c] = df[c].apply(lambda x: float(f'{x:.6e}'))
        asteroids[k] = df.values.tolist()

    payload = {}
    payload['asteroids'] = asteroids
    payload['meta'] = {
        'date_created': round(datetime.now(tz=timezone.utc).timestamp()),
        'epoch': epoch
    }
    return payload


def write_web_payload(payload, write_uncompressed=False):
    """Serialises and compresses a payload ready for the web.

    Args:
        payload (dict): Payload to be serialised.
        write_uncompressed (bool): Whether to write the uncompressed JSON file.
    """
    logger.info('Getting and compressing JSON payload...')
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
        mpcorb.download_latest()
    df = mpcorb.get_asteroids_df()
    if write_csv is True:
        df.to_csv(os.path.join(FOLDER, 'asteroids.csv'))
    payload = get_web_payload(df)
    write_web_payload(payload, write_uncompressed_json)
    copy_to_public()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run_all(False, True, True)
