import {ArcRotateCamera, Engine, Scene} from "@babylonjs/core";
import {AdvancedDynamicTexture} from "@babylonjs/gui";

import {CelestialBody} from "./celestialBody.ts";

export class AppManager {
    private static _instance: AppManager
    private _engine!: Engine
    private _scene!: Scene
    private _camera!: ArcRotateCamera
    private _uiTexture!: AdvancedDynamicTexture
    // @ts-ignore
    cache: CelestialBody[] = []

    private constructor() {}

    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    set engine(engine: Engine) {
        this._engine = engine
    }

    get engine() {
        return this._engine
    }

    set scene(scene: Scene) {
        this._scene = scene
    }

    get scene() {
        return this._scene
    }

    set camera(camera: ArcRotateCamera) {
        this._camera = camera
    }

    get camera() {
        return this._camera
    }

    set uiTexture(texture: AdvancedDynamicTexture) {
        this._uiTexture = texture
    }

    get uiTexture() {
        return this._uiTexture
    }
}