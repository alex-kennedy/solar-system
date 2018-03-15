import datetime
import difflib
import json
import os
import time

import requests
from google.api_core.exceptions import BadRequest, NotFound
from google.cloud import bigquery, datastore, storage
from tqdm import tqdm


URL = 'http://www.minorplanetcenter.net/iau/MPCORB/MPCORB.DAT'
FOLDER = 'astro/asteroids/'
GCLOUD_STORAGE_BUCKET = 'asteroid-data'
BIGQUERY_DATASET_ID = 'asteroids_data'


#-------------------------------------------------------------------------------
#  Helper Functions
#-------------------------------------------------------------------------------

def get_schema(path):
    # Formatting from: https://www.minorplanetcenter.net/iau/info/MPOrbitFormat.html
    with open(path) as schema_file:
        return json.load(schema_file)


def join_list(list_to_join, sep=','):
    """Combine a list of objects into one string separated by sep."""
    string = sep.join([str(i) for i in list_to_join])
    return string


def write_header(out_file, col_names):
    """Add a header to the .csv outfile, determined by the list col_names"""
    header_string = join_list(col_names)
    out_file.write(header_string + '\n')


def data_line_to_list(line, start_col, end_col):
    """Split a string to a list of strings by start_col and end_col"""
    separate_values = []
    for i in range(len(start_col)):
        lower = start_col[i] - 1 # -1 due to 0 indexing
        upper = end_col[i]       # -1 due to 0 indexing, +1 due to exclusive indexing

        value = line[lower:upper].strip()
        separate_values.append(value)

    return separate_values


#-------------------------------------------------------------------------------
#  Minor Planet Centre site interaction
#-------------------------------------------------------------------------------

def download_latest():
    chunk_size = 1024

    response = requests.get(URL, stream=True)
    assert response.status_code == 200

    content_length = int(response.headers.get('content-length'))

    print("Downloading {0}.dat file...".format(FOLDER + "asteroids"))
    with open(FOLDER + "asteroids" + '.dat', 'wb') as dat:
        for chunk in tqdm(response.iter_content(chunk_size=chunk_size), total=round(content_length/chunk_size), unit='KB'):
            dat.write(chunk)
    print('Finished writing .dat file')


#-------------------------------------------------------------------------------
#  Process MPC .dat file to .csv file
#-------------------------------------------------------------------------------

def packed_letter_to_number(letter):
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
            raise ValueError('Letter argument not a number or letter.')


def unpack_designation(packed_designation):
    """Unpack the asteroid designation in the list of values, MPC format"""

    # Test if the designation is already an integer, e.g. "00001" or "98575"
    try:
        unpacked = str(int(packed_designation))
        return unpacked
    except ValueError:
        pass

    # Test if the designation is a packed Asteroid Number
    try:
        int(packed_designation[1:])
        tail = packed_designation[1:]
        head = packed_letter_to_number(packed_designation[0])
        return head + tail
    except ValueError:
        pass

    # Test for survey Asteroid formats
    if packed_designation[2] == "S":
        head = packed_designation[3:]
        tail = packed_designation[0] + "-" + packed_designation[1]
        return head + " " + tail

    new_desig = (packed_letter_to_number(packed_designation[0]) +
                 packed_designation[1:3] +
                 " " +
                 packed_designation[3] +
                 packed_designation[6])

    try:
        int(packed_designation[4:6])
        is_int = True
    except ValueError:
        is_int = False

    if is_int:
        if int(packed_designation[4:6]) != 0:
            new_desig += str(int(packed_designation[4:6]))
    else:
        new_desig += packed_letter_to_number(packed_designation[4]) + packed_designation[5]

    return new_desig


def unpack_uncertainty_parameter(u):
    try:
        u = int(u)
        u_flag = ''
    except ValueError:
        u_flag = u
        u = -1

    return u, u_flag


def unpack_epoch(epoch_packed):
    """Unpack epoch to date based on MPC format"""
    epoch_unpacked = (packed_letter_to_number(epoch_packed[0]) +
                      epoch_packed[1:3] +
                      '-' +
                      packed_letter_to_number(epoch_packed[3]) +
                      '-' +
                      packed_letter_to_number(epoch_packed[4]))

    return epoch_unpacked


