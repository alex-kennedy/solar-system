import mechanicalsoup
import requests

session = requests.Session()
session.stream = True

browser = mechanicalsoup.StatefulBrowser(session)

print("Getting form...")
response = browser.open('https://ssd.jpl.nasa.gov/sbdb_query.cgi')
assert response.status_code == 200

browser.select_form()
form  = browser.get_current_form()

# Return asteroids only and set to CSV download
form.set_radio(
    {
        "obj_kind" : "ast", # "ast" for real, "com" for testing
        "table_format" : "CSV"
    }
)

# Set the fields we wish to return
# Fields are 'Asteroid - basic' and 'Asteroid - physical'
form.set_select(
    {
        "OBJ_field_set" : (
            'Ab',
            'Ac',
            'Ad',
            'Ae',
            'Ag',
            'Ai',
            'Ap',
            'Ar',
            'As',
            'Au',
            'Av',
            'Aw',
            'Ax',
            'Az',
            'Ba'
        ),
        "ORB_field_set" : (
            'Bb',
            'Bc',
            'Bd',
            'Bf',
            'Bg',
            'Bh',
            'Bi',
            'Bj',
            'Bk',
            'Bl',
            'Bm',
            'Bn',
            'Bo',
            'Bp',
            'Br',
            'Bt',
            'Bw',
            'Bx',
            'By',
            'Bz',
            'Ca',
            'Cb',
            'Cc',
            'Cd',
            'Ce',
            'Cg',
            'Ch',
            'Ci',
            'Ck',
            'Cl',
            'Cm',
            'Cn',
            'Cq',
            'Cr',
            'Cs'
        )
    }
)

# Append the selected fields to the list
print("Appending fields...")
response = browser.submit_selected(btnName="f_app")
assert response.status_code == 200

form = browser.select_form()

print("Making request...")
response = browser.submit_selected(btnName='query')
assert response.status_code == 200
print("Request made successfully.")

print("Writing file...")

byte_count = 0
with open('astro/asteroids/asteroids.csv', 'wb') as out:
    for chunk in response.iter_content(chunk_size=1024):
        out.write(chunk)

        byte_count += 1024
        if byte_count % 1024000 == 0:
            print("Written {0}MB".format(round(byte_count/1048576, 2)))

print("File written successfully.")
