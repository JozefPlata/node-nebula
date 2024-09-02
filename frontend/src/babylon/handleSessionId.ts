export function handleSessionId() {
    document.addEventListener("DOMContentLoaded", () => {
        let sesId = localStorage.getItem("sesId")

        if (!!sesId) {
            return
        }

        sesId = getSessionIdFromUrl()
        localStorage.setItem("sesId", sesId)
    })

    // @ts-ignore
    htmx.defineExtension("session-id", {
        onEvent: (name: any, evt: any) => {
            if (name === "htmx:configRequest") {
                const sesId = localStorage.getItem("sesId")
                if (sesId) {
                    evt.detail.path = evt.detail.path.replace("{sesId}", sesId);
                }
            }
        }
    })
}

export function getSessionIdFromUrl() {
    const path = window.location.pathname
    return path.substring(path.lastIndexOf("/") + 1)
}