def unpack_flags(flags_hex):
    flags = int(flags_hex, 16)

    pha = flags // 2**15
    flags %= 2**15

    critical_list_numbered = flags // 2**14
    flags %= 2**14

    opposition_seen_earlier = flags // 2**13
    flags %= 2**13

    neo_1km = flags // 2**12
    flags %= 2**12

    neo = flags // 2**11
    flags %= 2**6

    orbit_type = flags

    return orbit_type, neo, neo_1km, opposition_seen_earlier, critical_list_numbered, pha


def place_in_list(new_names, new_values, schema_names, current_values):
    if type(new_values) is not tuple:
        new_values = (new_values, )

    for i in range(len(new_names)):
        index = schema_names.index(new_names[i])

        current_len = len(current_values)
        if current_len <= index:
            current_values += [None] * (index - current_len + 1)

        current_values[index] = new_values[i]
    return current_values


def process_small_bodies(schema):
    col_names = [field['name'] for field in schema]
    start_col = [field.get('start_col') for field in schema if field.get('start_col') is not None]
    end_col = [field.get('end_col') for field in schema if field.get('end_col') is not None]

    with open(FOLDER + "asteroids.dat", "r") as dat, \
         open(FOLDER + "asteroids.csv", "w") as csv:

        write_header(csv, col_names)

        # Skip the 43 header rows in the .dat file
        for i in range(43):
            dat.readline()

        for line in tqdm(dat, unit='lines'):
            if len(line) < 10:
                continue

            values = data_line_to_list(line, start_col, end_col)

            # Replace packed with unpacked designation
            designation = values[col_names.index('designation')]
            values = place_in_list(['designation'], unpack_designation(designation), col_names, values)

            # Uncertainty parameter and uncertainty flag
            u = values[col_names.index('u')]
            values = place_in_list(['u', 'u_flag'], unpack_uncertainty_parameter(u), col_names, values)

            # Epoch
            epoch_packed = values[col_names.index('epoch')]
            values = place_in_list(['epoch'], unpack_epoch(epoch_packed), col_names, values)

            # Flags
            new_names = ['orbit_type', 'neo', 'neo_1km', 'opposition_seen_earlier', 'critical_list_numbered', 'pha']
            flags = values[col_names.index('flags')]
            values = place_in_list(new_names, unpack_flags(flags), col_names, values)

            string = join_list(values)
            csv.write(string + '\n')


#-------------------------------------------------------------------------------
#  Determine changes to be made to Google Cloud Datastore, make those changes
#-------------------------------------------------------------------------------

def check_for_changes():
    over_write_keys = []

    with open(FOLDER + "asteroids_previous.csv", 'r') as new:
        new = new.readlines()
    with open(FOLDER + "asteroids.csv", 'r') as old:
        old = old.readlines()


    diff = difflib.unified_diff(new, old, n=0)      # provide no context (n=0)
    count = 0
    with open(FOLDER + "overwrites.csv", 'w') as outfile:
        for diff_line in diff:
            if diff_line.startswith("+") and not diff_line.startswith("++"):
                count += 1

                line = diff_line[1:]
                key = line.split(",")[0]
                over_write_keys.append(key)
                outfile.write(line)
    print("{0} write operations to be made.".format(count))

    diff = difflib.unified_diff(new, old, n=0)      # reset diff generator
    count = 0
    with open(FOLDER + "deletions.csv", 'w') as outfile:
        for diff_line in diff:
            if diff_line.startswith("-") and not diff_line.startswith("--"):
                line = diff_line[1:]
                key = line.split(",")[0]

                if key not in over_write_keys:
                    count += 1
                    outfile.write(line)
    print("{0} delete operations to be made.".format(count))


def read_in_chunks(file_object, num_lines=500):
    while True:
        chunk = []
        for _ in range(num_lines):
            data = file_object.readline()

            if data:
                chunk.append(data)
            else:
                break

        if not chunk:
            break

        yield chunk


def parse_line(line, schema):
    """Convert a list of strings to their types as specified in the schema"""
    assert type(line) is list
    assert len(line) == len(schema)

    bigquery_field = [field['bigquery_field'] for field in schema]

    for i in range(len(line)):
        try:
            if bigquery_field[i] == 'FLOAT':
                line[i] = float(line[i])
            elif bigquery_field[i] == 'INTEGER':
                line[i] = int(line[i])
            elif bigquery_field[i] == 'BOOLEAN':
                line[i] = bool(int(line[i]))
            elif bigquery_field[i] == 'DATETIME':
                line[i] = datetime.datetime.strptime(line[i], '%Y-%m-%d')
        except ValueError:
            line[i] = None


