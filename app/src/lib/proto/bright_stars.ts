/* eslint-disable */
import * as _m0 from "protobufjs/minimal";

export const protobufPackage = "";

export interface BrightStars {
  /** Set of bright stars from the Yale Bright Star catalog. */
  brightStars: BrightStar[];
}

export interface BrightStar {
  /** Right ascension in radians. */
  rightAscension: number;
  /** Declination in radians. */
  declination: number;
  /** Stellar intensity normalised between 0 and 1. */
  intensity: number;
}

function createBaseBrightStars(): BrightStars {
  return { brightStars: [] };
}

export const BrightStars = {
  encode(message: BrightStars, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.brightStars) {
      BrightStar.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BrightStars {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBrightStars();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.brightStars.push(BrightStar.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BrightStars {
    return {
      brightStars: Array.isArray(object?.brightStars) ? object.brightStars.map((e: any) => BrightStar.fromJSON(e)) : [],
    };
  },

  toJSON(message: BrightStars): unknown {
    const obj: any = {};
    if (message.brightStars?.length) {
      obj.brightStars = message.brightStars.map((e) => BrightStar.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BrightStars>, I>>(base?: I): BrightStars {
    return BrightStars.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BrightStars>, I>>(object: I): BrightStars {
    const message = createBaseBrightStars();
    message.brightStars = object.brightStars?.map((e) => BrightStar.fromPartial(e)) || [];
    return message;
  },
};

function createBaseBrightStar(): BrightStar {
  return { rightAscension: 0, declination: 0, intensity: 0 };
}

export const BrightStar = {
  encode(message: BrightStar, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.rightAscension !== 0) {
      writer.uint32(13).float(message.rightAscension);
    }
    if (message.declination !== 0) {
      writer.uint32(21).float(message.declination);
    }
    if (message.intensity !== 0) {
      writer.uint32(29).float(message.intensity);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BrightStar {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBrightStar();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 13) {
            break;
          }

          message.rightAscension = reader.float();
          continue;
        case 2:
          if (tag !== 21) {
            break;
          }

          message.declination = reader.float();
          continue;
        case 3:
          if (tag !== 29) {
            break;
          }

          message.intensity = reader.float();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BrightStar {
    return {
      rightAscension: isSet(object.rightAscension) ? Number(object.rightAscension) : 0,
      declination: isSet(object.declination) ? Number(object.declination) : 0,
      intensity: isSet(object.intensity) ? Number(object.intensity) : 0,
    };
  },

  toJSON(message: BrightStar): unknown {
    const obj: any = {};
    if (message.rightAscension !== 0) {
      obj.rightAscension = message.rightAscension;
    }
    if (message.declination !== 0) {
      obj.declination = message.declination;
    }
    if (message.intensity !== 0) {
      obj.intensity = message.intensity;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BrightStar>, I>>(base?: I): BrightStar {
    return BrightStar.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BrightStar>, I>>(object: I): BrightStar {
    const message = createBaseBrightStar();
    message.rightAscension = object.rightAscension ?? 0;
    message.declination = object.declination ?? 0;
    message.intensity = object.intensity ?? 0;
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
