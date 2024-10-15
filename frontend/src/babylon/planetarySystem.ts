import {CelestialBodyType, ResolvedPackage} from "./types.ts"
import {AppManager} from "./appManager.ts"
import {CelestialBody} from "./celestialBody.ts"


export class PlanetarySystem {
    private readonly _diameter: number;

    constructor(centralBody: CelestialBody, data: ResolvedPackage) {
        let distance = centralBody.diameter + 1
        for (let [_, dep] of Object.entries(data.resolvedDependencies)) {
            const planet = new CelestialBody(centralBody, dep, CelestialBodyType.PLANET, distance)
            distance = planet.ellipseRadius + planet.diameter + 1
            planet.observer = AppManager.Instance.scene.onBeforeRenderObservable.add(() => {
                planet.masterNode!.rotation.y += planet.speed
            })
        }
        this._diameter = distance
    }

    get diameter() { return this._diameter }
}