def get_datastore_put_tasks(chunk, schema, client):
    field_names = [field['name'] for field in schema]
    tasks = []
    for line in chunk:
        line = line.strip().split(',')
        parse_line(line, schema)

        asteroid = dict(zip(field_names, line))
        task_key = client.key('asteroid', asteroid['designation'])
        del asteroid['designation']

        task = datastore.Entity(
            key=task_key,
            exclude_from_indexes=[field['name'] for field in schema if field['datastore_indexed'] is False])
        task.update(asteroid)
        tasks.append(task)

    return tasks


def put_to_datastore(tasks, client):
    try:
        client.put_multi(tasks)
    except BadRequest:
        # Attempt same request with duplicates removed
        unduplicated = []
        keys = []
        for task in tasks:
            if task.key not in keys:
                unduplicated.append(task)
                keys.append(task.key)
        client.put_multi(unduplicated)


def get_datastore_delete_keys(chunk, schema, client):
    field_names = [field['name'] for field in schema]
    keys = []
    for line in chunk:
        line = line.strip().split(',')
        parse_line(line, schema)

        designation = line[field_names.index('designation')]
        key = client.key('asteroid', designation)
        keys.append(key)

    return keys


def delete_from_datastore(keys, client):
    try:
        client.delete_multi(keys)
    except BadRequest:
        unduplicated = []
        for key in keys:
            if key not in unduplicated:
                unduplicated.append(key)
        client.delete_multi(unduplicated)


def gcloud_update_datastore(schema):
    client = datastore.Client()
    field_names = [field['name'] for field in schema]

    count = 0
    with open(FOLDER + 'overwrites.csv') as overwrites_file_object, \
        open(FOLDER + 'successful_overwrites.csv', 'w') as successful:
        overwrites = read_in_chunks(overwrites_file_object, num_lines=500)
        for chunk in overwrites:
            tasks = get_datastore_put_tasks(chunk, schema, client)
            put_to_datastore(tasks, client)
            successful.write(''.join(chunk))
            count += len(tasks)
            print("Placed {} entities to Google Datastore ({} total)".format(len(tasks), count))

    count = 0
    with open(FOLDER + 'deletions.csv') as deletions_file_object, \
        open(FOLDER + 'successful_deletions.csv', 'w') as successful:
        deletions = read_in_chunks(deletions_file_object, num_lines=500)
        for chunk in deletions:
            keys = get_datastore_delete_keys(chunk, schema, client)
            delete_from_datastore(tasks, client)
            successful.write(''.join(chunk))
            count += len(tasks)
            print("Deleted {} entities to Google Datastore ({} total)".format(len(tasks), count))


#-------------------------------------------------------------------------------
#  Upload complete .csv to Google Cloud Bigquery
#-------------------------------------------------------------------------------

def gcloud_update_bigquery(schema):
    client = bigquery.Client()
    dataset = client.dataset(BIGQUERY_DATASET_ID)

    job_config = bigquery.LoadJobConfig()
    job_config.source_format = 'CSV'
    job_config.skip_leading_rows = 1
    job_config.schema = [bigquery.SchemaField(field['name'], field['bigquery_field']) for field in schema]

    # Delete and reload
    try:
        client.delete_table(dataset.table('asteroids'))
    except NotFound:
        pass

    print('Beginning load job from Cloud Storage to BigQuery...')
    with open(FOLDER + 'asteroids.csv', 'rb') as file_obj:
        load_job = client.load_table_from_file(
            file_obj,
            dataset.table('asteroids'),
            job_config=job_config
        )
    load_job.result()
    assert load_job.state == 'DONE'
    print('BigQuery job completed successfully.')


#-------------------------------------------------------------------------------
#  Google Cloud Storage interaction
#-------------------------------------------------------------------------------

def gcloud_download_previous():
    client = storage.Client()
    bucket = client.bucket(GCLOUD_STORAGE_BUCKET)
    assert bucket.exists()

    print("Downloading previous asteroid set...")
    blob = bucket.blob('asteroids_previous.csv')
    blob.download_to_filename(FOLDER + "asteroids_previous.csv")
    print("Previous asteroid set downloaded successfully.")


