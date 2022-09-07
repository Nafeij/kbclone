/* eslint react/prop-types: 0 */

import React from "react";
import Side from '../components/Side.js'
import Flytext from "./Flytext.js";
import {randomInRange, defLength, numMatchingDice, isFull} from '../util/utils';
import KeyManager from "../util/KeyManager.js";
import Profile from "../util/profile.js";
import {evaluate, cheatDice} from "../util/AI.js";
import Server from "../util/Server.js";
import Loading from "./Loading.js";

const scale = .95, numFaces = 6, tubLen = 3, numTubs = 3

class Game extends React.Component {
    constructor(props){
        super(props)
        this.keyManager = new KeyManager()
        this.server = new Server()
        this.state = {
            diceMatrix: Array.from({length:2}, ()=>(
                Array.from({length:numTubs},()=>(Array(tubLen).fill(null)))
                )
            ),
            tubProps: Array.from({length:2},()=>(
                Array.from({length:numTubs}, () => ({
                    tubLen: tubLen,
                    startShake: false,
                    animClass: '',
                    onScoreAnimEnd: ()=>{},
                    score: null,
                    boxRefs: Array(tubLen).fill().map(React.createRef),
                    scoreTransform: 'none',
                    cursorID: -1
                })))
            ),
            sideProps: Array.from({length:2},(_,i)=>({
                    tubsClickable: false,
                    id: i,
                    newDice: null,
                    score: 0,
                    scoreShown: false,
                    scoreShake: false,
                    pfp: 0,
                    numTubs: numTubs
                }
            )),
            flytextProps: {
                timeOut: -1,
                slideEnd: ()=>{},
                message: '',
                show: false,
                buttons: [
                    {
                      text : 'Rematch',
                      cursorID: -1,
                      onClick: () => {
                        this.restart()
                      },
                    },
                    {
                      text : 'Back',
                      cursorID: -1,
                      onClick: () => {
                        this.clearClickable()
                        this.props.return()
                      },
                    }
                ]
            },
            cursor: this.keyManager.cursor,
            turn: 0, 
            rolled: false,
            slid: false,
            dkey: 0,
            isLoading: false
        }
        this.keyManager.initCursorUpdate(()=>{
            this.setState({cursor: this.keyManager.cursor})
        })
        //this.heightOnResize.bind(this)
        //this.rollDice.bind(this)
        // this.proccessClick.bind(this)
    }

    generateDice(){
        this.setState((state)=>({dkey : state.dkey + 1}))
        return {
            key: this.state.dkey,
            height: this.boxHeight() * scale,
            transition: '.3s',
            transitionTimingFunction: 'ease-in-out',
            transform: 'none',
            shrink: false,
            num: randomInRange(numFaces) + 1,
            backgroundColor: '#f4ebce',
            borderColor: '#d7cbb3',
            zIndex: 1,
            onMovEnd: ()=>{},
            onShrinkEnd: ()=>{},
            fwdref: React.createRef()
        }
    }

    boxHeight(){
        // console.log(this.state.turn)
        return this.state.tubProps[this.state.turn][0].boxRefs[0].current.getBoundingClientRect().height
    }

    updateCurrSide(props, other={}, callback = ()=>{}){
        return this.setState(prevState => ({
            sideProps: prevState.sideProps.map(side => (
                side.id === prevState.turn ?
                    { ...side, ...props } : side)),
            ...other
        }), callback)
    }

    async hasSlid(){
        this.setState({slid : true})
        const name = Profile.names[this.state.sideProps[this.state.turn].pfp].toUpperCase()
        await this.showFlytext(name + " ROLLS FIRST", 2000, 500)
        this.rollDice()
    }

