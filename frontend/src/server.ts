export function handleServerContent() {
    document.addEventListener("htmx:afterRequest", (evt) => {
        // @ts-ignore
        const data = evt.detail.xhr.response
        localStorage.setItem("lib", data)
    })
}