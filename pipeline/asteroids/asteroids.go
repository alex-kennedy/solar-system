// Parse a row of an asteroids entry, see
// https://minorplanetcenter.net//iau/info/MPOrbitFormat.html.
package asteroids

import (
	"fmt"
	"log"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/brandondube/tai"
	"golang.org/x/text/language"
	"golang.org/x/text/message"

	apb "github.com/alex-kennedy/solar-system/asteroidspb"
)

// Terrestrial time (TT) is approximately 32.184s ahead of International
// Atomic Time (TAI).
// See https://en.wikipedia.org/wiki/Terrestrial_Time#TAI.
const ttToTaiNanoseconds = -int64(32.184 * 1e9)

func GetAsteroidPayload() (*apb.Asteroids, error) {
	stats := &Stats{}
	epoch := getEpoch()
	log.Printf("selected epoch: %s\n", epoch.Format("2006-01-02 15:04:05 MST"))
	asteroids := make(map[apb.OrbitType]*apb.AsteroidGroup)

	r, err := NewAsteroidsReader()
	if err != nil {
		return nil, err
	}
	defer r.Close()

	for r.Scan() {
		a, err := r.Next()
		if err != nil {
			return nil, err
		}
		stats.Processed += 1
		if a.OrbitType() == apb.OrbitType_ORBIT_TYPE_UNKNOWN {
			stats.UnknownOrbitType += 1
			continue
		}
		if a.Uncertainty() != 0 {
			stats.TooUncertain += 1
			continue
		}
		if a.Eccentricity > 1 {
			stats.UnboundedOrbit += 1
			continue
		}
		meanAnomaly, err := a.MeanAnomalyAtEpoch(epoch)
		if err != nil {
			stats.Error += 1
			continue
		}
		stats.Valid += 1

		group, ok := asteroids[a.OrbitType()]
		if !ok {
			group = &apb.AsteroidGroup{OrbitType: a.OrbitType()}
			asteroids[group.OrbitType] = group
		}
		group.Asteroids = append(group.Asteroids, &apb.Asteroid{
			Eccentricity:           float32(a.Eccentricity),
			SemiMajorAxis:          float32(a.SemiMajorAxis),
			Inclination:            float32(a.Inclination()),
			LongitudeAscendingNode: float32(a.LongitudeAscendingNode()),
			ArgumentOfPerihelion:   float32(a.ArgumentOfPerihelion()),
			MeanAnomaly:            float32(meanAnomaly),
		})
	}

	payload := &apb.Asteroids{}
	for _, g := range asteroids {
		payload.AsteroidGroups = append(payload.AsteroidGroups, g)
	}

	payload.TimeCreated = uint32(time.Now().Unix())
	payload.EpochTime = uint32(epoch.Unix())

	log.Println(stats.ToString())
	return payload, nil
}

func NewAsteroid(row string) (*Asteroid, error) {
	asteroid := &Asteroid{
		epochPacked:          getRange(row, rangeEpochPacked),
		uncertaintyParameter: getRange(row, rangeUncertaintyParameter),
	}

	var err error
	if asteroid.m0, err = parseFloat(row, rangeM0); err != nil {
		return nil, fmt.Errorf("cannot parse M0: %w", err)
	}
	if asteroid.argPerihelion, err = parseFloat(row, rangeArgPerihelion); err != nil {
		return nil, fmt.Errorf("cannot parse argument of perihelion: %w", err)
	}
	if asteroid.longAscNode, err = parseFloat(row, rangeLongAscNode); err != nil {
		return nil, fmt.Errorf("cannot parse longitude of the ascending node: %w", err)
	}
	if asteroid.inclination, err = parseFloat(row, rangeInclination); err != nil {
		return nil, fmt.Errorf("cannot parse inclination: %w", err)
	}
	if asteroid.Eccentricity, err = parseFloat(row, rangeEccentricity); err != nil {
		return nil, fmt.Errorf("cannot parse eccentricity: %w", err)
	}
	if asteroid.meanDailyMotion, err = parseFloat(row, rangeMeanDailyMotion); err != nil {
		return nil, fmt.Errorf("cannot parse mean daily motion: %w", err)
	}
	if asteroid.SemiMajorAxis, err = parseFloat(row, rangeSemiMajorAxis); err != nil {
		return nil, fmt.Errorf("cannot parse semi major axis: %w", err)
	}
	if asteroid.flags, err = strconv.ParseUint(getRange(row, rangeFlags), 16, 64); err != nil {
		return nil, fmt.Errorf("cannot parse flags: %w", err)
	}

	return asteroid, nil
}

