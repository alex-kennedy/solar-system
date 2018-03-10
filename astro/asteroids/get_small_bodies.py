import datetime
import difflib
import json
import os
import time

import requests
from google.api_core.exceptions import BadRequest
from google.cloud import bigquery, datastore, storage
from tqdm import tqdm

URL = 'http://www.minorplanetcenter.net/iau/MPCORB/MPCORB.DAT'
FOLDER = 'astro/asteroids/'
GCLOUD_STORAGE_BUCKET = 'asteroid-data'
BIGQUERY_DATASET_ID = 'asteroids_data'


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


def parse_line(line):
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


def unpack_designation(packed_designation):
    """Unpack the asteroid designation in the list of values, MPC format"""

    # Test if the designation is already an integer, e.g. "00001" or "98575"
    try:
        values[index] = str(int(packed_designation))
        return
    except ValueError:
        pass

    # Test if the designation is a packed Asteroid Number
    try:
        int(packed_designation[1:])
        tail = packed_designation[1:]
        head = str(ord(packed_designation[0]) - 55)
        return head + tail
    except ValueError:
        pass

    # Test for survey Asteroid formats
    if packed_designation[2] == "S":
        head = packed_designation[3:]
        tail = packed_designation[0] + "-" + packed_designation[1]
        return head + " " + tail

    centuries = {
        'I' : '18',
        'J' : '19',
        'K' : '20'
    }

    new_desig = ""
    new_desig += centuries[designation[0]]
    new_desig += designation[1:3]
    new_desig += " "
    new_desig += designation[3] + designation[6]

    try:
        int(designation[4:6])
        is_int = True
    except ValueError:
        is_int = False

    if is_int:
        if int(designation[4:6]) != 0:
            new_desig += str(int(designation[4:6]))
    else:
        new_desig += str(ord(designation[4]) - 55)
        new_desig += designation[5]

    return new_desig


def unpack_uncertainty_parameter(u):
    try:
        u = int(u)
        u_flag = ''
    except ValueError:
        u_flag = u
        u = -1

    return u, u_flag


def epoch_letter_to_number(letter):
    try:
        int(letter)
        return letter.rjust(2, '0')
    except ValueError:
        return ord(letter) - 55


def unpack_epoch(epoch_packed):
    """Unpack epoch to date based on MPC format"""
    epoch_unpacked = (epoch_letter_to_number(epoch_packed[0]) +
                      epoch_packed[1:3] +
                      '-' +
                      epoch_letter_to_number[3] +
                      '-' +
                      epoch_letter_to_number[4])

    return epoch_unpacked


def unpack_flags(flags):
    flags_number = int(flags, 16)
    flags_binary = "{0:b}".format(flags_number)
    flags_binary = flags_binary.rjust(16, '0')
    flags_binary = flags_binary[::-1]

    orbit_type = flags_binary[0:6][::-1]
    orbit_type = int(orbit_type, 2)

    neo = flags_binary[11]
    neo_1km = flags_binary[12]
    opposition_seen_earlier = flags_binary[13]
    critical_list_numbered = flags_binary[14]
    pha = flags_binary[15]

    return orbit_type, neo, neo_1km, opposition_seen_earlier, critical_list_numbered, pha


def download_latest():
    chunk_size = 1024

    print("Requesting...")
    response = requests.get(URL, stream=True)
    assert response.status_code == 200

    content_length = int(response.headers.get('content-length'))

    print("Downloading {0}.dat file...".format(FOLDER + "asteroids"))
    with open(FOLDER + "asteroids" + '.dat', 'wb') as dat:
        for chunk in tqdm(response.iter_content(chunk_size=chunk_size), total=round(content_length/chunk_size), unit='KB'):
            dat.write(chunk)
    print('Finished writing .dat file')


def gcloud_download_previous():
    client = storage.Client()
    bucket = client.bucket(GCLOUD_STORAGE_BUCKET)
    assert bucket.exists()

    print("Downloading previous asteroid set...")
    blob = bucket.blob('asteroids.csv')
    blob.download_to_filename(FOLDER + "asteroids_previous.csv")
    print("Previous asteroid set downloaded successfully.")


def place_in_list(new_names, new_values, schema_names, current_values):
    if type(new_values) is not list:
        new_names = [new_names]
    if type(new_values) is not list:
        new_values = [new_values]

    for i in range(len(new_names)):
        index = schema_names.index(new_names[i])
        while len(current_values) <= index:
            current_values.append(None)
        current_values[index] = new_values[i]
    return current_values


