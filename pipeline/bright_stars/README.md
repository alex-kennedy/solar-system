# Bright Stars Pipeline

The bright stars data is essentially static. There is a copy of the raw data at
https://solarsystem-static.alexkennedy.dev/brightstars/bsc5.dat.gz.

This pipeline simply updates the static formatted bright stars info at 
https://static.alexkennedy.dev/brightstars/brightstars.pb.br.

To update, run

```sh
go run . --output_options=${OPTIONS_JSON?}
```

Options are a JSON file with the following information.

```json
{
  "BucketName": "solarsystem-static",
  "ObjectPath": "stars/brightstars.pb.br",
  "AccountId": "<redacted>",
  "AccessKeyId": "<redacted>",
  "AccessKeySecret": "<redacted>"
}
```

The static site should load the bright stars and cache it with every build.
