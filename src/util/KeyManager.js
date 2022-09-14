class KeyManager{
    constructor() {
        if (KeyManager._instance) {
          return KeyManager._instance
        }
        KeyManager._instance = this;
    
        this.cursor = 0
        this.options = []
        this.clickActions = []
        this.returnAction = ()=>{}
        this.enabled = true
        window.addEventListener('keyup', (event)=>{this.handleKeypress(event)})
        window.addEventListener('mousemove',()=>{
            if (this.cursor !== null){
                this.cursor = null
                this.cursorUpdate()
                // console.log('moved ' + this.cursor)
            }
        })
    }

/*     initCallback(refreshState){
        this.refreshState = refreshState
    } */

    initCursorUpdate(cursorUpdate){
        this.cursorUpdate = cursorUpdate
    }

    push(i, action){
        this.options.push(i)
        this.clickActions.push(action)
    }

    clear(){
        this.options = []
        this.clickActions = []
        this.cursor = null
        this.cursorUpdate()
    }

    handleKeypress(keyEvent){
        if (keyEvent.key === "f"){
            this.returnAction()
            this.returnAction = ()=>{}
            return
        }
        if (!this.enabled) return
        if (this.cursor === null) {
            this.cursor = 0
            this.cursorUpdate()
        }
        const onList = typeof this.options[this.cursor] === 'object'
        const len = this.options.length
        if (len > 0){
            // console.log(this.options + ' ' + this.cursor)
            if (keyEvent.key === "Enter" || keyEvent.key === "e" || keyEvent.key === " "){
                if (onList) this.clickActions[this.cursor][0]()
                else this.clickActions[this.cursor]()
            } else {
                let offset;
                switch (keyEvent.key) {
                    case "ArrowLeft":
                    case "a":
                        if (onList) {
                            this.clickActions[this.cursor][1]()
                            return
                        }
                    case "ArrowUp":
                    case "w":
                        offset = -1;break;
                    case "d":
                    case "ArrowRight":
                        if (onList) {
                            this.clickActions[this.cursor][2]()
                            return
                        }
                    case "ArrowDown":
                    case "s":
                        offset = 1;break;
                    default: return;
                }
                // this.cursor = this.options[(offset+this.cursor+len)%len]
                this.cursor = (offset+this.cursor+len)%len
                // console.log(this.cursor)
            }
            this.cursorUpdate()
            // this.refreshState()
        }
    }
}

export default KeyManager