package main

import (
	"log"

	brightstars "github.com/alex-kennedy/solar-system/pipeline/bright_stars"
)

func main() {
	log.Println("starting solar-system pipeline...")

	x, err := brightstars.LoadBrightStars()
	if err != nil {
		log.Fatalf("err: %s\n", err)
	}
	log.Printf("loaded %d bright stars\n", len(x))
}
