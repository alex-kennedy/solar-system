use criterion::{criterion_group, criterion_main, Criterion};
use serde::Deserialize;
use serde_json::Value;
use solar_system::{solve_keplers_equation, AsteroidSet};
use std::collections::HashMap;
use std::fs::File;
use std::io::BufReader;

const WEB_PAYLOADS_PATH: &str = "../data/asteroids/asteroids.json";

pub fn keplers_benchmark(c: &mut Criterion) {
  c.bench_function("keplers_equation_circle", |b| {
    b.iter(|| solve_keplers_equation(0.0, 0.0))
  });
  c.bench_function("keplers_equation_eccentric", |b| {
    b.iter(|| solve_keplers_equation(1.57, 0.9))
  });
  c.bench_function("keplers_equation_pi", |b| {
    b.iter(|| solve_keplers_equation(3.15, 0.5))
  });
}

pub fn asteroid_set_benchmark(c: &mut Criterion) {
  // Creates an asteroid set from every object in the web payload
  let file = match File::open(WEB_PAYLOADS_PATH) {
    Ok(file) => file,
    Err(e) => panic!("{}", e),
  };

  #[derive(Deserialize)]
  struct AsteroidValues {
    #[allow(dead_code)]
    meta: Value,
    asteroids: HashMap<String, Vec<Vec<f32>>>,
  }

  let reader = BufReader::new(file);
  let payload: AsteroidValues = match serde_json::from_reader(reader) {
    Ok(value) => value,
    Err(e) => panic!("{}", e),
  };

  let mut asteroid_sets: HashMap<String, AsteroidSet> = HashMap::new();
  for (set_name, values) in payload.asteroids {
    asteroid_sets.insert(set_name.clone(), AsteroidSet::new());
    let asteroid_set = match asteroid_sets.get_mut(&set_name) {
      Some(v) => v,
      None => unreachable!(),
    };
    for asteroid in values.iter() {
      asteroid_set.push(
        asteroid[0],
        asteroid[1],
        asteroid[2],
        asteroid[3],
        asteroid[4],
        asteroid[5],
      );
    }
  }

  let mut group = c.benchmark_group("recompute_locations");
  group.measurement_time(std::time::Duration::from_secs(30));

  // Benchmarks
  group.bench_function("recompute_locations", |b| {
    b.iter(|| {
      for (_, asteroid_set) in &mut asteroid_sets {
        asteroid_set.recompute_locations(0.0);
      }
    })
  });
}

criterion_group!(benches, keplers_benchmark);
criterion_group!(asteroid_benches, asteroid_set_benchmark);
criterion_main!(benches, asteroid_benches);
