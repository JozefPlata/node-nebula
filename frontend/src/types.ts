import {Mesh, Vector3} from "@babylonjs/core";

export type CelestialBodyT = {
    type: CelestialBodyType
    position: () => Vector3
    name: string,
    mesh: Mesh,
    size: number,
    ellipseRadius: number,
    speed: number
}

export enum CelestialBodyType {
    STAR,
    PLANET,
    MOON,
    ASTEROID,
    COMET
}

export type ResolvedPackage = {
    name: string
    version: string
    resolvedDependencies: ResolvedDependencies
}

export type ResolvedDependencies = { [key: string]: ResolvedPackage }