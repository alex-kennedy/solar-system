const calculateAsteroidPosition = (d) => {
  const meanAnomaly = calculateMeanAnomaly(d[0], d[1], d[2]);
  const eccentricAnomaly = solveKeplerEquation(meanAnomaly, d[3], 1e-6);
  const [x, y] = calculateEllipticPosition(d[7], d[3], eccentricAnomaly);
  const [xDash, yDash, zDash] = rotate3d(x, y, d[4], d[5], d[6]);
  return [xDash, yDash, zDash];
};

const calculateMeanAnomaly = (m0, t0, n) => {
  let m = m0 + (n * (new Date().getTime() / 1000 - t0)) / 86400;
  m %= 2 * Math.PI;
  return m;
};

const solveKeplerEquation = (meanAnomaly, e, tol) => {
  // Initial guess
  let E_n;
  if (meanAnomaly > Math.PI) {
    E_n = meanAnomaly - e / 2;
  } else {
    E_n = meanAnomaly + e / 2;
  }

  let delta = 99;
  while (Math.abs(delta) > tol) {
    delta = (E_n - e * Math.sin(E_n) - meanAnomaly) / (1 - e * Math.cos(E_n));
    E_n -= delta;
  }

  return E_n;
};

const calculateEllipticPosition = (a, e, eccentricAnomaly) => {
  const r = a * (1 - e * Math.cos(eccentricAnomaly));
  const atanArg = Math.sqrt((1 + e) / (1 - e)) * Math.tan(eccentricAnomaly / 2);
  const theta = 2 * Math.atan(atanArg);
  const x = r * Math.cos(theta);
  const y = r * Math.sin(theta);
  return [x, y];
};

const rotate3d = (x, y, argPeri, longAsc, inc) => {
  const sinArgPeri = Math.sin(argPeri);
  const cosArgPeri = Math.cos(argPeri);
  const sinLongAsc = Math.sin(longAsc);
  const cosLongAsc = Math.cos(longAsc);
  const sinInc = Math.sin(inc);
  const cosInc = Math.cos(inc);

  const q00 = -sinLongAsc * cosInc * sinArgPeri + cosLongAsc * cosArgPeri;
  const q01 = -sinLongAsc * cosInc * cosArgPeri - cosLongAsc * sinArgPeri;
  const q10 = cosLongAsc * cosInc * sinArgPeri + sinLongAsc * cosArgPeri;
  const q11 = cosLongAsc * cosInc * cosArgPeri - sinLongAsc * sinArgPeri;
  const q20 = sinInc * sinArgPeri;
  const q21 = sinInc * cosLongAsc;

  const xDash = q00 * x + q01 * y;
  const yDash = q10 * x + q11 * y;
  const zDash = q20 * x + q21 * y;
  return [xDash, yDash, zDash];
};

export default calculateAsteroidPosition;
