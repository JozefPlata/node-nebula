
export function idFromLibNameForDep(name: string, depName: string): string {
    return `${name}__${depName}`
}

export function libNameFromDepId(id: string): string {
    return id.split('__')[0]
}

export function matchDepId(name: string, id: string): boolean {
    return id.startsWith(`${name}__`)
}


