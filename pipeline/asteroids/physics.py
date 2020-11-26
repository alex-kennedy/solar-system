import numpy as np


def calculate_mean_anomaly(mean_anomaly_at_epoch, mean_daily_motion, time,
                           epoch):
    time_in_days = (time - epoch) / 86400
    return mean_anomaly_at_epoch + mean_anomaly_at_epoch * time_in_days


def solve_kepler(mean_anomaly, e, tolerance=1e-6):
    # Initial guess
    if mean_anomaly > np.pi:
        eccentric_anomaly = mean_anomaly - e / 2
    else:
        eccentric_anomaly = mean_anomaly + e / 2

    delta = 99
    while abs(delta) > tolerance:
        delta = (eccentric_anomaly - e * np.sin(eccentric_anomaly) -
                 mean_anomaly) / (1 - e * np.cos(eccentric_anomaly))
        eccentric_anomaly -= delta

    return eccentric_anomaly


def calculate_elliptic_position(a, e, eccentric_anomaly):
    r = a * (1 - e * np.cos(eccentric_anomaly))
    arctan_arg = np.sqrt(((1 + e) / (1 - e)) * np.tan(eccentric_anomaly / 2))
    theta = 2 * np.arctan(arctan_arg)
    x = r * np.cos(theta)
    y = r * np.sin(theta)
    return x, y


def rotate_3d(x, y, arg_peri, long_asc, inc):
    s_arg_peri = np.sin(arg_peri)
    c_arg_peri = np.cos(arg_peri)
    s_long_asc = np.sin(long_asc)
    c_long_asc = np.cos(long_asc)
    s_inc = np.sin(inc)
    c_inc = np.cos(inc)

    q00 = -s_long_asc * c_inc * s_arg_peri + c_long_asc * c_arg_peri
    q01 = -s_long_asc * c_inc * s_arg_peri - c_long_asc * s_arg_peri
    q10 = c_long_asc * c_inc * s_arg_peri + s_long_asc * c_arg_peri
    q11 = c_long_asc * c_inc * c_arg_peri - s_long_asc * s_arg_peri
    q20 = s_inc * s_arg_peri
    q21 = s_inc * c_long_asc

    x_dash = q00 * x + q01 * y
    y_dash = q10 * x + q11 * y
    z_dash = q20 * x + q21 * y

    return x_dash, y_dash, z_dash


def calculate_asteroid_position():
    pass