type Asteroid struct {
	// Epoch (in packed form, .0 TT)
	epochPacked string

	// Mean anomaly at the epoch, in degrees
	m0 float64

	// Argument of perihelion, J2000.0 (degrees)
	argPerihelion float64

	// Longitude of the ascending node, J2000.0 (degrees)
	longAscNode float64

	// Inclination to the ecliptic, J2000.0 (degrees)
	inclination float64

	// Orbital eccentricity
	Eccentricity float64

	// Mean daily motion (degrees per day)
	meanDailyMotion float64

	// Semimajor axis (AU)
	SemiMajorAxis float64

	// Uncertainty parameter, U
	uncertaintyParameter string

	// 4-hexdigit flags
	//
	// The bottom 6 bits (bits 0 to 5) are used to encode a value representing the
	// orbit type (other values are undefined):
	//
	// Value
	//
	//	1   Atira
	//	2   Aten
	//	3   Apollo
	//	4   Amor
	//	5   Object with q < 1.665 AU
	//	6   Hungaria
	//	7   Unused or internal MPC use only
	//	8   Hilda
	//	9   Jupiter Trojan
	//	10  Distant object
	//
	// Additional information is conveyed by adding in the following bit values:
	//
	// Bit  Value
	// 11   2048  Object is NEO
	// 12   4096  Object is 1-km (or larger) NEO
	// 13   8192  1-opposition object seen at earlier opposition
	// 14  16384  Critical list numbered object
	// 15  32768  Object is PHA
	flags uint64
}

func (a *Asteroid) Inclination() float64 {
	return deg2rad(a.inclination)
}

func (a *Asteroid) LongitudeAscendingNode() float64 {
	return deg2rad(a.longAscNode)
}

func (a *Asteroid) ArgumentOfPerihelion() float64 {
	return deg2rad(a.argPerihelion)
}

// See https://en.wikipedia.org/wiki/Uncertainty_parameter.
func (a *Asteroid) Uncertainty() int {
	i, err := strconv.Atoi(a.uncertaintyParameter)
	if err != nil {
		return -1
	}
	return i
}

func (a *Asteroid) IsNEO() bool {
	return a.flags&flagNEO != 0
}

func (a *Asteroid) IsLargeNEO() bool {
	return a.flags&flagLargeNEO != 0
}

func (a *Asteroid) OppositionObjectSeenAtEarlierOpposition() bool {
	return a.flags&flag1OppositionObjectSeen != 0
}

func (a *Asteroid) CriticalListNumbered() bool {
	return a.flags&flagCriticalListNumbered != 0
}

func (a *Asteroid) IsPHA() bool {
	return a.flags&flagPHA != 0
}

func (a *Asteroid) IsUnbounded() bool {
	return a.Eccentricity > 1
}

func (a *Asteroid) PerihelionDistance() float64 {
	return a.SemiMajorAxis * (1 - a.Eccentricity)
}

// Somewhat arbitrary, but roughly corresponds to
// https://www.britannica.com/science/asteroid/Geography-of-the-asteroid-belt.
func (a *Asteroid) InAsteroidBelt() bool {
	perihelionDistance := a.PerihelionDistance()
	return 2.06 <= perihelionDistance && perihelionDistance <= 3.28
}

func (a *Asteroid) OrbitType() apb.OrbitType {
	if a.IsNEO() || a.IsPHA() {
		return apb.OrbitType_ORBIT_TYPE_NEO
	}
	if a.IsUnbounded() {
		return apb.OrbitType_ORBIT_TYPE_UNKNOWN
	}
	orbitTypeID := a.flags & flagOrbitType
	if orbitTypeID == orbitTypeHungaria {
		return apb.OrbitType_ORBIT_TYPE_HUNGARIA
	}
	if orbitTypeID == orbitTypeTrojan {
		return apb.OrbitType_ORBIT_TYPE_JUPITER_TROJAN
	}
	if orbitTypeID == orbitTypeHilda {
		return apb.OrbitType_ORBIT_TYPE_HILDA
	}
	if orbitTypeID == orbitTypeQBounded {
		return apb.OrbitType_ORBIT_TYPE_Q_BOUNDED
	}
	if a.InAsteroidBelt() {
		return apb.OrbitType_ORBIT_TYPE_ASTEROID_BELT
	}
	return apb.OrbitType_ORBIT_TYPE_UNKNOWN
}

func (a *Asteroid) Epoch() (time.Time, error) {
	return decodePackedDate(a.epochPacked)
}

func (a *Asteroid) MeanAnomalyAtEpoch(t time.Time) (float64, error) {
	epoch, err := a.Epoch()
	if err != nil {
		return 0.0, err
	}
	deltaT := float64((t.UnixNano() - epoch.UnixNano())) / 1e9
	return deg2rad(a.m0 + (a.meanDailyMotion/86400)*deltaT), nil
}

// getEpoch returns the start of the current day in UTC.
func getEpoch() time.Time {
	now := time.Now()
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
}

type Stats struct {
	Processed        uint32
	Valid            uint32
	UnknownOrbitType uint32
	SkippedOrbitType uint32
	TooUncertain     uint32
	UnboundedOrbit   uint32
	Error            uint32
}

func (s *Stats) ToString() string {
	p := message.NewPrinter(language.English)
	var lines []string
	lines = append(lines, p.Sprintf("processed %d asteroids (%d added, %d skipped)", s.Processed, s.Valid, s.Processed-s.Valid))
	lines = append(lines, p.Sprintf("UnknownOrbitType: %d", s.UnknownOrbitType))
	lines = append(lines, p.Sprintf("TooUncertain: %d", s.TooUncertain))
	lines = append(lines, p.Sprintf("UnboundedOrbit: %d", s.UnboundedOrbit))
	lines = append(lines, p.Sprintf("Error: %d", s.Error))
	return strings.Join(lines, "\n")
}

