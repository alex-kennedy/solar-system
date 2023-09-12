// Interface for the Yale Bright Star Catalog.
// See http://tdc-www.harvard.edu/catalogs/bsc5.readme.
package brightstars

import (
	"compress/gzip"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	solarsystempb "github.com/alex-kennedy/solar-system/solarsystempb"
)

const (
	catalogUrl   = "http://tdc-www.harvard.edu/catalogs/bsc5.dat.gz"
	downloadPath = "./data/bright_stars/catalog.txt"
)

// LoadBrightStars downloads, processes, and returns the bright stars of the
// Yale Bright Stars Catalog.
func LoadBrightStars() (*solarsystempb.BrightStars, error) {
	if err := downloadCatalog(false); err != nil {
		return nil, err
	}

	catalog, err := loadCatalog()
	if err != nil {
		return nil, err
	}

	stars := &solarsystempb.BrightStars{}
	for _, row := range strings.Split(catalog, "\n") {
		if row == "" {
			continue
		}
		star, err := NewBrightStar(row)
		if err != nil {
			// Some entries have some no positional information, ignore them.
			continue
		}
		stars.BrightStars = append(stars.BrightStars, &solarsystempb.BrightStar{
			RightAscension: float32(star.RightAscension()),
			Declination:    float32(star.Declination()),
			Intensity:      float32(star.Intensity()),
		})
	}

	// The catalog is largely constant, so shouldn't drop drastically.
	if len(stars.BrightStars) < 9000 {
		return nil, fmt.Errorf("failed to extract enough stars from the bright stars catalog (%d)", len(stars.BrightStars))
	}

	normaliseIntensity(stars)

	return stars, nil
}

// Normalises intensity of stars to be <= 1.
func normaliseIntensity(stars *solarsystempb.BrightStars) {
	scaleFactor := maxIntensity(stars.BrightStars)
	for _, star := range stars.BrightStars {
		star.Intensity = star.GetIntensity() / scaleFactor
	}
}

func maxIntensity(stars []*solarsystempb.BrightStar) float32 {
	x := float32(1.0)
	for _, star := range stars {
		if x < star.GetIntensity() {
			x = star.GetIntensity()
		}
	}
	return x
}

// loadCatalog loads the bright stars catalog locally as a string (~2 MiB).
func loadCatalog() (string, error) {
	content, err := os.ReadFile(downloadPath)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

// downloadCatalog downloads the bright stars catalog, decompresses it, and
// saves it to disk. If it already exists, skips the download unless force is
// true.
func downloadCatalog(force bool) error {
	// Skip downloading if output already exists unless it should be
	// force-downloaded.
	if _, err := os.Open(downloadPath); err == nil && !force {
		log.Printf("bright stars catalog already exists, skipping download")
		return nil
	}
	log.Println("downloading bright stars catalog...")

	output, err := os.Create(downloadPath)
	if err != nil {
		log.Printf("error creating %s, got: %v\n", downloadPath, err)
		return err
	}
	defer output.Close()

	response, err := http.Get(catalogUrl)
	if err != nil {
		log.Printf("error downloading bright stars, got: %v\n", err)
		return err
	}
	defer response.Body.Close()

	reader, err := gzip.NewReader(response.Body)
	if err != nil {
		log.Printf("error unzipping bright stars, got: %v\n", err)
		return err
	}
	defer reader.Close()

	written, err := io.Copy(output, reader)
	if err != nil {
		log.Printf("error writing bright stars, got: %v\n", err)
	}
	log.Printf("wrote bright stars (%d bytes)\n", written)
	return nil
}
