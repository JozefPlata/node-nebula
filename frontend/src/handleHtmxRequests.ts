import {sessionIdFromUrl} from "./handleSessionId.ts"
import {Db} from "./dbManager.ts"
import {createLibraryListItem} from "./handleCachedList.ts"
import {ResolvedPackage} from "./babylon/types.ts"


export function handleHtmxRequest() {
    beforeRequest()
    afterRequest()
    addSesIdParm()
}

function beforeRequest() {
    // @ts-ignore
    document.addEventListener("htmx:beforeRequest", (evt: CustomEvent) => {
        const button = evt.detail.elt[0]
        const input = evt.detail.elt[1]
        button.disabled = true
        input.disabled = true
        input.blur()
    })
}

function afterRequest() {
    // @ts-ignore
    document.addEventListener("htmx:afterRequest", (evt: CustomEvent) => {
        const button = evt.detail.elt[0]
        const input = evt.detail.elt[1]

        // @ts-ignore
        const data = evt.detail.xhr.response
        const lib = <ResolvedPackage> JSON.parse(data)
        Db.Instance.storeLibrary(lib)
        const ul = <HTMLUListElement> document.getElementById("cached-list")
        createLibraryListItem(lib, ul)

        button.disabled = false
        input.disabled = false
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