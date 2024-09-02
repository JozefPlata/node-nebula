import {getSessionIdFromUrl} from "./babylon/handleSessionId.ts"

export function handleServerContent() {
    document.addEventListener("htmx:afterRequest", (evt) => {
        // @ts-ignore
        const data = evt.detail.xhr.response
        localStorage.setItem("lib", data)
    })

    const eventSource = new EventSource(`/progress/${getSessionIdFromUrl()}`)
    const progressList = document.getElementById("progressList")

    eventSource.onmessage = (event) => {
        const newItem = document.createElement("li")
        newItem.textContent = event.data
        progressList?.appendChild(newItem)
    }

    eventSource.onerror = () => {
        eventSource.close()
    }
}