def glcoud_update_storage():
    client = storage.Client()
    bucket = client.bucket(GCLOUD_STORAGE_BUCKET)
    assert bucket.exists()

    blob = bucket.blob('asteroids_previous.csv')
    blob.upload_from_filename(FOLDER + 'asteroids_previous.csv')
    print("Successfully wrote CSV to google cloud.")


#-------------------------------------------------------------------------------
#  Ready workspace for next download
#-------------------------------------------------------------------------------

def get_num_lines_in_file(file_path):
    count = 0
    with open(file_path) as f:
        for line in f:
            count += 1

    return count


def consolidate_local_files():
    n_overwrites = get_num_lines_in_file(FOLDER + 'overwrites.csv')
    n_successful_overwrites = get_num_lines_in_file(FOLDER + 'successful_overwrites.csv')
    if n_overwrites == n_successful_overwrites:
        print('Correct number of successful overwrites.')
    else:
        pass
        #raise Exception('Number of successful overwrites != overwrites. Exiting.')

    n_deletions = get_num_lines_in_file(FOLDER + 'deletions.csv')
    n_successful_deletions = get_num_lines_in_file(FOLDER + 'successful_deletions.csv')
    if n_deletions == n_successful_deletions:
        print('Correct number of successful deletions.')
    else:
        raise Exception('Number of successful deletions != deletions. Exiting.')

    os.remove(FOLDER + 'overwrites.csv')
    os.remove(FOLDER + 'successful_overwrites.csv')
    os.remove(FOLDER + 'deletions.csv')
    os.remove(FOLDER + 'successful_deletions.csv')
    os.remove(FOLDER + 'asteroids_previous.csv')
    os.remove(FOLDER + 'asteroids.dat')

    os.rename(FOLDER + 'asteroids.csv', FOLDER + 'asteroids_previous.csv')


#-------------------------------------------------------------------------------
#  Make updates
#-------------------------------------------------------------------------------

def pickup():
    if (os.path.isfile(FOLDER + 'overwrites.csv') and
        os.path.isfile(FOLDER + 'successful_overwrites.csv')):
        with open(FOLDER + 'overwrites.csv') as overwrites, \
            open(FOLDER + 'successful_overwrites.csv') as successful_overwrites:
            queued = overwrites.readlines()
            successful = successful_overwrites.readlines()

            queued = queued[len(successful):]

        with open(FOLDER + 'overwrites.csv', 'w') as overwrites, \
            open(FOLDER + 'successful_overwrites.csv', 'w') as successful_overwrites:
            overwrites.write(''.join(queued))
    else:
        print('No successful overwrites to alter. ')

    if (os.path.isfile(FOLDER + 'deletions.csv') and
        os.path.isfile(FOLDER + 'successful_deletions.csv')):
        with open(FOLDER + 'deletions.csv') as deletions, \
            open(FOLDER + 'successful_deletions.csv') as successful_deletions:
            queued = deletions.readlines()
            successful = successful_deletions.readlines()

            queued = queued[len(successful):]

        with open(FOLDER + 'deletions.csv', 'w') as deletions, \
            open(FOLDER + 'successful_deletions.csv', 'w') as successful_deletions:
            deletions.write(''.join(queued))
    else:
        print('No successful deletions to alter')


def update_site():
    print('Beginning update of site backend...\n')
    start = time.time()

    schema = get_schema(FOLDER + 'schema.json')

    print("Requesting .dat file from Minor Planet Center...")
    download_latest()

    if not os.path.isfile(FOLDER + 'asteroids_previous.csv'):
        print('Previous file was not present in folder, retrieving from back up...')
        gcloud_download_previous()
        print('Backup file retrieved. ')

    print('Processing .dat file...')
    process_small_bodies(schema)

    print('Checking for changes to asteroids...')
    check_for_changes()
    print('Changes recorded.')

    print('Updating datastore...')
    gcloud_update_datastore(schema)
    print('Datastore updated!')

    print('Updating bigquery...')
    gcloud_update_bigquery(schema)
    print('Updated bigquery!')

    print('Checking and cleaning files...')
    consolidate_local_files()
    print('File check successful, backend update successful!')

    print('Backing up this asteroids csv to cloud storage...')
    glcoud_update_storage()
    print('Backup successful!')

    end = time.time()
    print('\nUpdate of site backend completed successfully in {}:{}. '.format(round((end - start) // 60), round((end - start) % 60)))


if __name__ == '__main__':
    update_site()
    # pickup()
    pass
