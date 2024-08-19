import {Ellipse, Rectangle, TextBlock} from "@babylonjs/gui";
import {
    Color3,
    Color4,
    ColorGradient,
    CreateGreasedLine,
    GradientHelper,
    GreasedLineBaseMesh,
    GreasedLineMesh,
    GreasedLineMeshColorMode,
    GreasedLineRibbonMesh,
    GreasedLineTools,
    HighlightLayer,
    Mesh,
    MeshBuilder,
    Observer,
    Scene,
    StandardMaterial,
    TmpColors,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {AppManager} from "./appManager.ts";
import {fitRange} from "./helpers.ts";
import {CelestialBodyType, ResolvedPackage} from "./types.ts";

class CelestialBodyDescription {
    private readonly _rect: Rectangle
    private readonly _label: TextBlock
    private readonly _outline: Ellipse

    constructor(body: CelestialBody) {
        this._rect = new Rectangle()
        this._label = new TextBlock()
        this._outline = new Ellipse()
        body.observer = this._createFor(body)
    }

    private _createFor(body: CelestialBody): Observer<Scene> {
        this._rect.cornerRadius = 24
        this._rect.name = `${body.name}_rect`
        this._rect.color = "gray"
        this._rect.thickness = 1
        this._rect.alpha = 0.6
        this._rect.background = "black"
        AppManager.Instance.uiTexture.addControl(this._rect)
        this._rect.linkWithMesh(body.mesh)

        this._label.name = `${body.name}_label`
        this._label.color = "white"
        this._label.text = body.name
        this._label.fontFamily = "Ubuntu"
        this._label.fontWeight = "bold"
        this._rect.addControl(this._label)

        this._outline.name = `${body.name}_outline`
        this._outline.color = "gray"
        this._outline.thickness = 1
        AppManager.Instance.uiTexture.addControl(this._outline)
        this._outline.linkWithMesh(body.mesh)

        return AppManager.Instance.scene.onBeforeRenderObservable.add(() => {
            const dist = Vector3.Distance(AppManager.Instance.camera.position, body.mesh.absolutePosition)
            this._rect.zIndex = -dist
            const value = fitRange(dist, 0, 1300, 1.5, 0.2)
            this._rect.width = body.type === 0 ? `${body.name.length * 12 * value}px` : `${body.name.length * 6 * value}px`
            this._rect.height = body.type === 0 ? `${40 * value}px` : `${20 * value}px`
            this._label.fontSize = body.type === 0 ? `${15 * value}px` : `${7.5 * value}px`
            this._outline.width = `${1.5 * (1 / dist) * body.diameter * AppManager.Instance.engine.getRenderHeight()}px`
            this._outline.height = this._outline.width
        })
    }

    dispose() {
        this._rect.dispose()
        this._label.dispose()
        this._outline.dispose()
    }
}

class ResolvedPackageData {
    private _data: ResolvedPackage

    constructor(data: ResolvedPackage) {
        this._data = data
    }

    dependenciesCount(): number {
        return Object.keys(this._data.resolvedDependencies).length
    }
}


export class CelestialBody extends ResolvedPackageData {
    private readonly _type: CelestialBodyType
    private readonly _initEllipseRadius: number
    private readonly _name: string
    private readonly _mesh: Mesh
    private readonly _diameter: number
    private readonly _speed: number
    private _description!: CelestialBodyDescription
    private _trajectory!: GreasedLineMesh | GreasedLineBaseMesh | GreasedLineRibbonMesh
    // @ts-ignore
    private _material: StandardMaterial
    // @ts-ignore
    private _highlightLayer: HighlightLayer
    // @ts-ignore
    private _masterNode: TransformNode
    // @ts-ignore
    private _observer: Observer<Scene>[] = []

    // @ts-ignore
    constructor(centralBody: CelestialBody | null, pkg: ResolvedPackage, type: CelestialBodyType, ellipseRadius: number) {
        super(pkg)
        this._type = type
        this._initEllipseRadius = centralBody !== null ? ellipseRadius : 0
        this._speed = centralBody !== null ? fitRange(Math.random(), 0, 1, 0.01, 0.1) / ellipseRadius : 0

        const initDiameter = this.dependenciesCount()
        this._diameter = initDiameter + fitRange(Math.random(), 0, 1, 0.1, 0.9)
        this._name = `${pkg.name}, ${pkg.version}`
        this._mesh = MeshBuilder.CreateSphere(this._name, {
            diameter: this._diameter,
            segments: 32
        }, AppManager.Instance.scene)
        
        // Material
        this._material = new StandardMaterial(this._name, AppManager.Instance.scene)
        this._material.specularColor = Color3.Black()
        this._material.specularPower = 0
        if (this._type > 0) {
            this._material.diffuseColor = new Color3(Math.random() * 0.25, Math.random() * 0.25, Math.random() * 0.25)
        } else {
            this._material.diffuseColor = new Color3(1, 0.95, 0)
            this._material.emissiveColor = new Color3(0.98, 0.97, 0.91)
        }
        this._mesh.material = this._material
        
        // Highlight Layer
        this._highlightLayer = new HighlightLayer(`${pkg.name}_${pkg.version}`, AppManager.Instance.scene, {camera: AppManager.Instance.camera})
        this._highlightLayer.addMesh(this._mesh, this._material.diffuseColor)

        // UI - description
        this._description = new CelestialBodyDescription(this)

        if (centralBody !== null) {
            // Parent Node
            this._masterNode = new TransformNode(`${this.name}_p`, AppManager.Instance.scene)
            this._mesh.position.x = this.ellipseRadius

            // Trajectory
            const trajectory = this._createTrajectory()
            trajectory.parent = this._masterNode

            // Parent and rotate
            this._mesh.parent = this._masterNode
            this._masterNode.rotation.y = Math.random() * this._initEllipseRadius
        }


        AppManager.Instance.cache.push(this)
    }

    private _createTrajectory() {
        const points = GreasedLineTools.GetCircleLinePoints(this.ellipseRadius, 100)

        // Create gradient colors
        const bc = this._material.diffuseColor
        const colors: Color3[] = []
        const tempColors = TmpColors.Color4[0]
        for (let ratio = 0; ratio <= 1; ratio += 0.01) {
            GradientHelper.GetCurrentGradient(
                ratio,
                [new ColorGradient(0, new Color4(bc.r, bc.g, bc.b, 0.5)), new ColorGradient(0.85, new Color4(0, 0, 0, 0)), new ColorGradient(1, new Color4(0, 0, 0, 0))],
                (current, next, scale) => {
                    // @ts-ignore
                    Color4.LerpToRef(current.color1, next.color1, scale, tempColors)
                    const cd = tempColors.clone()
                    colors.push(new Color3(cd.r, cd.g, cd.b))
                }
            )
        }

        // Draw the line
        const line = CreateGreasedLine(
            `${this._name}_line`,
            {points: points},
            {
                useColors: true,
                colors: colors,
                width: 0.1,
                colorMode: GreasedLineMeshColorMode.COLOR_MODE_SET
            },
            AppManager.Instance.scene
        )
        // @ts-ignore
        line.material.alpha = 0.99
        // @ts-ignore
        line.material.alphaMode = 6
        line.rotation.x = Math.PI / 2
        this._trajectory = line
        return this._trajectory
    }

    get type(): CelestialBodyType {
        return this._type
    }

    get position(): Vector3 {
        return this._mesh.absolutePosition
    }

    get name(): string {
        return this._name
    }

    get mesh(): Mesh {
        return this._mesh
    }

    get diameter(): number {
        return this._diameter
    }

    get ellipseRadius(): number {
        return this._initEllipseRadius + this._diameter
    }

    get speed(): number {
        return this._speed
    }

    set masterNode(node: TransformNode) {
        this._masterNode = node
    }

    get masterNode() {
        return this._masterNode
    }

    set observer(obs: Observer<Scene>) {
        this._observer.push(obs)
    }

    dispose() {
        this._observer.forEach(o => {
            o.remove()
        })
        this._description.dispose()
        this._highlightLayer.dispose()
        this._material.dispose()
        this._mesh.dispose()
        if (this._trajectory) {
            this._trajectory.dispose()
        }
        if (this._masterNode) {
            this._masterNode.dispose()
        }
    }
}