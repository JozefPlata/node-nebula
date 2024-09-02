import {handleServerContent} from "./serverHandler.ts"
import {BabylonApp} from "./babylon/babylonApp.ts"
import {handleSessionId} from "./babylon/handleSessionId.ts"

handleSessionId()
handleServerContent()
new BabylonApp("renderCanvas")