    async rollDice(){
        this.setState({rolled : true})
        let rnum
        if (this.props.isPvP){
            if (this.state.turn){
                rnum = randomInRange(6) + 1
                this.server.send(rnum)
            } else {
                this.setState({isLoading : true})
                rnum = await this.server.recv()
                this.setState({isLoading : false})
            }
        }

        let newDice = this.generateDice()
        this.updateCurrSide({newDice}, {}, ()=>{
            const interval = setInterval(()=>{
                const {sideProps, turn} = this.state
                newDice = sideProps[turn].newDice
                newDice.num = (newDice.num + 1 + randomInRange(numFaces - 1)) % (numFaces - 1) + 1
                this.setState({sideProps})
            },100);
            setTimeout(() => {
                clearInterval(interval)
                window.addEventListener("resize", ()=>{this.heightOnResize()})
                const {diceMatrix, sideProps, turn} = this.state
                const {pfp, newDice} = sideProps[turn]
                if (this.props.isPvP){
                    newDice.num = rnum
                    this.setState({sideProps})
                    if (turn){
                        this.updateCurrSide({tubsClickable : true})
                        this.setTubClickable()
                    } else {
                        this.setState({isLoading : true})
                        this.server.recv().then((mov)=>{
                            newDice.num = mov.num
                            this.setState({sideProps, isLoading : false},()=>{
                                this.proccessTurn(mov.tub)
                        })})
                    }
                    return
                }
                if (pfp && !this.props.isPvP){
                    if(pfp === 5) {
                        newDice.num = cheatDice(this.state.diceMatrix, turn)
                        this.setState({sideProps})
                    }
                    this.proccessTurn(evaluate(diceMatrix, newDice.num, Profile.skill[pfp], turn))
                } else {
                    this.updateCurrSide({tubsClickable : true})
                    this.setTubClickable()
                }
            }, 800)
        })

    }

    setTubClickable(){
        // this.clearClickable()
        this.keyManager.cursor = 0
        let tubProps = this.state.tubProps
        tubProps[this.state.turn] = tubProps[this.state.turn].map((tub, i)=>{
            // this.keyManager.options.push(i)
            this.keyManager.push(i, ()=>{this.proccessClick(i)})
            return {...tub, cursorID : i}
        })
        this.setState({tubProps, cursor: this.keyManager.cursor})
    }

    setFlytextClickable(){
        // this.clearClickable()
        let flytextProps = this.state.flytextProps
        flytextProps.buttons = flytextProps.buttons.map((btn, i)=>{
            this.keyManager.push(i, btn.onClick)
            return {...btn, cursorID : i}
        })
        this.setState({flytextProps})
    }

    clearClickable(){
        this.keyManager.clear()
        this.keyManager.cursor = 0
        let {tubProps, flytextProps} = this.state
        tubProps[this.state.turn] = tubProps[this.state.turn].map((tub)=>({...tub, cursorID : -1}))
        flytextProps.buttons = flytextProps.buttons.map((btn)=>({...btn, cursorID : -1}))
        this.setState({tubProps, flytextProps})
    }

    handleMoveAnim(tubId, destPos = null, srcPos = null, turn = this.state.turn){
        // const turn = this.state.turn
        const tubProps = this.state.tubProps[turn][tubId]
        const diceMatrix = this.state.diceMatrix
        if (destPos === null) destPos = defLength(diceMatrix[turn][tubId])
        const newDice = srcPos === null ? this.state.sideProps[turn].newDice : diceMatrix[turn][tubId][srcPos]   

        const srcRect = newDice.fwdref.current.getBoundingClientRect()
        const destRect = tubProps.boxRefs[destPos].current.getBoundingClientRect()

        const transX = destRect.x - srcRect.x + (destRect.width - srcRect.width) / 2
        const transY = destRect.y - srcRect.y + (destRect.height - srcRect.height) / 2

        newDice.transform = `translate(${Math.round(transX)}px, ${Math.round(transY)}px)`
        newDice.zIndex = 2
        return new Promise((resolve) =>{
            newDice.onMovEnd = ()=>{
                newDice.onMovEnd = ()=>{}
                newDice.transform = ''
                newDice.zIndex = 0
                newDice.height = (scale * 100) + '%'
                const num = newDice.num
                const diceMatrix = this.state.diceMatrix.slice()
                if (srcPos !== null) diceMatrix[turn][tubId][srcPos] = null
                diceMatrix[turn][tubId][destPos] = newDice
                window.removeEventListener("resize", this.heightOnResize)
                // if (srcPos) console.log(newDice)
                return this.updateCurrSide({newDice:null}, {diceMatrix}, ()=>{
                    resolve(num)
                })
            }
            if (srcPos) this.setState({diceMatrix})
        })
        
    }

    async proccessTurn(i){
        if (this.props.isPvP && this.state.turn){
            this.server.send({num : this.state.sideProps[this.state.turn].newDice.num, tub : i})
        }
        this.updateCurrSide({tubsClickable : false})
        this.clearClickable()
        const num = await this.handleMoveAnim(i)
        await this.updateScore(i);
        // this.updateCurrSide({score : total}, {turn : !prevState.turn, rolled: false}, this.rollDice)
        this.setState(prevState => ({
            sideProps: prevState.sideProps.map(side => (
                side.id === prevState.turn ?
                    { ...side, score: this.calcTotal() , scoreShown : true, scoreShake : true} : side))
        }))
        const scoreChanged = await this.checkDice(i, num);
        const oppTurn = !this.state.turn + 0
        this.setState(prevState => ({
            sideProps: prevState.sideProps.map(side => (
                side.id !== prevState.turn ?
                    { ...side, score: this.calcTotal(oppTurn) , scoreShake : scoreChanged} : side)),
            turn: oppTurn,
            // rolled: false
        }), ()=>{
            if (this.gameComplete()) this.gameEnd()
            else this.setState({rolled : false}, this.rollDice)
        })
    }

