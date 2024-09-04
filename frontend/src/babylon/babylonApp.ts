import {
    ArcRotateCamera,
    Color4,
    Engine,
    KeyboardEventTypes, MeshBuilder,
    PointLight,
    Scene,
    Vector3,
} from "@babylonjs/core";
import {AppManager} from "./appManager.ts";
import {AdvancedDynamicTexture} from "@babylonjs/gui";
import {CelestialBodyType, ResolvedPackage} from "./types.ts";
import {PlanetarySystem} from "./planetarySystem.ts";
import {CelestialBody} from "./celestialBody.ts";
import {GridMaterial} from "@babylonjs/materials";

export class BabylonApp {
    private readonly _canvas: HTMLCanvasElement
    // private readonly _name = "babylon-container"

    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas
        AppManager.Instance.engine = new Engine(this._canvas, true)
        AppManager.Instance.scene = this._createScene()
        AppManager.Instance.camera = this._createCamera(AppManager.Instance.scene)
        AppManager.Instance.uiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI")
        this._setupInputs()
        this._loadingSceneSetup()
        this._render()
    }

    private _loadingSceneSetup() {
        const grid = new GridMaterial("grid", AppManager.Instance.scene)
        const box = MeshBuilder.CreateBox("box", { size: 1 }, AppManager.Instance.scene)
        box.scaling = new Vector3(20, 20, 20)
        box.material = grid
    }

    private _createScene(): Scene {
        const scene = new Scene(AppManager.Instance.engine)
        scene.clearColor = new Color4(0.1, 0.1, 0.1, 1)
        const light = new PointLight("light", Vector3.Zero(), scene)
        light.intensity = 10
        return scene
    }

    private _createCamera(scene: Scene): ArcRotateCamera {
        const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 3, 150, Vector3.Zero(), scene)
        camera.attachControl(this._canvas)
        return camera
    }

    private _setupInputs() {
        AppManager.Instance.scene.onKeyboardObservable.add((kbInfo) => {
            let pressed = false
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    if (!pressed && kbInfo.event.key === 'l' || kbInfo.event.key === 'L') {
                        const data = loadFromStorage("lib")
                        const sun = new CelestialBody(null, data, CelestialBodyType.STAR, 0)
                        new PlanetarySystem(sun, data)
                    } else if (!pressed && kbInfo.event.key === 'd' || kbInfo.event.key === 'D') {
                        AppManager.Instance.cache.forEach(c => {
                            c.dispose()
                        })
                        AppManager.Instance.cache = []
                    }
                    pressed = true
                    break
                case KeyboardEventTypes.KEYUP:
                    pressed = false
                    break
            }
        })
    }

    private _render() {
        AppManager.Instance.engine.runRenderLoop(() => {
            AppManager.Instance.scene.render()
        })

        window.addEventListener("resize", () => {
            AppManager.Instance.engine.resize()
        })
    }
}

function loadFromStorage(name: string): ResolvedPackage {
    const lib = localStorage.getItem(name)
    if (!lib) {
        return { name: "", version: "", resolvedDependencies: {} }
    }
    return <ResolvedPackage>JSON.parse(lib)
}
