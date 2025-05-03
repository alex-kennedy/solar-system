package main

import (
	"context"
	"encoding/json"
	"flag"
	"log"
	"os"
)

var outputOptions = flag.String("output_options", "", "Path to JSON encoded output options.")

func main() {
	flag.Parse()
	if *outputOptions == "" {
		log.Fatal("--output_options is required")
	}
	optionsJson, err := os.ReadFile(*outputOptions)
	if err != nil {
		log.Fatal(err)
	}
	options := &OutputOptions{}
	if err := json.Unmarshal(optionsJson, options); err != nil {
		log.Fatal(err)
	}

	catalog, err := DownloadCatalog()
	if err != nil {
		log.Fatal(err)
	}
	bs, err := ParseBrightStars(catalog)
	if err != nil {
		log.Fatal(err)
	}
	payload, err := BuildWebPayload(bs)
	if err != nil {
		log.Fatal(err)
	}
	if err := WriteToR2(context.Background(), payload, options); err != nil {
		log.Fatal(err)
	}
}