    gameEnd(){
        const [oppScore, playerScore] = this.state.sideProps.map(e=>e.score)
        //console.log(this.state.sideProps.map(e=>e.score))
        let name
        if (playerScore > oppScore){
            name = Profile.names[this.state.sideProps[1].pfp].toUpperCase()
            this.showFlytext(name + " WINS " + playerScore + " - " + oppScore)
        } else if (playerScore < oppScore){
            name = Profile.names[this.state.sideProps[0].pfp].toUpperCase()
            this.showFlytext(name + " WINS " + oppScore + " - " + playerScore)
        } else {
            this.showFlytext("TIE GAME " + playerScore + " - " + oppScore)
        }
    }

    showFlytext(text, timeOut=-1, delay=-1){
        const flytextProps = this.state.flytextProps
        flytextProps.message = text
        flytextProps.timeOut = timeOut
        // flytextProps.style = {'transform' : "translate(-25%, -50%)"}
        flytextProps.show = true
        if (timeOut <= 0) {
            this.setState({flytextProps}, this.setFlytextClickable)
        } else {
            if (delay <= 0) delay = timeOut
            this.setState({flytextProps})
            return new Promise((resolve)=>setTimeout(()=>{
                flytextProps.show = false
                flytextProps.slideEnd = () => setTimeout(resolve, delay)
                this.setState({flytextProps})
            }, timeOut))
        }
    }

    async restart(){
        let turn = randomInRange(2)
        if (this.props.isPvP){
            this.setState({isLoading : true})
            if(this.server.isHost){
                this.server.send(!turn + 0)
                const msg = await this.server.recv()
                // console.log(msg)
            } else {
                turn = await this.server.recv()
                this.server.send('restart')
            }
        }
        const flytextProps = this.state.flytextProps
        flytextProps.show = false
        const diceMatrix = Array.from({length:2}, ()=>(
            Array.from({length:numTubs},()=>(Array(tubLen).fill(null)))
            )
        )
        let {tubProps, sideProps} = this.state
        sideProps = sideProps.map((side)=>({...side, score : 0, scoreShown : false}))
        tubProps = tubProps.map((side)=>(side.map((tub)=>({...tub, score : null}))))

        flytextProps.slideEnd = ()=>{
            flytextProps.slideEnd = ()=>{}
            this.setState({diceMatrix, tubProps, sideProps, flytextProps, turn, rolled : false},()=> this.hasSlid())
        }
        this.setState({flytextProps, isLoading : false}, this.clearClickable)
    }

    gameComplete(){
        return this.state.diceMatrix[this.state.turn].flat().every(e=>e)
        // return this.state.diceMatrix[this.state.turn].flat().some(e=>e)
    }

    calcTotal(turn=this.state.turn){
        let total = 0;
        for (const tub of this.state.tubProps[turn]) {
            if (tub.score) total += tub.score
        }
        return total
    }

    async checkDice(tub, num){
        const {diceMatrix, turn} = this.state
        const oppTurn = !turn + 0
        let diceLost = false;
        const fLen = defLength(diceMatrix[oppTurn][tub])
        for (let i = 0; i < fLen; i++) {
            // const dice = diceMatrix[turn][tub][i]
            const oppDice = diceMatrix[oppTurn][tub][i]
            // console.log(`(${dice.num} : ${oppDice.num})`)
            if (num === oppDice.num){
                diceLost = true
                oppDice.shrink = true
                await new Promise((resolve)=>{
                    oppDice.onShrinkEnd = ()=>{
                        // currDice.shrink = false
                        resolve()
                        diceMatrix[oppTurn][tub][i] = null
                        this.setState({diceMatrix})
                    }
                    this.setState({diceMatrix})
                })
            }
        }
        if (!diceLost) return false;
        await this.updateScore(tub, oppTurn);
        let freePos = 0;
        for (let i = 0; i < tubLen; i++) {
            const oppDice = diceMatrix[oppTurn][tub][i]
            if (oppDice){
                if (i !== freePos) {
                    await this.handleMoveAnim(tub, freePos, i, oppTurn)
                    freePos = i
                } else {
                    freePos++
                }
            }
        }
        return true
    }

