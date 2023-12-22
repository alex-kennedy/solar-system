/* eslint-disable */
import * as _m0 from "protobufjs/minimal";

export const protobufPackage = "";

export enum ObitType {
  ORBIT_TYPE_UNKNOWN = 0,
  ORBIT_TYPE_Q_BOUNDED = 1,
  ORBIT_TYPE_HUNGARIA = 2,
  ORBIT_TYPE_HILDA = 3,
  ORBIT_TYPE_JUPITER_TROJAN = 4,
  ORBIT_TYPE_NEO = 5,
  ORBIT_TYPE_ASTEROID_BELT = 6,
  UNRECOGNIZED = -1,
}

export function obitTypeFromJSON(object: any): ObitType {
  switch (object) {
    case 0:
    case "ORBIT_TYPE_UNKNOWN":
      return ObitType.ORBIT_TYPE_UNKNOWN;
    case 1:
    case "ORBIT_TYPE_Q_BOUNDED":
      return ObitType.ORBIT_TYPE_Q_BOUNDED;
    case 2:
    case "ORBIT_TYPE_HUNGARIA":
      return ObitType.ORBIT_TYPE_HUNGARIA;
    case 3:
    case "ORBIT_TYPE_HILDA":
      return ObitType.ORBIT_TYPE_HILDA;
    case 4:
    case "ORBIT_TYPE_JUPITER_TROJAN":
      return ObitType.ORBIT_TYPE_JUPITER_TROJAN;
    case 5:
    case "ORBIT_TYPE_NEO":
      return ObitType.ORBIT_TYPE_NEO;
    case 6:
    case "ORBIT_TYPE_ASTEROID_BELT":
      return ObitType.ORBIT_TYPE_ASTEROID_BELT;
    case -1:
    case "UNRECOGNIZED":
    default:
      return ObitType.UNRECOGNIZED;
  }
}

