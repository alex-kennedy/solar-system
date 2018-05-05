class OrbitingObject {
    constructor(name, a, e, I, L, long_peri, long_node) {
        this.name = name || "";
        this.a = a;
        this.e = e;
        this.I = I;
        this.L = L;
        this.long_peri = long_peri;
        this.long_node = long_node;
    }

    solveKepler(tol) {
        // Currently only solves in degrees
        tol = typeof tol !== 'undefined' ? tol : 1e-5;

        var e_star = (180 / Math.PI) * this.e;
        var E_n = this.M + e_star * Math.sin((Math.PI / 180) * this.M);
        var delta = 360;
        var count = 0;

        while (Math.abs(delta) > tol) {
            delta = (this.M - (E_n - e_star * Math.sin((Math.PI / 180) * E_n))) / (1 - this.e * Math.cos((Math.PI / 180) * E_n));
            E_n = E_n + delta;
            count = count + 1;
        }

        this.E = E_n;

        return E_n;
    }

    getCenturiesTT() {
        // Get the number of centuries that have elapsed since J2000.0, TT
        var nowTT = this.getNowTT();
        return ((nowTT / 86400.0) - 10957.5) / 36525;
    }

    getNowTT() {
        // Get the current time as a unix seconds, but in Terrestrial Time
        return Date.now() / 1000 + 69.184;
      }

}


class Planet extends OrbitingObject {
    constructor(name, elements) {
        super(name);
        
        this.time_centuries = this.getCenturiesTT();

        for (var key in elements) {
            if (elements.hasOwnProperty(key)) {
                this[key] = elements[key][0] + this.time_centuries * elements[key][1];
            }
        }

        this.arg_peri = this.long_peri - this.long_node;
        this.M = ((this.L - this.long_peri + 180) % 360) - 180;
        
        this.solveKepler();
        this.transformToGeocentric();
    }

    transformToGeocentric(true_anomaly) {
        true_anomaly = true_anomaly || this.E || 0;

        var x = this.a * (Math.cos((Math.PI/180) * true_anomaly) - this.e);
        var y = this.a * Math.sqrt(1 - Math.pow(this.e, 2));

        var conv = Math.PI/180;

        var co = Math.cos(conv * this.arg_peri);
        var cO = Math.cos(conv * this.long_node);
        var cI = Math.cos(conv * this.I);
        var so = Math.sin(conv * this.arg_peri);
        var sO = Math.sin(conv * this.long_node);
        var sI = Math.sin(conv * this.I);

        var x_ecl = (co*cO - so*sO*cI) * x + (-so*cO - co*sO*cI) * y;
        var y_ecl = (co*sO + so*cO*cI) * x + (-so*sO + co*cO*cI) * y;
        var z_ecl = (so*sI) * x + (co*sI) * y;

        this.currentCoords = [x_ecl, y_ecl, z_ecl];
        return this.currentCoords;
    }

}

export default Planet