def process_small_bodies():
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
            values = place_in_list(['epoch'], unpack_epoch(epoch_packed))

            # Flags
            new_names = ['orbit_type', 'neo', 'neo_1km', 'opposition_seen_earlier', 'critical_list_numbered', 'pha']
            flags = values[col_names.index('flags')]
            values = place_in_list(new_names, unpack_flags(flags), col_names, values)

            string = join_list(separate_values)
            csv.write(string + '\n')


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

    # Write out a complete diff
    # diff = difflib.unified_diff(old, new, n=0)
    # with open("diff.csv", 'w') as outfile:
    #     for line in diff:
    #         outfile.write(line)


def glcoud_update_storage():
    client = storage.Client()
    bucket = client.bucket(GCLOUD_STORAGE_BUCKET)
    assert bucket.exists()

    print("Writing CSV to google cloud...")
    blob = bucket.blob('asteroids.csv')
    blob.upload_from_filename(FOLDER + 'asteroids.csv')
    print("Successfully wrote CSV to google cloud.")


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


def gcloud_update_datastore():
    client = datastore.Client()

    field_names = [field['name'] for field in schema]

    count = 0
    with open(FOLDER + 'asteroids.csv') as overwrites_file_object, \
        open(FOLDER + 'successful.csv', 'a') as successful:

        overwrites_file_object.readline() # ignore header FOR NOW

        overwrites = read_in_chunks(overwrites_file_object, num_lines=500)
        for chunk in overwrites:
            tasks = []
            for line in chunk:
                line = line.strip().split(',')
                parse_line(line)

                asteroid = dict(zip(field_names, line))
                task_key = client.key('asteroid', asteroid['designation'])
                del asteroid['designation']

                task = datastore.Entity(
                    key=task_key,
                    exclude_from_indexes=[field['name'] for field in schema if field['datastore_indexed'] is False])
                task.update(asteroid)
                tasks.append(task)

            # Put to datastore
            if len(tasks) == 1:
                client.put(tasks[0])
            else:
                try:
                    client.put_multi(tasks)
                except BadRequest:
                    pass


            successful.write(''.join(chunk))
            count += len(tasks)
            print("Placed {} entities to Google Datastore ({} total)".format(len(tasks), count))


def gcloud_update_bigquery():
    client = bigquery.Client()

    gcloud_storage_reference = 'gs://{0}/{1}'.format(GCLOUD_STORAGE_BUCKET, 'asteroids.csv')
    dataset = client.dataset(BIGQUERY_DATASET_ID)

    job_config = bigquery.LoadJobConfig()
    job_config.source_format = 'CSV'
    job_config.skip_leading_rows = 1
    job_config.schema = [bigquery.SchemaField(field['name'], field[bigquery_field]) for field in schema]

    # Delete and reload
    client.delete_table(dataset.table('asteroids'))
    load_job = client.load_table_from_uri(
        gcloud_storage_reference,
        dataset.table('asteroids'),
        job_config=job_config
    )

    print('Beginning load job from Cloud Storage to BigQuery...')
    load_job.result()  # Waits for table load to complete.
    assert load_job.state == 'DONE'
    print('BigQuery job completed successfully.')


def clean_files():
    os.remove(FOLDER + 'asteroids.csv')
    os.remove(FOLDER + 'asteroids.dat')
    os.remove(FOLDER + 'asteroids_previous.csv')
    os.remove(FOLDER + "overwrites.csv")
    os.remove(FOLDER + "deletions.csv")


def update_site():
    print('Beginning update of site backend...\n')
    start = time.time()

    schema = get_schema(FOLDER + 'schema.json')

    #download_latest() #X
    #gcloud_download_previous() #X
    #process_small_bodies() #X
    #check_for_changes()
    gcloud_update_datastore()
    glcoud_update_storage()
    gcloud_update_bigquery()

    end = time.time()
    print('\nUpdate of site backend completed successfully in {}:{}. '.format(round((end - start) // 60), round((end - start) % 60)))


def test():
    t = ("one"
        'two')
    print(t)


if __name__ == '__main__':
    # update_site()
    # schema = get_schema(FOLDER + 'schema.json')

    test()

    pass