export function obitTypeToJSON(object: ObitType): string {
  switch (object) {
    case ObitType.ORBIT_TYPE_UNKNOWN:
      return "ORBIT_TYPE_UNKNOWN";
    case ObitType.ORBIT_TYPE_Q_BOUNDED:
      return "ORBIT_TYPE_Q_BOUNDED";
    case ObitType.ORBIT_TYPE_HUNGARIA:
      return "ORBIT_TYPE_HUNGARIA";
    case ObitType.ORBIT_TYPE_HILDA:
      return "ORBIT_TYPE_HILDA";
    case ObitType.ORBIT_TYPE_JUPITER_TROJAN:
      return "ORBIT_TYPE_JUPITER_TROJAN";
    case ObitType.ORBIT_TYPE_NEO:
      return "ORBIT_TYPE_NEO";
    case ObitType.ORBIT_TYPE_ASTEROID_BELT:
      return "ORBIT_TYPE_ASTEROID_BELT";
    case ObitType.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface Asteroids {
  /** Unix seconds. */
  timeCreated: number;
  /** Unix seconds. */
  epochTime: number;
  asteroidGroups: AsteroidGroup[];
}

export interface AsteroidGroup {
  orbitType: ObitType;
  /** Asteroids in the group. */
  asteroids: Asteroid[];
}

/** Orbital elements for an asteroid. */
export interface Asteroid {
  eccentricity: number;
  semiMajorAxis: number;
  inclination: number;
  longitudeAscendingNode: number;
  argumentOfPerihelion: number;
  meanAnomaly: number;
}

function createBaseAsteroids(): Asteroids {
  return { timeCreated: 0, epochTime: 0, asteroidGroups: [] };
}

export const Asteroids = {
  encode(message: Asteroids, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.timeCreated !== 0) {
      writer.uint32(8).uint32(message.timeCreated);
    }
    if (message.epochTime !== 0) {
      writer.uint32(16).uint32(message.epochTime);
    }
    for (const v of message.asteroidGroups) {
      AsteroidGroup.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Asteroids {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAsteroids();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.timeCreated = reader.uint32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.epochTime = reader.uint32();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.asteroidGroups.push(AsteroidGroup.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Asteroids {
    return {
      timeCreated: isSet(object.timeCreated) ? Number(object.timeCreated) : 0,
      epochTime: isSet(object.epochTime) ? Number(object.epochTime) : 0,
      asteroidGroups: Array.isArray(object?.asteroidGroups)
        ? object.asteroidGroups.map((e: any) => AsteroidGroup.fromJSON(e))
        : [],
    };
  },

  toJSON(message: Asteroids): unknown {
    const obj: any = {};
    if (message.timeCreated !== 0) {
      obj.timeCreated = Math.round(message.timeCreated);
    }
    if (message.epochTime !== 0) {
      obj.epochTime = Math.round(message.epochTime);
    }
    if (message.asteroidGroups?.length) {
      obj.asteroidGroups = message.asteroidGroups.map((e) => AsteroidGroup.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Asteroids>, I>>(base?: I): Asteroids {
    return Asteroids.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Asteroids>, I>>(object: I): Asteroids {
    const message = createBaseAsteroids();
    message.timeCreated = object.timeCreated ?? 0;
    message.epochTime = object.epochTime ?? 0;
    message.asteroidGroups = object.asteroidGroups?.map((e) => AsteroidGroup.fromPartial(e)) || [];
    return message;
  },
};

function createBaseAsteroidGroup(): AsteroidGroup {
  return { orbitType: 0, asteroids: [] };
}

export const AsteroidGroup = {
  encode(message: AsteroidGroup, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.orbitType !== 0) {
      writer.uint32(8).int32(message.orbitType);
    }
    for (const v of message.asteroids) {
      Asteroid.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AsteroidGroup {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAsteroidGroup();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.orbitType = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.asteroids.push(Asteroid.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): AsteroidGroup {
    return {
      orbitType: isSet(object.orbitType) ? obitTypeFromJSON(object.orbitType) : 0,
      asteroids: Array.isArray(object?.asteroids) ? object.asteroids.map((e: any) => Asteroid.fromJSON(e)) : [],
    };
  },

  toJSON(message: AsteroidGroup): unknown {
    const obj: any = {};
    if (message.orbitType !== 0) {
      obj.orbitType = obitTypeToJSON(message.orbitType);
    }
    if (message.asteroids?.length) {
      obj.asteroids = message.asteroids.map((e) => Asteroid.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<AsteroidGroup>, I>>(base?: I): AsteroidGroup {
    return AsteroidGroup.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<AsteroidGroup>, I>>(object: I): AsteroidGroup {
    const message = createBaseAsteroidGroup();
    message.orbitType = object.orbitType ?? 0;
    message.asteroids = object.asteroids?.map((e) => Asteroid.fromPartial(e)) || [];
    return message;
  },
};

function createBaseAsteroid(): Asteroid {
  return {
    eccentricity: 0,
    semiMajorAxis: 0,
    inclination: 0,
    longitudeAscendingNode: 0,
    argumentOfPerihelion: 0,
    meanAnomaly: 0,
  };
}

export const Asteroid = {
  encode(message: Asteroid, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.eccentricity !== 0) {
      writer.uint32(13).float(message.eccentricity);
    }
    if (message.semiMajorAxis !== 0) {
      writer.uint32(21).float(message.semiMajorAxis);
    }
    if (message.inclination !== 0) {
      writer.uint32(29).float(message.inclination);
    }
    if (message.longitudeAscendingNode !== 0) {
      writer.uint32(37).float(message.longitudeAscendingNode);
    }
    if (message.argumentOfPerihelion !== 0) {
      writer.uint32(45).float(message.argumentOfPerihelion);
    }
    if (message.meanAnomaly !== 0) {
      writer.uint32(53).float(message.meanAnomaly);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Asteroid {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAsteroid();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 13) {
            break;
          }

          message.eccentricity = reader.float();
          continue;
        case 2:
          if (tag !== 21) {
            break;
          }

          message.semiMajorAxis = reader.float();
          continue;
        case 3:
          if (tag !== 29) {
            break;
          }

          message.inclination = reader.float();
          continue;
        case 4:
          if (tag !== 37) {
            break;
          }

          message.longitudeAscendingNode = reader.float();
          continue;
        case 5:
          if (tag !== 45) {
            break;
          }

          message.argumentOfPerihelion = reader.float();
          continue;
        case 6:
          if (tag !== 53) {
            break;
          }

          message.meanAnomaly = reader.float();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Asteroid {
    return {
      eccentricity: isSet(object.eccentricity) ? Number(object.eccentricity) : 0,
      semiMajorAxis: isSet(object.semiMajorAxis) ? Number(object.semiMajorAxis) : 0,
      inclination: isSet(object.inclination) ? Number(object.inclination) : 0,
      longitudeAscendingNode: isSet(object.longitudeAscendingNode) ? Number(object.longitudeAscendingNode) : 0,
      argumentOfPerihelion: isSet(object.argumentOfPerihelion) ? Number(object.argumentOfPerihelion) : 0,
      meanAnomaly: isSet(object.meanAnomaly) ? Number(object.meanAnomaly) : 0,
    };
  },

  toJSON(message: Asteroid): unknown {
    const obj: any = {};
    if (message.eccentricity !== 0) {
      obj.eccentricity = message.eccentricity;
    }
    if (message.semiMajorAxis !== 0) {
      obj.semiMajorAxis = message.semiMajorAxis;
    }
    if (message.inclination !== 0) {
      obj.inclination = message.inclination;
    }
    if (message.longitudeAscendingNode !== 0) {
      obj.longitudeAscendingNode = message.longitudeAscendingNode;
    }
    if (message.argumentOfPerihelion !== 0) {
      obj.argumentOfPerihelion = message.argumentOfPerihelion;
    }
    if (message.meanAnomaly !== 0) {
      obj.meanAnomaly = message.meanAnomaly;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Asteroid>, I>>(base?: I): Asteroid {
    return Asteroid.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Asteroid>, I>>(object: I): Asteroid {
    const message = createBaseAsteroid();
    message.eccentricity = object.eccentricity ?? 0;
    message.semiMajorAxis = object.semiMajorAxis ?? 0;
    message.inclination = object.inclination ?? 0;
    message.longitudeAscendingNode = object.longitudeAscendingNode ?? 0;
    message.argumentOfPerihelion = object.argumentOfPerihelion ?? 0;
    message.meanAnomaly = object.meanAnomaly ?? 0;
    return message;
  },
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
