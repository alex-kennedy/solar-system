// Deployment script for asteroid payload. Downloads the latest asteroids file,
// processes it, and saves it to R2.
package main

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"os"

	"github.com/alex-kennedy/solar-system/pipeline/asteroids"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/brotli/go/cbrotli"
	"google.golang.org/protobuf/proto"
)

var (
	BUCKET_NAME = "solarsystem-static"
	OBJECT_PATH = "asteroids/asteroids.pb.br"
)

type Options struct {
	R2Endpoint                 string
	R2AccessKeyID              string
	R2AccessKeySecret          string
	HealthCheckEndpoint        string
	HealthCheckAccessKeyID     string
	HealthCheckAccessKeySecret string
}

// NewOptionsFromEnv pulls options that need to be secret from the environment.
func NewOptionsFromEnv() (*Options, error) {
	o := &Options{
		R2Endpoint:                 os.Getenv("R2_ENDPOINT"),
		R2AccessKeyID:              os.Getenv("R2_ACCESS_KEY_ID"),
		R2AccessKeySecret:          os.Getenv("R2_ACCESS_KEY_SECRET"),
		HealthCheckEndpoint:        os.Getenv("HEALTH_CHECK_ENDPOINT"),
		HealthCheckAccessKeyID:     os.Getenv("HEALTH_CHECK_ACCESS_KEY_ID"),
		HealthCheckAccessKeySecret: os.Getenv("HEALTH_CHECK_ACCESS_KEY_SECRET"),
	}
	if o.R2Endpoint == "" {
		return nil, fmt.Errorf("R2_ENDPOINT is not set")
	}
	if o.R2AccessKeyID == "" {
		return nil, fmt.Errorf("R2_ACCESS_KEY_ID is not set")
	}
	if o.R2AccessKeySecret == "" {
		return nil, fmt.Errorf("R2_ACCESS_KEY_SECRET is not set")
	}
	return o, nil
}

// createAsteroidsPayload loads and processes the asteroids data.
func createAsteroidsPayload() ([]byte, error) {
	asteroids, err := asteroids.GetAsteroidPayload()
	if err != nil {
		log.Fatalf("failed to get asteroids payload: %v\n", err)
	}

	asteroidsSerialized, err := proto.Marshal(asteroids)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal asteroids: %v", err)
	}

	log.Println("compressing asteroids...")

	compressed, err := compressBytes(asteroidsSerialized)
	if err != nil {
		return nil, fmt.Errorf("failed to compress asteroids: %s", err)
	}
	return compressed, nil
}

// compressBytes compresses the given bytes using brotli.
func compressBytes(data []byte) ([]byte, error) {
	b := bytes.NewBuffer([]byte{})
	w := cbrotli.NewWriter(b, cbrotli.WriterOptions{Quality: 11})

	w.Write(data)
	if err := w.Close(); err != nil {
		return nil, err
	}
	return b.Bytes(), nil
}

// writeToR2 writes the asteroids payload to R2 (or any S3 compatible storage).
func writeToR2(ctx context.Context, payload []byte, o *Options) error {
	log.Println("writing asteroids to R2...")

	c, err := config.LoadDefaultConfig(ctx,
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(o.R2AccessKeyID, o.R2AccessKeySecret, "")),
		config.WithRegion("auto"),
	)
	if err != nil {
		return err
	}

	client := s3.NewFromConfig(c, func(s3o *s3.Options) {
		s3o.BaseEndpoint = &o.R2Endpoint
	})

	_, err = client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: &BUCKET_NAME,
		Key:    &OBJECT_PATH,
		Body:   bytes.NewReader(payload),
	})
	if err != nil {
		return err
	}
	return nil
}

func main() {
	options, err := NewOptionsFromEnv()
	if err != nil {
		log.Fatal(err)
	}

	healthChecker := NewHealthChecker(options.HealthCheckEndpoint, options.HealthCheckAccessKeyID, options.HealthCheckAccessKeySecret)
	runID := healthChecker.Start()

	compressed, err := createAsteroidsPayload()
	if err != nil {
		healthChecker.ReportFailure(runID)
		log.Fatalf("failed to build asteroids payload: %s", err)
	}

	if err := writeToR2(context.Background(), compressed, options); err != nil {
		healthChecker.ReportFailure(runID)
		log.Fatalf("failed to write asteroids to R2: %s", err)
	}
	healthChecker.ReportSuccess(runID)
}
