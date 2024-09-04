import {sessionIdFromUrl} from "./handleSessionId.ts"

export function handleSseUpdates() {
    const sesId = sessionIdFromUrl()
    const eventSource = new EventSource(`/progress/${sesId}`)
    const depsList = document.getElementById("deps-list")

    const items: HTMLDivElement[] = [];
    eventSource.onmessage = (event) => {
        const input = <HTMLInputElement> document.getElementById("lib-name-input")
        const name = `${input.value}-${event.data.split(" ")[1]}`
        let libName = items.find((item) => item.id === name)

        if (!libName) {
            libName = document.createElement("div")
            libName.id = name
            libName.textContent = name
            libName.classList.add("dep")
            items.push(libName)
        } else {
            libName.classList.add("dep-resolved")
        }

        items.sort((a, b) => a.id.localeCompare(b.id))
        if (depsList) {
            depsList.innerHTML = ""
            items.forEach((item) => depsList.appendChild(item))
        }
    };

    eventSource.onerror = () => {
        eventSource.close()
    }
}