    updateScore(i, turn = this.state.turn){
        let newScore = 0;
        const diceMatrix = this.state.diceMatrix.slice()
        for (const dice of diceMatrix[turn][i]){
            if (!dice) continue
            const numMatch = numMatchingDice(diceMatrix[turn][i], dice.num);
            newScore += dice.num * numMatch;
            switch (numMatch) {
                case tubLen:
                    dice.backgroundColor = "#ecd77a"; 
                    dice.borderColor = "#cdbe61"; 
                    break;
                case tubLen - 1:
                    dice.backgroundColor = "#72adcf"; 
                    dice.borderColor = "#6297b6"; 
                    break;
                default:
                    dice.backgroundColor = "#f4ebce"; 
                    dice.borderColor = "#d7cbb3";  
                    break;
            }
        }
        this.setState({diceMatrix})
        const tubProps = this.state.tubProps
        const currTub = tubProps[turn][i]
        const isZero = newScore === 0
        if (newScore === currTub.score || (isZero && currTub.score === null)) {
            return new Promise.resolve()
        }
        if (!isZero) currTub.score = newScore
        // console.log(currTub.animClass + ' ' + newScore)
        currTub.animClass = isZero ? "shrink-out" : "shake"
        if (isZero) currTub.scoreTransform = 'scale(0)'
        return new Promise((resolve)=>{
            currTub.onScoreAnimEnd = ()=>{
                if (isZero) currTub.score = null
                currTub.animClass = ''
                currTub.onScoreAnimEnd = ()=>{}
                this.setState({tubProps}, () => {
                    if (isZero) currTub.scoreTransform = 'none'
                    this.setState({tubProps})
                    resolve()
                })
            }
            this.setState({tubProps})
        })
    }

    renderSide(side){
        return (<Side
            {...this.state.sideProps[side]}
            tubProps={this.state.tubProps[side]} 
            diceMatrix={this.state.diceMatrix[side]} 
            turn={this.state.turn}
            rollDice={() => this.rollDice()} 
            rolled={this.state.rolled}
            hasSlid={() => this.hasSlid()}
            slid={this.state.slid}
            proccessClick={i => this.proccessClick(i)} 
            onShakeAnimEnd={i => this.onShakeAnimEnd(i)} 
            onSideScoreAnimEnd={() => this.onSideScoreAnimEnd(side)}
            id={side}
            cursor={this.state.cursor}
        />)
    }

    proccessClick(i){
        if (isFull(this.state.diceMatrix[this.state.turn][i])) {
            let tubProps = this.state.tubProps.slice()
            tubProps[this.state.turn][i].startShake = true
            this.setState({tubProps})
        } else {
            // this.setState({tubsClickable : false})
            this.proccessTurn(i)
        }
    }

    
    onShakeAnimEnd(i){
        const tubProps = this.state.tubProps.slice()
        tubProps[this.state.turn][i].startShake = false
        this.setState({tubProps})
    }

    onSideScoreAnimEnd(side){
        const sideProps = this.state.sideProps.slice()
        sideProps[side].scoreShake = false
        this.setState({sideProps})
    }

    heightOnResize(){
        try{
            const newDice = this.state.sideProps[this.state.turn]
            newDice.height = this.boxHeight() * scale
            updateCurrSide({newDice : newDice})
        } catch (e) {}
/*         if (this.state && this.state.sideProps && sideProps && this.state.tubProps[0].boxRefs[0].current) {
            const newDice = this.state.newDice
            newDice.height = this.boxHeight() * scale
            this.setState({newDice : newDice}) 
        } */
    }


    componentDidMount(){
        const sideProps = this.state.sideProps
        if (this.props.isPvP){
            const flytextProps = this.state.flytextProps
            flytextProps.buttons[1].text = "Disconnect"
            const {name, oppName, turn, hostPfp, guestPfp} = this.props
            sideProps[1].pfp = hostPfp ; sideProps[0].pfp = guestPfp
            sideProps[1].name = name ; sideProps[0].name = oppName
            this.setState({turn, sideProps, flytextProps})
            return
        }
        sideProps[0].pfp = this.props.ai
        this.setState({turn : randomInRange(2), sideProps})
    }

    render(){
        return (
            <div className="game">
                {this.renderSide(0)}
                {this.renderSide(1)}
                <Flytext {...this.state.flytextProps} cursor={this.state.cursor}/>
                <Loading show={this.state.isLoading}/>
            </div>
        )
    }
}

export default Game