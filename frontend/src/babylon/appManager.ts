import {ArcRotateCamera, Engine, Scene} from "@babylonjs/core"
import {AdvancedDynamicTexture} from "@babylonjs/gui"
import {CelestialBody} from "./celestialBody.ts"
import {CelestialBodyType} from "./types.ts"
import {PlanetarySystem} from "./planetarySystem.ts"
import {Db} from "../dbManager.ts"


export class AppManager {
    private static _instance: AppManager
    private _engine!: Engine
    private _scene!: Scene
    private _camera!: ArcRotateCamera
    private _uiTexture!: AdvancedDynamicTexture
    private _selected: { name: string, version: string } = { name: "", version: "" }
    depsDivList: HTMLButtonElement[] = []
    depsProgress: { max: number; value: number } = { max: 1, value: 0 }
    // @ts-ignore
    cache: CelestialBody[] = []

    private constructor() {}

    static get Instance() { return this._instance || (this._instance = new this()) }

    set engine(engine: Engine) { this._engine = engine }

    get engine() { return this._engine }

    set scene(scene: Scene) { this._scene = scene }

    get scene() { return this._scene }

    set camera(camera: ArcRotateCamera) { this._camera = camera }

    get camera() { return this._camera }

    set uiTexture(texture: AdvancedDynamicTexture) { this._uiTexture = texture }

    get uiTexture() { return this._uiTexture }

    set selected(selected: { name: string, version: string }) {
        this._selected.name = selected.name
        this._selected.version = selected.version
    }

    get selected() { return this._selected }

    async createStuff() {
        this.cache.forEach(c => c.dispose())
        this.cache = []
        const data = await Db.Instance.getLibrary(this._selected.name, this._selected.version)
        if (!data) return null
        const sun = new CelestialBody(null, data, CelestialBodyType.STAR, 0)
        const system = new PlanetarySystem(sun, data)
        this._camera.radius = 1.5 * system.diameter
    }
}