package main

import (
	"log"
	"os"

	"github.com/google/brotli/go/cbrotli"
	"google.golang.org/protobuf/proto"

	brightstars "github.com/alex-kennedy/solar-system/pipeline/bright_stars"
)

func WriteCompressed(path string, data []byte) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()

	w := cbrotli.NewWriter(f, cbrotli.WriterOptions{Quality: 11})
	defer w.Close()

	n, err := w.Write(data)
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

	brightStarsSerialized, err := proto.Marshal(brightStars)
	if err != nil {
		log.Fatalf("failed to marshal bright stars: %s", err)
	}

	log.Printf("writing compressed bright stars...")
	if err := WriteCompressed("./public/assets/bright_stars.pb.br", brightStarsSerialized); err != nil {
		log.Fatalf("failed to write bright stars: %s\n", err)
	}
}
