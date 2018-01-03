import json

file_name = 'astro/planets/planetary_elements.csv'
out_file = 'astro/planets/planetary_elements.json'

with open(file_name) as elements_file:
    lines = elements_file.readlines()

for i in range(len(lines)):
    lines[i] = lines[i].split(',')
    lines[i] = [x.strip() for x in lines[i]]
    lines[i][0] = lines[i][0].lower()
    for j in range(len(lines[i])):
        try:
            lines[i][j] = float(lines[i][j])
        except ValueError:
            pass



planets = []
for i in range(len(lines)):
    if i % 2 == 0:
        planet = {}
        planet['name'] = lines[i][0]
        planet['elements'] = lines[i][1:]
        planet['deltas'] = lines[i + 1][1:]
        planets.append(planet)

with open(out_file, 'w') as out:
    json.dump(planets, out)


"""
lines = []
planet_dicts = []

with open(file_name) as elements_file:
    at_header = True
    for line in elements_file:
        if line[0:5] == '-----':
            at_header = False
            continue

        if not at_header:
            lines += [line]

for i in range(len(lines)):
    lines[i] = lines[i].split()

    if i % 2 == 1:
        lines[i] = [lines[i-1][0]] + lines[i]
        lines[i].append(True)
    else:
        lines[i].append(False)

    for j in range(1, len(lines[i]) - 1):
        lines[i][j] = float(lines[i][j])

    planet = {}
    planet['name'] = lines[i]
"""
