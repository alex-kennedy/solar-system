import os
import requests
from tqdm import tqdm
import difflib
from google.cloud import datastore, storage, bigquery
import time
import datetime

# TODO Add all these to a config file
URL = 'http://www.minorplanetcenter.net/iau/MPCORB/MPCORB.DAT'
SAVE_FILE = 'astro/asteroids/'
DOWNLOADED = False
GCLOUD_STORAGE_BUCKET = 'asteroid-data'
BIGQUERY_DATASET_ID = 'asteroids_data'

# Formatting from: https://www.minorplanetcenter.net/iau/info/MPOrbitFormat.html
SCHEMA = [
    #['name', (.dat col start, .dat col end), 'bigquery field', datastore indexed? ]
    ['designation', (1, 7), 'STRING', True],
    ['h', (9, 13), 'FLOAT', False],
    ['g', (15, 19), 'FLOAT', False],
    ['epoch', (21, 25), 'DATETIME', False],
    ['m', (27, 35), 'FLOAT', False],
    ['perihelion', (38, 46), 'FLOAT', False],
    ['node', (49, 57), 'FLOAT', False],
    ['incl', (60, 68), 'FLOAT', False],
    ['e', (71, 79), 'FLOAT', True],
    ['n', (81, 91), 'FLOAT', False],
    ['a', (93, 103), 'FLOAT', True],
    ['u', (106, 106), 'FLOAT', True],
    ['reference', (108, 116), 'STRING', False],
    ['observations', (118, 122), 'INTEGER', False],
    ['oppositions', (124, 126), 'INTEGER', False],
    ['arc_year_or_length', (128, 131), 'FLOAT', False],
    ['arc_year_last', (128, 131), 'INTEGER', False],
    ['flags', (162, 165), 'STRING', False],
    ['readable_designation', (167, 194), 'STRING', True],
    ['last_observation', (195, 202), 'STRING', False],
    ['u_flag', None, 'STRING', True],
    ['orbit_type', None, 'STRING', True],
    ['neo', None, 'BOOLEAN', True],
    ['neo_1km', None, 'BOOLEAN', True],
    ['opposition_seen_earlier', None, 'BOOLEAN', False],
    ['critical_list_numbered', None, 'BOOLEAN', True],
    ['pha', None, 'BOOLEAN', True]
]


def join_list(list, sep=','):
    """Combine a list of objects into one string separated by sep."""
    string = ''
    for item in list:
        string += str(item) + sep

    # Remove the extra separator
    string = string[:-len(sep)]

    return string


def write_header(out_file, col_names):
    """Add a header to the .csv outfile, determined by the list col_names"""
    header_string = join_list(col_names)
    out_file.write(header_string + '\n')


def line_to_list(line_format, line):
    """Convert a formatted string line by the line_format"""
    separate_values = []
    for col in line_format:
        lower = col[1][0] - 1 # -1 due to indexing
        upper = col[1][1]     # -1 due to indexing, +1 to convert to exclusive indexing

        value = line[lower:upper].strip()
        separate_values.append(value)

    return separate_values


def parse_line(line):
    """Convert a list of strings to their types as specified in the schema"""
    assert type(line) is list
    assert len(line) == len(SCHEMA)

    for i in range(len(line)):
        try:
            if SCHEMA[i][2] == 'FLOAT':
                line[i] = float(line[i])
            elif SCHEMA[i][2] == 'INTEGER':
                line[i] = int(line[i])
            elif SCHEMA[i][2] == 'BOOLEAN':
                line[i] = bool(int(line[i]))
            elif SCHEMA[i][2] == 'DATETIME':
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
        tail = str(int(designation[1:]))
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

    print("Downloading {0}.dat file...".format(SAVE_FILE + "asteroids"))
    with open(SAVE_FILE + "asteroids" + '.dat', 'wb') as dat:
        for chunk in tqdm(response.iter_content(chunk_size=chunk_size), total=round(content_length/chunk_size), unit='KB'):
            dat.write(chunk)
    print('Finished writing .dat file')


