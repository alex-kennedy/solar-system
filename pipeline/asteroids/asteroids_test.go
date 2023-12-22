package asteroids

import (
	"math"
	"testing"
	"time"
)

func Test_deg2rad(t *testing.T) {
	if deg2rad(180) != 3.1415926535897931 {
		t.Fail()
	}
}

func Test_decodePackedCharacter(t *testing.T) {
	tests := []struct {
		r       rune
		want    int
		wantErr bool
	}{
		{r: '0', want: 0},
		{r: '1', want: 1},
		{r: '9', want: 9},
		{r: 'A', want: 10},
		{r: 'I', want: 18},
		{r: 'J', want: 19},
		{r: 'K', want: 20},
		{r: 'V', want: 31},
		{r: 'W', wantErr: true},
		{r: 'a', wantErr: true},
		{r: 'z', wantErr: true},
		{r: '$', wantErr: true},
		{r: ':', wantErr: true},
		{r: '"', wantErr: true},
		{r: 'h', wantErr: true},
	}

	for _, test := range tests {
		t.Run(string(test.r), func(t *testing.T) {
			got, err := decodePackedCharacter(test.r)
			if (err != nil) != test.wantErr {
				t.Errorf("want decodePackedCharacter(%s) = err, got nil", string(test.r))
			}
			if test.want != got {
				t.Errorf("want decodePackedCharacter(%s) = %d, got %d", string(test.r), test.want, got)
			}
		})
	}
}

func Test_decodePackedDate(t *testing.T) {
	tests := []struct {
		d       string
		want    time.Time
		wantErr bool
	}{
		// # From MPC website
		{d: "J9611", want: time.Date(1996, time.January, 1, 0, 0, 0, 0, time.UTC)},
		{d: "J961A", want: time.Date(1996, time.January, 10, 0, 0, 0, 0, time.UTC)},
		{d: "J969U", want: time.Date(1996, time.September, 30, 0, 0, 0, 0, time.UTC)},
		{d: "J96A1", want: time.Date(1996, time.October, 1, 0, 0, 0, 0, time.UTC)},
		{d: "K01AM", want: time.Date(2001, time.October, 22, 0, 0, 0, 0, time.UTC)},

		{d: "K1811", want: time.Date(2018, time.January, 01, 0, 0, 0, 0, time.UTC)},
		{d: "K181V", want: time.Date(2018, time.January, 31, 0, 0, 0, 0, time.UTC)},
		{d: "J9777", want: time.Date(1997, time.July, 7, 0, 0, 0, 0, time.UTC)},
		{d: "I976C", want: time.Date(1897, time.June, 12, 0, 0, 0, 0, time.UTC)},
		{d: "K162T", want: time.Date(2016, time.February, 29, 0, 0, 0, 0, time.UTC)},
	}

	for _, test := range tests {
		t.Run(test.d, func(t *testing.T) {
			got, err := decodePackedDate(test.d)
			if (err != nil) && !test.wantErr {
				t.Errorf("want decodePackedDate(%s) = %v, got %v", test.d, test.want, err)
			} else if (err == nil) && test.wantErr {
				t.Errorf("want decodePackedDate(%s) = err, got nil", test.d)
			} else {
				// Within 2 minutes (leap seconds and fixed offset)
				if math.Abs(float64(test.want.Unix()-got.Unix())) > 120 {
					t.Errorf("want decodePackedDate(%s) = %v, got %v", test.d, test.want, got)
				}
			}
		})
	}
}