// Orbit type flags as in
// https://www.minorplanetcenter.net/iau/info/MPOrbitFormat.html.
//
// The bottom 6 bits (bits 0 to 5) are used to encode
// a value representing the orbit type (see below).
//
// Additional information is conveyed by
// adding in the following bit values:
//
// Bit  Value
// 6      64  Unused or internal MPC use only
// 7     128  Unused or internal MPC use only
// 8     256  Unused or internal MPC use only
// 9     512  Unused or internal MPC use only
// 10   1024  Unused or internal MPC use only
// 11   2048  Object is NEO
// 12   4096  Object is 1-km (or larger) NEO
// 13   8192  1-opposition object seen at earlier opposition
// 14  16384  Critical list numbered object
// 15  32768  Object is PHA
const (
	flagOrbitType             = 0x3F // Bottom 6 bits
	flagNEO                   = 1 << 11
	flagLargeNEO              = 1 << 12
	flag1OppositionObjectSeen = 1 << 13
	flagCriticalListNumbered  = 1 << 14
	flagPHA                   = 1 << 15
)

// Used to encode a value representing the orbit type (other values are
// undefined):
//
//	 Value
//			1  Atira
//			2  Aten
//			3  Apollo
//			4  Amor
//			5  Object with q < 1.665 AU
//			6  Hungaria
//			7  Unused or internal MPC use only
//			8  Hilda
//			9  Jupiter Trojan
//		 10  Distant object
const (
	orbitTypeAtira    = 1
	orbitTypeAten     = 2
	orbitTypeApollo   = 3
	orbitTypeAmor     = 4
	orbitTypeQBounded = 5
	orbitTypeHungaria = 6
	orbitTypeHilda    = 8
	orbitTypeTrojan   = 9
	orbitTypeDistant  = 10
)

// Character ranges for each column from
// https://www.minorplanetcenter.net/iau/info/MPOrbitFormat.html
var (
	rangeEpochPacked          = charRange{low: 20, high: 25}
	rangeM0                   = charRange{low: 26, high: 35}
	rangeArgPerihelion        = charRange{low: 37, high: 46}
	rangeLongAscNode          = charRange{low: 48, high: 57}
	rangeInclination          = charRange{low: 59, high: 68}
	rangeEccentricity         = charRange{low: 70, high: 79}
	rangeMeanDailyMotion      = charRange{low: 80, high: 91}
	rangeSemiMajorAxis        = charRange{low: 92, high: 103}
	rangeUncertaintyParameter = charRange{low: 105, high: 106}
	rangeFlags                = charRange{low: 161, high: 165}
)

// charRange represents a substring.
type charRange struct {
	low  uint32
	high uint32
}

// parseFloat returns a float from a catalog row at the given range.
func parseFloat(row string, r charRange) (float64, error) {
	return strconv.ParseFloat(getRange(row, r), 64)
}

// getRange returns a substring of the given range from a catalog row.
func getRange(row string, r charRange) string {
	return trim(row[r.low:r.high])
}

// trim trims a string with possible whitespace characters from the catalog.
func trim(s string) string {
	return strings.Trim(s, " \t")
}

func decodePackedDate(d string) (time.Time, error) {
	d = strings.Trim(d, " \t")
	if len(d) != 5 {
		return time.Time{}, fmt.Errorf("want packed date string to be 5 characters, got '%s'", d)
	}
	var parts []int
	for _, c := range d {
		n, err := decodePackedCharacter(c)
		if err != nil {
			return time.Time{}, err
		}
		parts = append(parts, n)
	}

	s, ns := tai.Date((parts[0]*100)+(10*parts[1])+parts[2], parts[3], parts[4]).Unix()
	return time.Unix(s, ns+ttToTaiNanoseconds).In(time.UTC), nil
}

// https://www.minorplanetcenter.net/iau/info/PackedDates.html
func decodePackedCharacter(c rune) (int, error) {
	// Month     Day      Character         Day      Character
	// in Col 4 or 5              in Col 4 or 5
	// Jan.       1           1             17           H
	// Feb.       2           2             18           I
	// Mar.       3           3             19           J
	// Apr.       4           4             20           K
	// May        5           5             21           L
	// June       6           6             22           M
	// July       7           7             23           N
	// Aug.       8           8             24           O
	// Sept.      9           9             25           P
	// Oct.      10           A             26           Q
	// Nov.      11           B             27           R
	// Dec.      12           C             28           S
	//           13           D             29           T
	//           14           E             30           U
	//           15           F             31           V
	//           16           G
	code := int(c)
	if code >= 48 && code <= 57 {
		return code - 48, nil
	} else if code >= 65 && code <= 86 {
		return code - 55, nil
	}
	return 0, fmt.Errorf("unable to unpack character to minor planet center number: %c, want [1-9A-V]", c)
}

func deg2rad(deg float64) float64 {
	return math.Mod(deg*(math.Pi/180.0), 2*math.Pi)
}
