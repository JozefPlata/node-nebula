import {ResolvedPackage} from "./babylon/types.ts"


export class Db {
    private static _instance: Db;
    private readonly _name = "PackageManagerDb"
    private readonly _version = 1
    private _request: IDBOpenDBRequest
    private _db: any

    private constructor() {
        this._request = indexedDB.open(this._name, this._version)
    }

    static get Instance() {
        return this._instance || (this._instance = new Db())
    }

    async init() {
        return new Promise<Db>((resolve, reject) => {

            this._request.onupgradeneeded = (event) => {
                // @ts-ignore
                const db = event.target?.result

                // Libraries store
                if (!db.objectStoreNames.contains("libraries")) {
                    const store = db.createObjectStore("libraries", { keyPath: ["name", "version"] })
                    store.createIndex("by_name", "name")
                    store.createIndex("by_version", "version")
                }
            };

            this._request.onsuccess = (event) => {
                // @ts-ignore
                this._db = event.target?.result
                resolve(this)
            };

            this._request.onerror = (event) => {
                // @ts-ignore
                reject("Error opening database: " + event.target?.error)
            };
        })
    }

    storeLibrary(libraryInfo: ResolvedPackage) {
        if (!libraryInfo.name) {
            console.error("Invalid library data: missing name", libraryInfo)
            return
        }
        const transaction = this._db.transaction(["libraries"], "readwrite")
        const store = transaction.objectStore("libraries")
        store.put(libraryInfo)
    }

    async getAllLibKeys() {
        return new Promise<string[][]>((resolve, reject) => {
            if (!this._db) {
                reject(new Error("Database not initialized"))
                return
            }

            const transactions = this._db.transaction(["libraries"], "readonly")
            const store = transactions.objectStore("libraries")
            const request = store.getAllKeys()

            request.onerror = (event: any) => {
                reject("Error reading database: " + event.target?.error)
            }

            request.onsuccess = (event: any) => {
                resolve(event.target?.result)
            }
        })
    }

    async getLibrary(name: string, version: string) {
        return new Promise<ResolvedPackage | undefined>((resolve, reject) => {
            if (!this._db) {
                reject(new Error("Database not initialized"))
                return
            }

            const transaction = this._db.transaction(["libraries"], "readonly")
            const store = transaction.objectStore("libraries")
            const request = store.get([name, version])

            request.onerror = (event: any) => {
                reject("Error reading database: " + event.target?.error)
            }

            request.onsuccess = (event: any) => {
                resolve(event.target?.result)
            }
        })
    }

    async deleteLibrary(name: string, version: string) {
        return new Promise<void>((resolve, reject) => {
            if (!this._db) {
                reject(new Error("Database not initialized"))
                return
            }

            const transaction = this._db.transaction(["libraries"], "readwrite")
            const store = transaction.objectStore("libraries")
            const request = store.delete([name, version])

            request.onerror = (event: any) => {
                reject("Error reading database: " + event.target?.error)
            }

            request.onsuccess = () => {
                resolve()
            }
        })
    }
}