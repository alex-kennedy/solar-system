package main

import (
	"log"
	"os"

	"github.com/google/brotli/go/cbrotli"

	brightstars "github.com/alex-kennedy/solar-system/pipeline/bright_stars"
)

func WriteCompressed(path, data string) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()

	w := cbrotli.NewWriter(f, cbrotli.WriterOptions{Quality: 11})
	defer w.Close()

	n, err := w.Write([]byte(data))
	if err != nil {
		return err
	}
	defer w.Close()
	defer w.Flush()
	log.Printf("wrote %s (%d bytes uncompressed)", path, n)
	return nil
}

func main() {
	log.Println("starting solar-system pipeline...")

	brightStars, err := brightstars.LoadBrightStars()
	if err != nil {
		log.Fatalf("err: %s\n", err)
	}
	log.Printf("loaded %d bright stars\n", len(brightStars.BrightStars))

	log.Printf("writing compressed bright stars...")
	if err := WriteCompressed("./data/bright_stars/bright_stars.pb.br", brightStars.String()); err != nil {
		log.Fatalf("failed to write bright stars: %s\n", err)
	}
}