def gcloud_download_previous():
    client = storage.Client()
    bucket = client.bucket(GCLOUD_STORAGE_BUCKET)
    assert bucket.exists()

    print("Downloading previous asteroid set...")
    blob = bucket.blob('asteroids.csv')
    blob.download_to_filename(SAVE_FILE + "asteroids_previous.csv")
    print("Previous asteroid set downloaded successfully.")


def process_small_bodies():
    line_format = [field[0:2] for field in SCHEMA if field[1] is not None]
    col_names = [field[0] for field in SCHEMA]

    processed_fields = [
        # [('new1', 'new2', ...), function_pointer]
        [(), unpack_designation],
        [('u_flag',), unpack_uncertainty_parameter],
        [(), unpack_epoch],
        [('orbit_type', 'neo', 'neo_1km', 'opposition_seen_earlier', 'critical_list_numbered', 'pha'), unpack_flags]
    ]

    with open(SAVE_FILE + "asteroids.dat", "r") as dat, \
         open(SAVE_FILE + "asteroids.csv", "w") as csv:

        print("Converting...")

        write_header(csv, col_names)

        # Skip the 43 header rows in the .dat file
        for i in range(43):
            dat.readline()

        for line in tqdm(dat, unit='lines'):
            if len(line) < 10:
                continue

            separate_values = line_to_list(line_format, line)

            # apply each processing function
            for unpack in processed_fields:
                function_pointer = unpack[1]
                function_pointer(col_names, separate_values)

            string = join_list(separate_values)
            csv.write(string + '\n')

    print("Conversion complete")


def check_for_changes():
    over_write_keys = []

    with open(SAVE_FILE + "asteroids_previous.csv", 'r') as new:
        new = new.readlines()
    with open(SAVE_FILE + "asteroids.csv", 'r') as old:
        old = old.readlines()


    diff = difflib.unified_diff(new, old, n=0)      # provide no context (n=0)
    count = 0
    with open(SAVE_FILE + "overwrites.csv", 'w') as outfile:
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
    with open(SAVE_FILE + "deletions.csv", 'w') as outfile:
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
    blob.upload_from_filename(SAVE_FILE + 'asteroids.csv')
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

        if len(chunk) == 0:
            break

        yield chunk


def gcloud_update_datastore():
    client = datastore.Client()

    # Get CSV schema
    schema = [field[0] for field in SCHEMA]

    count = 0

    with open(SAVE_FILE + 'asteroids.csv') as overwrites_file_object, \
        open(SAVE_FILE + 'successful.csv', 'a') as successful:

        overwrites_file_object.readline() # ignore header FOR NOW

        overwrites = read_in_chunks(overwrites_file_object, num_lines=500)
        for chunk in overwrites:
            tasks = []
            for line in chunk:
                line = line.strip().split(',')
                parse_line(line)

                asteroid = dict(zip(schema, line))
                task_key = client.key('asteroid', asteroid['designation'])
                del asteroid['designation']

                task = datastore.Entity(
                    key=task_key,
                    exclude_from_indexes=[field[0] for field in SCHEMA if field[3] is False])
                task.update(asteroid)
                tasks.append(task)

            # Put to datastore
            if len(tasks) == 1:
                client.put(tasks[0])
            else:
                client.put_multi(tasks)
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
    job_config.schema = [bigquery.SchemaField(field[0], field[2]) for field in SCHEMA]

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
    os.remove(SAVE_FILE + 'asteroids.csv')
    os.remove(SAVE_FILE + 'asteroids.dat')
    os.remove(SAVE_FILE + 'asteroids_previous.csv')
    os.remove(SAVE_FILE + "overwrites.csv")
    os.remove(SAVE_FILE + "deletions.csv")


def update_site():
    print('Beginning update of site backend...\n')
    start = time.time()

    #download_latest() #X
    #gcloud_download_previous() #X
    #process_small_bodies() #X
    #check_for_changes()
    gcloud_update_datastore()
    #glcoud_update_storage()
    #gcloud_update_bigquery()

    end = time.time()
    print('\nUpdate of site backend completed successfully in {}:{}. '.format(round((end - start) // 60), round((end - start) % 60)))


if __name__ == '__main__':
    update_site()

    pass
