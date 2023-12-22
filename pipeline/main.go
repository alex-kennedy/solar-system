package main

import (
	"bytes"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"os"
	"path/filepath"

	"github.com/google/brotli/go/cbrotli"
	"github.com/schollz/progressbar/v3"
	"google.golang.org/protobuf/proto"

	"github.com/alex-kennedy/solar-system/pipeline/asteroids"
	brightstars "github.com/alex-kennedy/solar-system/pipeline/bright_stars"
)

var (
	brightStarsOutput = flag.String("bright_stars_output", "./public/assets/bright_stars.pb.br", "Output directory for bright stars.")
	asteroidsOutput   = flag.String("asteroids_output", "./public/assets/asteroids.pb.br", "Output directory for asteroids.")
)

func CreateBrightStars(output string) error {
	log.Println("starting bright stars pipeline...")
	if err := os.MkdirAll(filepath.Dir(output), fs.FileMode(os.O_RDWR)); err != nil {
		return fmt.Errorf("failed to make bright stars output dir: %s", err)
	}

	brightStars, err := brightstars.LoadBrightStars()
	if err != nil {
		return err
	}
	log.Printf("loaded %d bright stars\n", len(brightStars.BrightStars))

	brightStarsSerialized, err := proto.Marshal(brightStars)
	if err != nil {
		return fmt.Errorf("failed to marshal bright stars: %s", err)
	}

	log.Println("writing compressed bright stars...")
	if err := WriteCompressed(output, brightStarsSerialized); err != nil {
		return fmt.Errorf("failed to write bright stars: %s", err)
	}
	log.Println("finished bright stars pipeline!")
	return nil
}

func CreateAsteroids(output string) error {
	log.Println("starting asteroids pipeline...")

	if err := os.MkdirAll(filepath.Dir(output), fs.FileMode(os.O_RDWR)); err != nil {
		return fmt.Errorf("failed to make asteroids output dir: %s", err)
	}

	asteroids, err := asteroids.GetAsteroidPayload()
	if err != nil {
		log.Fatalf("failed to get asteroids payload: %v\n", err)
	}

	asteroidsSerialized, err := proto.Marshal(asteroids)
	if err != nil {
		return fmt.Errorf("failed to marshal asteroids: %v", err)
	}

	log.Printf("writing compressed asteroids...")
	if err := WriteCompressed(output, asteroidsSerialized); err != nil {
		return fmt.Errorf("failed to write asteroids: %s", err)
	}
	log.Println("finished asteroids pipeline!")
	return nil
}

func WriteCompressed(path string, data []byte) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()

	w := cbrotli.NewWriter(f, cbrotli.WriterOptions{Quality: 11})
	defer w.Close()

	bar := progressbar.DefaultBytes(int64(len(data)), fmt.Sprintf("compressing %s", path))
	n, err := io.Copy(io.MultiWriter(w, bar), bytes.NewReader(data))
	if err != nil {
		return err
	}
	defer w.Close()
	defer w.Flush()
	log.Printf("wrote %s (%d bytes uncompressed)", path, n)
	return nil
}

func main() {
	flag.Parse()

	log.Println("starting solar-system pipeline...")

	if err := CreateBrightStars(*brightStarsOutput); err != nil {
		log.Fatal(err)
	}

	if err := CreateAsteroids(*asteroidsOutput); err != nil {
		log.Fatal(err)
	}

	log.Println("pipeline finished!")
}
