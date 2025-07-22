import type { Vector3 } from "./types";
import * as THREE from "three";

export function radians(degrees: number): number {
    return THREE.MathUtils.DEG2RAD * degrees;
}

export function size(from: Vector3, to: Vector3): Vector3 {
    return [to[0] - from[0], to[1] - from[1], to[2] - from[2]] as const;
}

export function invert(v: Vector3): Vector3 {
    return [-v[0], -v[1], -v[2]] as const;
}

export function mul(v: Vector3, f: number): Vector3 {
    return [v[0] * f, v[1] * f, v[2] * f] as const;
}

export function distance(v: Vector3): number {
    return Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
}
