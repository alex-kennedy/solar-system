module github.com/alex-kennedy/solar-system

go 1.24

replace (
	github.com/alex-kennedy/solar-system/asteroidspb => ./proto/go/github.com/alex-kennedy/solar-system/asteroidspb
	github.com/alex-kennedy/solar-system/solarsystempb => ./proto/go/github.com/alex-kennedy/solar-system/solarsystempb
)
