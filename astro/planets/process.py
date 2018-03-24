import pandas as pd

file_name = 'astro/planets/planetary_elements.csv'
out_file = 'astro/planets/planetary_elements.json'

df = pd.read_csv(file_name)
df = df.groupby('system').agg(lambda x: list(x))
out_string = df.to_json(orient='index')

with open(out_file, 'w') as out:
    out.write(out_string)
