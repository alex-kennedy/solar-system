module github.com/alex-kennedy/solar-system

go 1.24

replace (
	github.com/alex-kennedy/solar-system/asteroidspb => ./proto/go/github.com/alex-kennedy/solar-system/asteroidspb
	github.com/alex-kennedy/solar-system/solarsystempb => ./proto/go/github.com/alex-kennedy/solar-system/solarsystempb
)

require (
	github.com/alex-kennedy/solar-system/pipeline/asteroids v0.0.0-20250420052931-4640696b0e14
	github.com/google/brotli/go/cbrotli v0.0.0-20250131134309-440e03642b89
	github.com/schollz/progressbar/v3 v3.18.0
	google.golang.org/protobuf v1.36.6
)

require (
	github.com/alex-kennedy/solar-system/asteroidspb v0.0.0-00010101000000-000000000000 // indirect
	github.com/brandondube/tai v0.1.0 // indirect
	github.com/mitchellh/colorstring v0.0.0-20190213212951-d06e56a500db // indirect
	github.com/rivo/uniseg v0.4.7 // indirect
	golang.org/x/sys v0.32.0 // indirect
	golang.org/x/term v0.31.0 // indirect
	golang.org/x/text v0.24.0 // indirect
)
