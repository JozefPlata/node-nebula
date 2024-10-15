import {
    ArcRotateCamera,
    Color4,
    Engine, FramingBehavior,
    PointLight,
    Scene,
    Vector3,
} from "@babylonjs/core"
import {AppManager} from "./appManager.ts"
import {AdvancedDynamicTexture} from "@babylonjs/gui"


export class BabylonApp {
    private readonly _canvas: HTMLCanvasElement

    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas
        AppManager.Instance.engine = new Engine(this._canvas, true)
        AppManager.Instance.scene = this._createScene()
        AppManager.Instance.camera = this._createCamera(AppManager.Instance.scene)
        AppManager.Instance.uiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI")
        this._render()
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
        const behavior = new FramingBehavior()
        behavior.mode = FramingBehavior.FitFrustumSidesMode
        behavior.radiusScale = 3.5
        camera.addBehavior(behavior)
        camera.attachControl(this._canvas)
        return camera
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
