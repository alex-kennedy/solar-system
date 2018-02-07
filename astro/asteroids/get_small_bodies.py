import os
import requests
from tqdm import tqdm
import difflib
from google.cloud import datastore, storage
import time


URL = 'http://www.minorplanetcenter.net/iau/MPCORB/MPCORB.DAT'
SAVE_FILE = ""
DOWNLOADED = False
GCLOUD_STORAGE_BUCKET = 'asteroid-data'


def join_list(list, sep=','):
    string = ''
    for item in list:
        string += str(item) + sep

    # Remove the extra separator
    string = string[:-len(sep)]

    return string


def get_col_names(line_format, processed_fields):
    col_names = []

    for col in line_format:
        col_names.append(col[0])

    for function_call in processed_fields:
        for col in function_call[0]:
            col_names.append(col)

    return col_names


def write_header(out_file, col_names):
    header_string = join_list(col_names)
    out_file.write(header_string + '\n')


def line_to_list(line_format, line):
    separate_values = []
    for col in line_format:
        lower = col[1][0] - 1 # -1 due to indexing
        upper = col[1][1]     # -1 due to indexing, +1 due to convert to exclusive indexing

        value = line[lower:upper].strip()
        separate_values.append(value)

    return separate_values


def unpack_designation(col_names, values):
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
    # Formatting from: https://www.minorplanetcenter.net/iau/info/MPOrbitFormat.html
    line_format = [
        ['designation', (1, 7)],
        ['h', (9, 13)],
        ['g', (15, 19)],
        ['epoch', (21, 25)],
        ['m', (27, 35)],
        ['perihelion', (38, 46)],
        ['node', (49, 57)],
        ['incl', (60, 68)],
        ['e', (71, 79)],
        ['n', (81, 91)],
        ['a', (93, 103)],
        ['u', (106, 106)],
        ['reference', (108, 116)],
        ['observations', (118, 122)],
        ['oppositions', (124, 126)],
        ['arc_year_or_length', (128, 131)],
        ['arc_year_last', (128, 131)],
        ['flags', (162, 165)],
        ['readable_designation', (167, 194)],
        ['last_observation', (195, 202)]
    ]

    processed_fields = [
        # [('new1', 'new2', ...), function_pointer]
        [(), unpack_designation],
        [('u_flag',), unpack_uncertainty_parameter],
        [(), unpack_epoch],
        [('orbit_type', 'neo', 'neo_1km', 'opposition_seen_earlier', 'critical_list_numbered', 'pha'), unpack_flags]
    ]

    col_names = get_col_names(line_format, processed_fields)

    skip_rows = 43

    with open(SAVE_FILE + "asteroids.dat", "r") as dat, \
         open(SAVE_FILE + "asteroids.csv", "w") as csv:

        print("Converting...")

        write_header(csv, col_names)

        for i in range(skip_rows):
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


    diff = difflib.unified_diff(old, new, n=0)      # provide no context (n=0)
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

    diff = difflib.unified_diff(old, new, n=0)      # reset diff generator
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


def gcloud_overwrite_previous(client):
    bucket = client.bucket(GCLOUD_STORAGE_BUCKET)
    assert bucket.exists()

    print("Writing CSV to google cloud...")
    blob = bucket.blob('asteroids.csv')
    blob.upload_from_filename(SAVE_FILE + 'asteroids.csv')
    print("Successfully wrote CSV to google cloud.")


def gcloud_make_changes():
    pass


def clean_files():
    os.remove(SAVE_FILE + 'asteroids.csv')
    os.remove(SAVE_FILE + 'asteroids.dat')
    os.remove(SAVE_FILE + 'asteroids_previous.csv')
    os.remove(SAVE_FILE + "overwrites.csv")
    os.remove(SAVE_FILE + "deletions.csv")


def update_site():
    #download_latest() #X
    #gcloud_download_previous() #X
    #process_small_bodies() #X
    #check_for_changes()
    #gcloud_make_changes()
    #gcloud_overwrite_previous() #X
    #clean_files() #X
    pass


if __name__ == '__main__':
    update_site()
