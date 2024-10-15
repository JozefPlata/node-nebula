import {sessionIdFromUrl} from "./handleSessionId.ts"
import {idFromLibNameForDep} from "./naming.ts"
import {AppManager} from "./babylon/appManager.ts"


export function handleSseUpdates() {
    const sesId = sessionIdFromUrl()
    const eventSource = new EventSource(`/progress/${sesId}`)
    const depsList = <HTMLDivElement> document.getElementById("deps-list")

    // const items: HTMLDivElement[] = [];
    eventSource.onmessage = (event) => {
        const input = <HTMLInputElement> document.getElementById("lib-name-input")
        const progress = <HTMLDivElement> document.getElementById("progress-bar")
        const respName = event.data.split(" ")[1]
        const id = idFromLibNameForDep(input.value, respName)
        let dep = <HTMLButtonElement> AppManager.Instance.depsDivList.find((item) => item.id === id)

        if (!dep) {
            // Create new
            AppManager.Instance.depsProgress.max += 1
            dep = document.createElement("button")
            dep.id = id
            dep.textContent = "□ " + respName
            dep.addEventListener("click", () => handleActiveDependency(dep, depsList))
            dep.classList.add("dep")
            dep.disabled = true
            AppManager.Instance.depsDivList.push(dep)
        } else {
            // Resolve
            dep.textContent = "■ " + respName
            AppManager.Instance.depsProgress.value += 1
            progress.style.width = `${Math.min(1, Math.max(0, AppManager.Instance.depsProgress.value / (AppManager.Instance.depsProgress.max - 1))) * 100}%`
            dep.classList.add("dep-resolved")
        }

        AppManager.Instance.depsDivList.sort((a, b) => a.id.localeCompare(b.id))
        if (depsList) {
            AppManager.Instance.depsDivList.forEach((item) => depsList.appendChild(item))
        }
    }

    eventSource.onerror = () => {
        eventSource.close()
    }
}

export function handleActiveDependency(clicked: HTMLButtonElement, depsList: HTMLDivElement) {
    const children = Array.from(depsList.children)
    for (let i=0; i<children.length; i++) {
        children[i].classList.remove("active")
    }
    clicked.classList.add("active")
    const mesh = AppManager.Instance.scene.getMeshById(clicked.id)
    // @ts-ignore
    AppManager.Instance.camera.setTarget(mesh)
    // @ts-ignore
    AppManager.Instance.camera.behaviors[0].zoomOnMesh(mesh)
    // AppManager.Instance.camera.behaviors[0].radiusScale = 5

    console.log("FOUND:", mesh)
}