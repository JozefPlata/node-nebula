import {Db} from "./dbManager.ts"
import {AppManager} from "./babylon/appManager.ts"
import {handleActiveDependency} from "./handleSseUpdates.ts"
import {idFromLibNameForDep, matchDepId} from "./naming.ts"


export function handleCachedList() {
    const ul = <HTMLUListElement> document.getElementById("cached-list")

    Db.Instance.getAllLibKeys().then(keys => {
        keys.forEach((lib) => {
            const data = {
                name: lib[Library.NAME],
                version: lib[Library.VERSION],
            }
            createLibraryListItem(data, ul)
        })
    })
}

export function createLibraryListItem(lib: { name: string; version: string }, ul: HTMLUListElement) {
    // Whole item
    const li = document.createElement("li")
    li.addEventListener("click", () => {
        AppManager.Instance.selected = lib
        handleActiveLibrary(li, ul)
    })

    // Library name
    const div = document.createElement("div")
    div.textContent = lib.name

    // Library versions list
    const select = document.createElement("select")
    const option = document.createElement("option")
    option.value = lib.version
    option.textContent = lib.version

    // Remove library button
    const close = document.createElement("button")
    close.textContent = "X"
    close.addEventListener("click", () => deleteLibrary([lib.name, lib.version], li))

    // Append all
    li.appendChild(div)
    select.appendChild(option)
    li.appendChild(select)
    li.appendChild(close)
    ul.appendChild(li)

    return li
}

function deleteLibrary(lib: string[], li: HTMLLIElement) {
    Db.Instance.deleteLibrary(lib[Library.NAME], lib[Library.VERSION]).then(() => {
        // Delete item
        li.remove()

        // Delete dependencies
        const depsList = <HTMLDivElement> document.getElementById("deps-list")
        const children = Array.from(depsList.children)
        for (let i=0; i<children.length; i++) {
            if (matchDepId(lib[Library.NAME], children[i].id)) {
                children[i].remove()
            }
        }
        AppManager.Instance.depsDivList = <HTMLButtonElement[]> Array.from(depsList.children)
    })
}

function handleActiveLibrary(clicked: HTMLLIElement, ul: HTMLUListElement) {
    // Switch dependencies
    const depsList = <HTMLDivElement> document.getElementById("deps-list")
    let found = false
    let selected = AppManager.Instance.selected
    const children = Array.from(depsList.children)
    for (let i=0; i<children.length; i++) {
        if (matchDepId(selected.name, children[i].id)) {
            // @ts-ignore
            children[i].style.display = ""
            found = true
        } else {
            // @ts-ignore
            children[i].style.display = "none"
        }
    }

    if (!found) {
        // Create dependencies
        Db.Instance.getLibrary(selected.name, selected.version).then(pkg => {
            if (pkg) {
                for (const [key, _] of Object.entries(pkg.resolvedDependencies)) {
                    const dep = document.createElement("button")
                    dep.id = idFromLibNameForDep(selected.name, key)
                    dep.textContent = key
                    dep.addEventListener("click", () => {
                        handleActiveDependency(dep, depsList)
                    })
                    dep.classList.add("dep")
                    dep.classList.add("dep-resolved")
                    depsList.appendChild(dep)
                }
            }
        })
    }

    setActiveClass(clicked, ul)
}

function setActiveClass(clicked: HTMLElement, parent: HTMLElement) {
    const children = Array.from(parent.children)
    for (let i=0; i<children.length; i++) {
        if (children[i] !== clicked) {
            children[i].classList.remove("active")
        }
    }
    clicked.classList.add("active")
}

enum Library {
    NAME,
    VERSION
}
