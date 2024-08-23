
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