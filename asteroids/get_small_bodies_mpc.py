import requests
from tqdm import tqdm

URL = 'http://www.minorplanetcenter.net/iau/MPCORB/MPCORB.DAT'
SAVE_FILE = 'asteroids/asteroids'
DOWNLOADED = True

def join_list(list, sep=','):
    string = ''
    for item in list:
        string += str(item) + sep

    # Remove the extra separator
    string = string[:-len(sep)]

    return string


def write_header(out_file, line_format, processed_fields):
    col_names = []
    for col in line_format:
        col_names.append(col[0])

    for function_call in processed_fields:
        for col in function_call[0]:
            col_names.append(col)

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


def download_data():
    chunk_size = 1024

    print("Requesting...")
    response = requests.get(URL, stream=True)
    assert response.status_code == 200

    content_length = int(response.headers.get('content-length'))

    print("Downloading {0}.dat file...".format(SAVE_FILE))
    with open(SAVE_FILE + '.dat', 'wb') as dat:
        for chunk in tqdm(response.iter_content(chunk_size=chunk_size), total=round(content_length/chunk_size), unit='KB'):
            dat.write(chunk)
    print('Finished writing .dat file')


def get_small_bodies():
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
        # [('name1', 'name2'), function_pointer]
    ]

    skip_rows = 43

    if not DOWNLOADED:
        download_data()

    with open(SAVE_FILE + '.dat', 'r') as dat, open(SAVE_FILE + '.csv', 'w') as csv:
        print("Conversion starting...")

        write_header(csv, line_format, processed_fields)

        for i in range(skip_rows):
            dat.readline()

        for line in dat:
            separate_values = line_to_list(line_format, line)

            # processing happens here

            string = join_list(separate_values)
            csv.write(string + '\n')


    print("Conversion complete")


if __name__ == '__main__':
    get_small_bodies()
