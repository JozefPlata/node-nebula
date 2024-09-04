export function addToSearchHistory(libName: string) {
    if (libName === "") {
        return
    }
    let history: string[] = JSON.parse(<string>localStorage.getItem("searchHistory")) || []
    history = history.filter((item) => item !== libName)
    history.unshift(libName)
    history.slice(0, 10)
    localStorage.setItem("searchHistory", JSON.stringify(history))
}

export function updateDatalist() {
    const history: string[] = JSON.parse(<string>localStorage.getItem("searchHistory")) || []
    const datalist = <HTMLDListElement> document.getElementById("libNameList")
    datalist.innerHTML = ""
    history.forEach((libName) => {
        const option = document.createElement("option")
        option.value = libName
        datalist.appendChild(option)
    })
}

