import {handleHtmxRequest} from "./handleHtmxRequests.ts"
import {BabylonApp} from "./babylon/babylonApp.ts"
import {handleSseUpdates} from "./handleSseUpdates.ts"
import {Db} from "./dbManager.ts"
import {handleCachedList} from "./handleCachedList.ts";

const canvas = <HTMLCanvasElement> document.getElementById("babylon-canvas")
Db.Instance.init().then((_) => {

    // updateDatalist()

    handleCachedList()
    handleHtmxRequest()
    handleSseUpdates()
    new BabylonApp(canvas)
})


