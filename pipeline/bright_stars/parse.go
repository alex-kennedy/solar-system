// Schema information for the Yale Bright Star Catalog.
// See http://tdc-www.harvard.edu/catalogs/bsc5.readme.
package brightstars

import (
	"fmt"
	"math"
	"strconv"
	"strings"
)

// NewBrightStar creates a bright star entry from a catalog row.
func NewBrightStar(row string) (*BrightStar, error) {
	star := &BrightStar{
		hR:   getRange(row, rangeHr),
		name: getRange(row, rangeName),
	}

	var err error
	if star.rah, err = parseFloat(row, rangeRAh); err != nil {
		return nil, fmt.Errorf("cannot parse RAh: %w", err)
	}
	if star.ram, err = parseFloat(row, rangeRAm); err != nil {
		return nil, fmt.Errorf("cannot parse RAm: %w", err)
	}
	if star.ras, err = parseFloat(row, rangeRAs); err != nil {
		return nil, fmt.Errorf("cannot parse RAs: %w", err)
	}
	if star.ded, err = parseFloat(row, rangeDEd); err != nil {
		return nil, fmt.Errorf("cannot parse DEd: %w", err)
	}
	if star.dem, err = parseFloat(row, rangeDEm); err != nil {
		return nil, fmt.Errorf("cannot parse DEm: %w", err)
	}
	if star.des, err = parseFloat(row, rangeDEs); err != nil {
		return nil, fmt.Errorf("cannot parse DEs: %w", err)
	}
	if star.vMag, err = parseFloat(row, rangeVMag); err != nil {
		return nil, fmt.Errorf("cannot parse VMag")
	}
	return star, nil
}

// BrightStar represents a row of the bright stars catalog.
type BrightStar struct {
	// Visual magnitude
	vMag float64

	// [1/9110]+ Harvard Revised = Bright Star Number
	hR string

	// Name, generally Bayer and/or Flamsteed name
	name string

	// Hours RA, equinox J2000, epoch 2000.0
	rah float64

	// Minutes RA, equinox J2000, epoch 2000.0
	ram float64

	// Seconds RA, equinox J2000, epoch 2000.0
	ras float64

	// Degrees Dec, equinox J2000, epoch 2000.0
	ded float64

	// Minutes Dec, equinox J2000, epoch 2000.0
	dem float64

	// Seconds Dec, equinox J2000, epoch 2000.0
	des float64
}

// Declination of the star in radians.
func (s *BrightStar) Declination() float64 {
	return (s.ded + (1.0/60)*s.dem + (1.0/3600)*s.des) * 2 * math.Pi / 360.0
}

// RightAscension of the star in radians.
func (s *BrightStar) RightAscension() float64 {
	return ((1.0/24)*s.rah + (1.0/1440)*s.ram + (1.0/86400)*s.ras) * 2.0 * math.Pi
}

// Intensity is the visual intensity of the star relative to the dimmest star in
// the catalog. See
// https://en.wikipedia.org/wiki/Apparent_magnitude#Calculations for details.
func (s *BrightStar) Intensity() float64 {
	pogsonsRatio := math.Pow(100, 1.0/5)
	return math.Log(math.Pow(pogsonsRatio, (maxVMag - s.vMag)))
}

// getRange returns a substring of the given range from a catalog row.
func getRange(row string, r charRange) string {
	return trim(row[r.low:r.high])
}

// trim trims a string with possible whitespace characters from the catalog.
func trim(s string) string {
	return strings.Trim(s, " \t")
}

// parseFloat returns a float from a catalog row at the given range.
func parseFloat(row string, r charRange) (float64, error) {
	return strconv.ParseFloat(getRange(row, r), 64)
}

// charRange represents a substring.
type charRange struct {
	low  uint32
	high uint32
}

// Maximum visual magnitude of stars in the Yale Bright Star Catalog.
const maxVMag = 7.96

// Character ranges for relevant parameters to be extracted.
var (
	rangeHr   = charRange{low: 0, high: 4}
	rangeName = charRange{low: 4, high: 14}
	rangeRAh  = charRange{low: 75, high: 77}
	rangeRAm  = charRange{low: 77, high: 79}
	rangeRAs  = charRange{low: 79, high: 83}
	rangeDEd  = charRange{low: 83, high: 86}
	rangeDEm  = charRange{low: 86, high: 88}
	rangeDEs  = charRange{low: 88, high: 90}
	rangeVMag = charRange{low: 102, high: 107}
)
