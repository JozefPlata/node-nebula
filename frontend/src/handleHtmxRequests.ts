import {sessionIdFromUrl} from "./handleSessionId.ts"
import {Db} from "./dbManager.ts"
import {createLibraryListItem} from "./handleCachedList.ts"
import {ResolvedPackage} from "./babylon/types.ts"
import {AppManager} from "./babylon/appManager.ts"


export function handleHtmxRequest() {
    beforeRequest()
    afterRequest()
    addSesIdParm()
}

function beforeRequest() {
    const container = <HTMLDivElement> document.getElementById("progress-container")
    const progress = <HTMLDivElement> document.getElementById("progress-bar")
    const ul = <HTMLUListElement> document.getElementById("cached-list")
    const depsList = <HTMLDivElement> document.getElementById("deps-list")

    // @ts-ignore
    document.addEventListener("htmx:beforeRequest", (evt: CustomEvent) => {
        // Disable elements
        const button = evt.detail.elt[0]
        const input = evt.detail.elt[1]
        button.disabled = true
        input.disabled = true
        input.blur()

        // Set selected
        AppManager.Instance.selected = { name: "", version: "" }
        // AppManager.Instance.depsProgress.max = 1
        // AppManager.Instance.depsProgress.value = 0

        // Abort other stuff on 404
        const status = evt.detail.xhr.status
        if (status === 404) {
            return
        }
        container.classList.remove("inactive")
        progress.classList.remove("inactive")

        // Unselect from cached list
        for (let i=0; i<ul.children.length; i++) {
            ul.children[i].classList.remove("active")
        }

        // Hide all dependencies
        for (let i=0; i<depsList.children.length; i++) {
            // @ts-ignore
            depsList.children[i].style.display = "none"
        }
    })
}

function afterRequest() {
    const form = <HTMLFormElement> document.getElementById('form')
    const container = <HTMLDivElement> document.getElementById("progress-container")
    const progress = <HTMLDivElement> document.getElementById("progress-bar")
    const ul = <HTMLUListElement> document.getElementById("cached-list")

    // @ts-ignore
    document.addEventListener("htmx:afterRequest", (evt: CustomEvent) => {
        // Enable back
        const button = evt.detail.elt[0]
        const input = evt.detail.elt[1]
        button.disabled = false
        input.disabled = false
        form.reset()

        // Reload on 404
        const status = evt.detail.xhr.status
        if (status === 404) {
            window.location.replace("/")
        }

        // Save to DB
        const data = evt.detail.xhr.response
        const lib = <ResolvedPackage> JSON.parse(data)
        Db.Instance.storeLibrary(lib)

        // Set selected
        AppManager.Instance.selected = lib

        // Create list item
        const li = createLibraryListItem(lib, ul)

        // Set active
        li.classList.add("active")
        AppManager.Instance.depsDivList.forEach(btn => {
            btn.disabled = false
        })

        // Progress
        AppManager.Instance.depsProgress.value += 1
        progress.style.width = `${Math.min(1, Math.max(0, AppManager.Instance.depsProgress.value / (AppManager.Instance.depsProgress.max - 1))) * 100}%`
        setTimeout(() => {
            container.classList.add("inactive")
            progress.classList.add("inactive")
        }, 100)
        setTimeout(() => {
            progress.style.width = "0"
            AppManager.Instance.depsProgress.max = 1
            AppManager.Instance.depsProgress.value = 0
        }, 200)
    })
}

function addSesIdParm() {
    // @ts-ignore
    htmx.defineExtension("session-id-extension", {
        onEvent: (name: string, evt: CustomEvent) => {
            if (name === "htmx:configRequest") {
                const sesId = sessionIdFromUrl()
                if (sesId) {
                    evt.detail.path = evt.detail.path.replace("{sesId}", sesId)
                }
            }
        }
    })
}