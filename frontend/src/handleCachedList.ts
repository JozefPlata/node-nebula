import {Db} from "./dbManager.ts"

export function handleCachedList() {
    // const listContainer = document.getElementById("cached-list-container")
    const ul = <HTMLUListElement> document.getElementById("cached-list")

    Db.Instance.getAllLibKeys().then(keys => {
        keys.forEach((lib) => {
            const data = {
                name: lib[Library.NAME],
                version: lib[Library.VERSION],
            }
            createLibraryListItem(data, ul)
            // const li = document.createElement("li")
            // const div = document.createElement("div")
            // const select = document.createElement("select")
            // const option = document.createElement("option")
            // const close = document.createElement("button")
            // close.textContent = "X"
            // div.textContent = lib[Library.NAME]
            // option.value = lib[Library.VERSION]
            // option.textContent = lib[Library.VERSION]
            // close.addEventListener("click", () => handleLibClick(lib, li))
            // li.appendChild(div)
            // select.appendChild(option)
            // li.appendChild(select)
            // li.appendChild(close)
            // ul.appendChild(li)
        })
    })
}

export function createLibraryListItem(lib: { name: string; version: string }, ul: HTMLUListElement) {
    const li = document.createElement("li")
    const div = document.createElement("div")
    const select = document.createElement("select")
    const option = document.createElement("option")
    const close = document.createElement("button")
    close.textContent = "X"
    div.textContent = lib.name
    option.value = lib.version
    option.textContent = lib.version
    close.addEventListener("click", () => handleLibClick([lib.name, lib.version], li))
    li.appendChild(div)
    select.appendChild(option)
    li.appendChild(select)
    li.appendChild(close)
    ul.appendChild(li)
}

function handleLibClick(lib: string[], li: HTMLLIElement) {
    Db.Instance.deleteLibrary(lib[Library.NAME], lib[Library.VERSION]).then(() => {
        li.remove()
    })
}

enum Library {
    NAME,
    VERSION
}
