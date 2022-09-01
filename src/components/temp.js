generateDice(height = '100px', transform = 'none', transition = 'none'){
    let defaultProps = {
        key: this.state.dkey,
        height: height,
        transition: transition,
        transform: transform,
        roll: true,
        shrink: false,
        num: randomInRange(6) + 1,
        onRollEnd: ()=>{},
        onMovEnd: ()=>{},
        onShrinkEnd: ()=>{},
        roll: this.state.canRoll,
        ref: this.newDiceRef
    }
    this.setState((state)=>({dkey : state.dkey + 1}))
    return defaultProps
}

handleSelection(box, tubIndex, pos){
    const diceMatrix = this.state.diceMatrix
    const newDice = this.state.newDice

    const destRect = box.getBoundingClientRect()
    const srcRect = this.newDiceRef.getBoundingClientRect()

    const transX = destRect.x - srcRect.x + (destRect.width - srcRect.width) / 2
    const transY = destRect.y - srcRect.y + (destRect.height - srcRect.height) / 2
    const newheight = destRect.height * scale

    let me = this
    newDice.transition = '.3s'
    setTimeout(()=>{
        newDice.transform = `translate(${transX}px ${transY}px)`
        newDice.onTransitionEnd = ()=>{
            me.setState((state)=>({newDice : null, diceMatrix : state.diceMatrix.map((tub, i)=>{tub.map((box, j) => {
                if (i === tubIndex && j === pos){
                    return newDice
                }
                return box
            })})}))
        }
    },10)

/*         const newDice = this.generateDice({height: newheight, transform : `translate(${transX}px ${transY}px`})
    tubList[pos] = newDice */

    this.setState({newDice: null, diceMatrix:diceMatrix})
}

proccessClick(key){
    return (isFull, boxList, length)=>{
        const {tubShaking} = this.state
        if (isFull) {
            this.setState({tubShaking : shallowUpdate(tubShaking, key, true)})
        } else {
            this.setState({tubClickable : false})
            handleSelection(boxList[length], key, length)
        }
    }
}

onScoreShakeAnimEnd(key){
    return () => {
        this.setState({tubScoreUpdated : shallowUpdate(tubScoreUpdated, key, false)})
    }
}

onShakeAnimEnd(key){
    return () => {
        this.setState({tubShaking : shallowUpdate(tubShaking, key, false)})
    }
}

componentDidMount(){
    console.log('sidemounted')
}