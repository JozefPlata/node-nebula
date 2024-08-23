import {ResolvedPackage} from "./types.ts";

export class ResolvedPackageData {
    private _data: ResolvedPackage

    constructor(data: ResolvedPackage) {
        this._data = data
    }

    dependenciesCount(): number {
        return Object.keys(this._data.resolvedDependencies).length
    }
}