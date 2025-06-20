// Utilities for contacting a healthchecks.io API.

package main

import (
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
)

// HealthChecker is an interface for the healthchecks.io interface. All methods
// ignore errors, since this is itself for monitoring.
type HealthChecker struct {
	endpoint        string
	accessKeyID     string
	accessKeySecret string
}

// NewHealthChecker creates a new healthchecks.io interface. Accepts the
// healthchecks.io (or self-hosted) endpoint, and Cloudflare access ID and
// secret for Cloudflare auth, if configured.
func NewHealthChecker(endpoint, accessKeyID, accessKeySecret string) *HealthChecker {
	return &HealthChecker{
		endpoint:        strings.TrimRight(endpoint, "/"),
		accessKeyID:     accessKeyID,
		accessKeySecret: accessKeySecret,
	}
}

// Start begins a new check and returns the run ID. Ignores errors.
func (h *HealthChecker) Start() string {
	runID := uuid.New().String()
	h.do(h.endpoint + "/start?rid=" + runID)
	return runID
}

// ReportSuccess completes the run successfully.
func (h *HealthChecker) ReportSuccess(runID string) {
	h.do(h.endpoint + "?rid=" + runID)
}

// ReportFailure completes the run unsuccessfully.
func (h *HealthChecker) ReportFailure(runID string) {
	h.do(h.endpoint + "/fail?rid=" + runID)
}

func (h *HealthChecker) do(path string) {
	if h.endpoint == "" {
		return
	}
	req, err := http.NewRequest("POST", path, nil)
	if err != nil {
		log.Println("Error creating health request:", err)
		return
	}
	h.addHeaders(req)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println("Error reporting health:", err)
		return
	}
	if resp.StatusCode != 200 {
		log.Printf("Failed to report health: error %d: %s\n", resp.StatusCode, resp.Status)
		return
	}
}

func (h *HealthChecker) addHeaders(r *http.Request) {
	if h.accessKeyID != "" {
		r.Header.Add("CF-Access-Client-Id", h.accessKeyID)
	}
	if h.accessKeySecret != "" {
		r.Header.Add("CF-Access-Client-Secret", h.accessKeySecret)
	}
}
