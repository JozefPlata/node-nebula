
export function sessionIdFromUrl(): string | null {
    const path = window.location.pathname
    const sesId = path.substring(path.lastIndexOf("/") + 1)
    return sesId !== "" ? sesId : null
}