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


def line_to_list(line, start_col, end_col):
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


def unpack_designation(col_names, values):
    """Unpack the asteroid designation in the list of values, MPC format"""
    index = col_names.index("designation")
    designation  = values[index]

    # Test if the designation is already an integer, e.g. "00001" or "98575"
    try:
        values[index] = str(int(designation))
        return
    except ValueError:
        pass

    # Test if the designation is a packed Asteroid Number
    try:
        int(designation[1:])
        tail = designation[1:]
        head = str(ord(designation[0]) - 55)
        values[index] = head + tail
        return
    except ValueError:
        pass

    # Test for survey Asteroid formats
    if designation[2] == "S":
        head = designation[3:]
        tail = designation[0] + "-" + designation [1]
        values[index] = head + " " + tail
        return

    centuries = {
        'I' : '18',
        'J' : '19',
        'K' : '20'
    }

    new_desig = ""
    new_desig += centuries.get(designation[0])
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

    values[index] = new_desig
    return


def unpack_uncertainty_parameter(col_names, values):
    u_index = col_names.index('u')
    assert col_names.index('u_flag') == len(values)

    u = values[u_index]
    try:
        u = int(u)
        values.append('')
    except ValueError:
        values[u_index] = '-1'
        values.append(u)


def unpack_epoch(col_names, values):
    """Unpack epoch to date based on MPC format"""
    epoch_index = col_names.index('epoch')
    epoch_packed = values[epoch_index]
    epoch_unpacked = ''

    centuries = {
        'I' : '18',
        'J' : '19',
        'K' : '20'
    }

    epoch_unpacked += centuries.get(epoch_packed[0]) + epoch_packed[1:3] + '-'

    months_days = {
        '1' : '01',
        '2' : '02',
        '3' : '03',
        '4' : '04',
        '5' : '05',
        '6' : '06',
        '7' : '07',
        '8' : '08',
        '9' : '09',
        'A' : '10',
        'B' : '11',
        'C' : '12',
        'D' : '13',
        'E' : '14',
        'F' : '15',
        'G' : '16',
        'H' : '17',
        'I' : '18',
        'J' : '19',
        'K' : '20',
        'L' : '21',
        'M' : '22',
        'N' : '23',
        'O' : '24',
        'P' : '25',
        'Q' : '26',
        'R' : '27',
        'S' : '28',
        'T' : '29',
        'U' : '30',
        'V' : '31',
    }

    epoch_unpacked += months_days.get(epoch_packed[3]) + '-'
    epoch_unpacked += months_days.get(epoch_packed[4])

    values[epoch_index] = epoch_unpacked


def unpack_flags(col_names, values):
    flags_index = col_names.index('flags')

    flags_number = int(values[flags_index], 16)
    flags_binary = "{0:b}".format(flags_number)
    flags_binary = flags_binary.rjust(16, '0')
    flags_binary = flags_binary[::-1]

    orbit_type = flags_binary[0:6][::-1]
    orbit_type = int(orbit_type, 2)
    values.append(orbit_type)

    neo = flags_binary[11]
    values.append(neo)

    neo_1km = flags_binary[12]
    values.append(neo_1km)

    opposition_seen_earlier = flags_binary[13]
    values.append(opposition_seen_earlier)

    critical_list_numbered = flags_binary[14]
    values.append(critical_list_numbered)

    pha = flags_binary[15]
    values.append(pha)


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


def process_small_bodies():
    col_names = [field['name'] for field in schema]
    start_col = [field.get('start_col') for field in schema if field.get('start_col') is not None]
    end_col = [field.get('end_col') for field in schema if field.get('end_col') is not None]

    # processed_fields = [
    #     # [('new1', 'new2', ...), function_pointer]
    #     [(), unpack_designation],
    #     [('u_flag',), unpack_uncertainty_parameter],
    #     [(), unpack_epoch],
    #     [('orbit_type', 'neo', 'neo_1km', 'opposition_seen_earlier', 'critical_list_numbered', 'pha'), unpack_flags]
    # ]

    with open(FOLDER + "asteroids.dat", "r") as dat, \
         open(FOLDER + "asteroids.csv", "w") as csv:

        write_header(csv, col_names)

        # Skip the 43 header rows in the .dat file
        for i in range(43):
            dat.readline()

        for line in tqdm(dat, unit='lines'):
            if len(line) < 10:
                continue

            separate_values = line_to_list(line, start_col, end_col)

            # place_in_list function maybe????

            # apply each processing function
            # for unpack in processed_fields:
            #     function_pointer = unpack[1]
            #     function_pointer(col_names, separate_values)

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


if __name__ == '__main__':
    # update_site()
    # schema = get_schema(FOLDER + 'schema.json')

    pass
