package asteroids

import (
	"bufio"
	"compress/gzip"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/schollz/progressbar/v3"
)

const (
	MPCORB_DAT_URL = "http://www.minorplanetcenter.net/iau/MPCORB/MPCORB.DAT.gz"
	DOWNLOAD_PATH  = "./data/asteroids/mpcorb.dat"
)

func NewAsteroidsReader() (*AsteroidsReader, error) {
	if err := downloadAsteroids(false); err != nil {
		return nil, err
	}

	f, err := os.Open(DOWNLOAD_PATH)
	if err != nil {
		return nil, err
	}

	r := &AsteroidsReader{f: f, s: bufio.NewScanner(f)}
	for i := 0; i < 43; i++ {
		if !r.Scan() {
			if r.Err() == nil {
				return nil, fmt.Errorf("asteroids file too short (line %d)", i)
			} else {
				return nil, fmt.Errorf("error reading asteroids: %v", r.Err())
			}
		}
	}
	return r, nil
}

type AsteroidsReader struct {
	f *os.File
	s *bufio.Scanner
}

func (r *AsteroidsReader) Scan() bool {
	for r.s.Scan() {
		if r.s.Text() != "" {
			return true
		}
	}
	return false
}

func (r *AsteroidsReader) Err() error {
	return r.s.Err()
}

func (r *AsteroidsReader) Next() (*Asteroid, error) {
	for r.s.Text() == "" && r.Scan() {
	}
	return NewAsteroid(r.s.Text())
}

func (r *AsteroidsReader) Close() error {
	return r.f.Close()
}

// downloadAsteroids downloads the latest Minor Planet Center data file,
// decompresses it, and saves it to disk.If it already exists, skips the
// download unless force is true.
func downloadAsteroids(force bool) error {
	// Skip downloading if output already exists unless it should be
	// force-downloaded.
	if _, err := os.Open(DOWNLOAD_PATH); err == nil && !force {
		log.Println("orbits data file already exists, skipping download")
		return nil
	}
	log.Println("download mpcorb.dat.gz file...")

	if err := os.MkdirAll(filepath.Dir(DOWNLOAD_PATH), fs.FileMode(os.O_RDWR)); err != nil {
		log.Panicln("failed to create orbits temp folder")
		return err
	}

	output, err := os.Create(DOWNLOAD_PATH)
	if err != nil {
		log.Printf("error creating %s, got: %v\n", DOWNLOAD_PATH, err)
		return err
	}
	defer output.Close()

	response, err := http.Get(MPCORB_DAT_URL)
	if err != nil {
		log.Printf("error downloading asteroids, got: %v\n", err)
		return err
	}
	defer response.Body.Close()

	bar := progressbar.DefaultBytes(
		response.ContentLength,
		"downloading mpcorb.dat.gz",
	)

	reader := io.TeeReader(response.Body, bar)

	gzReader, err := gzip.NewReader(reader)
	if err != nil {
		log.Printf("error unzipping asteroids, got: %v\n", err)
	}

	written, err := io.Copy(output, gzReader)
	if err != nil {
		log.Printf("error writing asteroids, got: %v\n", err)
	}
	log.Printf("wrote asteroids (%d bytes)\n", written)
	return nil
}
