// Interface for the Yale Bright Star Catalog.
// See http://tdc-www.harvard.edu/catalogs/bsc5.readme.
package main

import (
	"bytes"
	"compress/gzip"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/brotli/go/cbrotli"
	"google.golang.org/protobuf/proto"

	solarsystempb "github.com/alex-kennedy/solar-system/solarsystempb"
)

// Originally from http://tdc-www.harvard.edu/catalogs/bsc5.dat.gz.
const catalogUrl = "http://static.alexkennedy.dev/brightstars/bsc5.dat.gz"

// ParseBrightStars processes and returns the bright stars of the Yale Bright
// Stars Catalog.
func ParseBrightStars(catalog string) (*solarsystempb.BrightStars, error) {
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

// DownloadCatalog downloads the bright stars catalog, decompresses it, and
// returns it as a string (the file is ASCII encoded).
func DownloadCatalog() (string, error) {
	response, err := http.Get(catalogUrl)
	if err != nil {
		log.Printf("error downloading bright stars, got: %v\n", err)
		return "", err
	}
	defer response.Body.Close()

	reader, err := gzip.NewReader(response.Body)
	if err != nil {
		log.Printf("error unzipping bright stars, got: %v\n", err)
		return "", err
	}
	defer reader.Close()

	b, err := io.ReadAll(reader)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// BuildWebPayload creates the data loaded by the front-end, a brotli compressed
// binary proto of the bright stars message.
func BuildWebPayload(bs *solarsystempb.BrightStars) ([]byte, error) {
	serialized, err := proto.Marshal(bs)
	if err != nil {
		return nil, err
	}
	compressed, err := cbrotli.Encode(serialized, cbrotli.WriterOptions{Quality: 11})
	if err != nil {
		return nil, err
	}
	return compressed, nil
}

// OutputOptions represents options for the R2 output access, bucket, and path.
type OutputOptions struct {
	BucketName      string
	AccountId       string
	AccessKeyId     string
	AccessKeySecret string
	ObjectPath      string
}

// WriteToR2 writes the bright stars payload to R2 based on the output options.
func WriteToR2(ctx context.Context, payload []byte, options *OutputOptions) error {
	c, err := config.LoadDefaultConfig(ctx,
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(options.AccessKeyId, options.AccessKeySecret, "")),
		config.WithRegion("auto"),
	)
	if err != nil {
		return err
	}

	client := s3.NewFromConfig(c, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", options.AccountId))
	})

	_, err = client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: &options.BucketName,
		Key:    &options.ObjectPath,
		Body:   bytes.NewReader(payload),
	})
	if err != nil {
		return err
	}
	return nil
}

// normaliseIntensity normalises intensity of stars to be <= 1.
func normaliseIntensity(stars *solarsystempb.BrightStars) {
	scaleFactor := maxIntensity(stars.BrightStars)
	for _, star := range stars.BrightStars {
		star.Intensity = star.GetIntensity() / scaleFactor
	}
}

// maxIntensity computes the maximum intensity of all stars in the slice.
func maxIntensity(stars []*solarsystempb.BrightStar) float32 {
	x := float32(1.0)
	for _, star := range stars {
		if x < star.GetIntensity() {
			x = star.GetIntensity()
		}
	}
	return x
}
