/* eslint react/prop-types: 0 */

import React from "react";
import Side from '../components/Side.js'
import Flytext from "./Flytext.js";
import {randomInRange, defLength, numMatchingDice, isFull} from '../util/utils';
import KeyManager from "../util/KeyManager.js";
import Profile from "../util/Profile.js";
import {evaluate, cheatDice} from "../util/AI.js";
import Server from "../util/Server.js";
import Loading from "./Loading.js";


const scale = .95, numFaces = 6
/* const this.props.tubLen = 3, this.props.numTubs = 3, this.props.diceColor = ['#f4ebce','#f4ebce'],
this.props.diceBorder = ['#d7cbb3', '#d7cbb3'], this.props.pipColor = ['#382020','#382020'], time = null, pickable = false, caravan = [10,18] */

class Game extends React.Component {
    constructor(props){
        super(props)
        this.keyManager = new KeyManager()
        this.server = new Server()
        this.state = {
            diceMatrix: Array.from({length:2}, ()=>(
                Array.from({length: props.numTubs},()=>(Array(props.tubLen).fill(null)))
                )
            ),
            tubProps: Array.from({length:2},()=>(
                Array.from({length: props.numTubs}, () => ({
                    tubLen: props.tubLen,
                    startShake: false,
                    animClass: '',
                    onScoreAnimEnd: ()=>{},
                    score: null,
                    boxRefs: Array(props.tubLen).fill().map(React.createRef),
                    scoreTransform: 'none',
                    cursorID: -1,
                    caravan : props.caravan
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
                    rollRef : React.createRef(),
                    numTubs: props.numTubs,
                    time : props.time === null ? props.time : -1
                }
            )),
            flytextProps: {
                timeOut: -1,
                slideEnd: ()=>{},
                message: '',
                show: false,
                hover : false,
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
                        const flytextProps = this.state.flytextProps
                        flytextProps.show = false
                        this.setState(flytextProps)
                        if (props.time) clearInterval(this.timeInterval)
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
            isLoading: false,
            turnCount: props.turnLimit
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
        const turn = this.state.turn
        return {
            key: this.state.dkey,
            height: this.boxMin() * scale,
            transition: '.3s',
            transitionTimingFunction: 'ease-in',
            transform: 'none',
            shrink: false,
            num: randomInRange(numFaces) + 1,
            diceColor : this.props.diceColor[turn], 
            diceBorder : this.props.diceBorder[turn], 
            pipColor : this.props.pipColor[turn],
            zIndex: 1,
            onMovEnd: ()=>{},
            onShrinkEnd: ()=>{},
            fwdref: React.createRef(),
            isCaravan : !!this.props.caravan
        }
    }

    boxMin(){
        // console.log(this.state.turn)
        const rect = this.state.tubProps[this.state.turn][0].boxRefs[0].current.getBoundingClientRect()
        return rect.height < rect.width ? rect.height : rect.width
    }
    
    rollHeight(){
        return this.state.sideProps[this.state.turn].rollRef.current.clientHeight
    }

    rollWidth(){
        return this.state.sideProps[this.state.turn].rollRef.current.clientWidth
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
        if (this.props.turnLimit) {
            this.setState({slid : true, turnCount : this.props.turnLimit})
        } else {
            this.setState({slid : true})
        }
        const name = Profile.names[this.state.sideProps[this.state.turn].pfp].toUpperCase()
        await this.showFlytext(name + " ROLLS FIRST", 2000, 500)
        this.rollDice()
    }

    async rollDice(){
        this.setState({rolled : true})
        // console.log(this.state.sideProps[0].tubsClickable + " " + this.state.sideProps[1].tubsClickable)
        let rnum
        if (this.props.gameType === 'PVP'){
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
            const {sideProps, turn} = this.state
            newDice = sideProps[turn].newDice
            const diceHeight = newDice.height
            const rollH = this.rollHeight()
            const rollW = this.rollWidth()
            if (diceHeight < rollH){
                /* console.log(rollH - diceHeight) */
                newDice.transform = `translate(${Math.round(((rollW - diceHeight) / 2) * (Math.random()*2-1))}px,${Math.round(((rollH - diceHeight) / 2) * (Math.random()*2-1))}px)`
            }
            const interval = setInterval(()=>{
                const {sideProps, turn} = this.state
                newDice = sideProps[turn].newDice
                newDice.num = (newDice.num + randomInRange(numFaces-1) + 1) % numFaces + 1
                this.setState({sideProps})
            },100);
            setTimeout(() => {
                clearInterval(interval)
                window.addEventListener("resize", ()=>{this.heightOnResize()})
                const {diceMatrix, sideProps, turn} = this.state
                const {pfp, newDice} = sideProps[turn]
                if (this.props.gameType === 'PVP'){
                    newDice.num = rnum
                    this.setState({sideProps})
                    if (!turn) {
                        this.setState({isLoading : true})
                        if (this.props.time) {
                            let thisTime = this.props.time
                            sideProps[turn].time = thisTime
                            this.setState(sideProps)
                            this.timeInterval = setInterval(() => {
                                thisTime--
                                sideProps[turn].time = thisTime
                                this.setState(sideProps)
                                if (thisTime < 0){
                                    clearInterval(this.timeInterval)
                                }
                            }, 1000);
                        }
                        this.server.recv().then((mov)=>{
                            if (mov === 'timeout') {
                                // console.log('recv timeout')
                                this.timeoutDestroy()
                                return
                            }
                            newDice.num = mov.num
                            if (this.props.time) {
                                sideProps[turn].time = -1
                                clearInterval(this.timeInterval)
                            }
                            this.setState({sideProps, isLoading : false},()=>{
                                this.proccessTurn(mov.tub,!mov.side + 0)
                        })})
                    } else {
                        this.setTubClickable()
                        this.updateCurrSide({tubsClickable : true},{},()=>{
                            const {sideProps, turn} = this.state
                            if (this.props.pickable) sideProps[0].tubsClickable = true
                            if (this.props.time) {
                                let thisTime = this.props.time
                                sideProps[turn].time = thisTime
                                this.timeInterval = setInterval(() => {
                                    if (thisTime <= 0){
                                        clearInterval(this.timeInterval)
                                        this.server.send('timeout')
                                        this.timeoutDestroy()
                                        // this.proccessTurn(evaluate(diceMatrix, newDice.num, 0, turn))
                                    } else {
                                        thisTime--
                                        sideProps[turn].time = thisTime
                                        this.setState(sideProps)
                                    }
                                }, 1000);
                            }
                            this.setState(sideProps)
                        })
                    }
                } else if (this.props.gameType === 'AI' && !turn){
                    if(pfp === 5) {
                        newDice.num = cheatDice(this.state.diceMatrix, turn)
                        this.setState({sideProps})
                    }
                    this.proccessTurn(evaluate(diceMatrix, newDice.num, Profile.skill[pfp], turn))
                } else {
                    this.setTubClickable()
                    this.updateCurrSide({tubsClickable : true},{},()=>{
                        const {sideProps, turn} = this.state
                        if (this.props.pickable) sideProps[!turn + 0].tubsClickable = true
                        if (this.props.time) {
                            let thisTime = this.props.time
                            sideProps[turn].time = thisTime
                            this.timeInterval = setInterval(() => {
                                if (thisTime <= 0){
                                    clearInterval(this.timeInterval)
                                    this.timeoutDestroy()
                                    // this.proccessTurn(evaluate(diceMatrix, newDice.num, 0, turn))
                                } else {
                                    thisTime--
                                    sideProps[turn].time = thisTime
                                    this.setState(sideProps)
                                }
                            }, 1000);
                        }
                        this.setState(sideProps)
                    })
                }
            }, 800)
        })
    }

    timeoutDestroy(){
        const {sideProps, turn} = this.state
        sideProps[0].tubsClickable = false
        sideProps[1].tubsClickable = false
        this.clearClickable()

        const newDice = sideProps[turn].newDice
        if (newDice.fwdref.current) {
            // this.proccessTurn(evaluate(diceMatrix, newDice.num, 0, turn))
            if (newDice.transform !== 'none') newDice.transform = newDice.transform + ' scale(0)'
            else newDice.transform = 'scale(0)'
            newDice.onMovEnd = ()=>{
                sideProps[turn].newDice = null
                this.setState({sideProps, turn: !turn + 0}, this.checkEnd)
            }
        }
        this.setState({sideProps})
    }

    setTubClickable(){
        // this.clearClickable()
        this.keyManager.cursor = 0
        let tubProps = this.state.tubProps
        tubProps[this.state.turn] = tubProps[this.state.turn].map((tub, i)=>{
            // this.keyManager.options.push(i)
            this.keyManager.push(i, ()=>{this.proccessClick(i, this.state.turn)})
            return {...tub, cursorID : i}
        })
        if (this.props.pickable){
            const oppTurn = !this.state.turn + 0
            const offset = this.props.numTubs
            tubProps[oppTurn] = tubProps[oppTurn].map((tub, i)=>{
                // this.keyManager.options.push(i)
                const j = i + offset
                this.keyManager.push(j, ()=>{this.proccessClick(i, oppTurn)})
                return {...tub, cursorID : j}
            })
        }
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
        if (this.props.pickable){
            const oppTurn = !this.state.turn + 0
            tubProps[oppTurn] = tubProps[oppTurn].map((tub)=>({...tub, cursorID : -1}))
        }
        flytextProps.buttons = flytextProps.buttons.map((btn)=>({...btn, cursorID : -1}))
        this.setState({tubProps, flytextProps})
    }

    handleMoveAnim(tubId, destPos = null, srcPos = null, turn = this.state.turn){
        // const turn = this.state.turn
        const tubProps = this.state.tubProps[turn][tubId]
        const diceMatrix = this.state.diceMatrix
        if (destPos === null) destPos = defLength(diceMatrix[turn][tubId])
        const newDice = srcPos === null ? this.state.sideProps[this.state.turn].newDice : diceMatrix[turn][tubId][srcPos]

        const srcRect = newDice.fwdref.current.getBoundingClientRect()
        const destRect = tubProps.boxRefs[destPos].current.getBoundingClientRect()

        const transX = destRect.x - srcRect.x + (destRect.width - srcRect.width) / 2
        const transY = destRect.y - srcRect.y + (destRect.height - srcRect.height) / 2
        if (srcPos === null){
            if (newDice.transform && newDice.transform !== 'none'){
                const orig = [...newDice.transform.matchAll(/-?\d+/g)].flat()
                newDice.transform = `translate(${Math.round(transX) + Number(orig[0])}px, ${Math.round(transY) + Number(orig[1])}px)`
            } else newDice.transform = `translate(${Math.round(transX)}px, ${Math.round(transY)}px)`
            newDice.transitionTimingFunction = 'ease-in-out'
        } else {
            newDice.transform = `translate(${Math.round(transX)}px, ${Math.round(transY)}px)`
        }
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

    async proccessTurn(i, turn = this.state.turn){
        if (this.props.gameType === 'PVP' && this.state.turn){
            this.server.send({num : this.state.sideProps[this.state.turn].newDice.num, tub : i, side : turn})
        }

        const sideProps = this.state.sideProps
        sideProps[0].tubsClickable = false
        sideProps[1].tubsClickable = false
        this.clearClickable()
        this.setState({sideProps})

        const num = await this.handleMoveAnim(i, null, null, turn)

        if (this.props.caravan && num === 1){
            const scoreChanged = await this.destroyAll(i, turn)
            this.setState(prevState => ({
                sideProps: prevState.sideProps.map((side,ind) => ({ ...side, score: this.calcTotal(ind) , scoreShake : (turn === ind || scoreChanged)})),
                turn: !prevState.turn + 0,
            }), this.checkEnd)
            return
        }

        await this.updateScore(i, turn);
        // this.updateCurrSide({score : total}, {turn : !prevState.turn, rolled: false}, this.rollDice)
        this.setState(prevState => ({
            sideProps: prevState.sideProps.map(side => (
                side.id === turn ?
                    { ...side, score: this.calcTotal(turn) , scoreShown : true, scoreShake : true} : side))
        }))
        const scoreChanged = await this.checkDice(i, num, turn);
        const oppTurn = !turn + 0
        this.setState(prevState => ({
            sideProps: prevState.sideProps.map(side => (
                side.id !== turn ?
                    { ...side, score: this.calcTotal(oppTurn) , scoreShake : scoreChanged} : side)),
            turn: !prevState.turn + 0,
            // rolled: false
        }), this.checkEnd)

    }

    checkEnd(){
        if (this.gameComplete()) this.gameEnd()
        else this.setState({rolled : false}, this.rollDice)
    }

    gameEnd(){
        let name
        if (this.props.caravan){
            const [oppSold, playerSold] = this.state.tubProps.map(s=>(
                s.map(t=>t.score).filter(sc=>(
                    sc >= this.props.caravan[0] && 
                    sc <= this.props.caravan[1]
                ))
            ))
            // console.log([oppSold, playerSold])
            if (playerSold.length > oppSold.length){
                name = Profile.names[this.state.sideProps[1].pfp].toUpperCase()
                this.showFlytext(name + " WINS " + playerSold.length + " - " + oppSold.length); return
            } else if (playerSold.length < oppSold.length){
                name = Profile.names[this.state.sideProps[0].pfp].toUpperCase()
                this.showFlytext(name + " WINS " + oppSold.length + " - " + playerSold.length); return
            } else {
                oppSold.sort();
                oppSold.reverse();
                playerSold.sort();
                playerSold.reverse()
                for (let i = 0; i < playerSold.length; i++) {
                    if (playerSold[i] > oppSold[i]){
                        name = Profile.names[this.state.sideProps[1].pfp].toUpperCase()
                        this.showFlytext(name + " WINS " + playerSold[i] + " - " + oppSold[i]); return
                    } else if (playerSold[i] < oppSold[i]){
                        name = Profile.names[this.state.sideProps[0].pfp].toUpperCase()
                        this.showFlytext(name + " WINS " + oppSold[i] + " - " + playerSold[i]); return
                    }
                }
            }
        }
        const [oppScore, playerScore] = this.state.sideProps.map(e=>e.score)
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
        const flytextProps = this.state.flytextProps
        if (this.props.gameType === 'PVP'){
            flytextProps.hover = true
            flytextProps.onClick = ()=>{}
            this.setState({flytextProps,isLoading : true})
            if(this.server.isHost){
                this.server.send(!turn + 0)
                const msg = await this.server.recv()
                // console.log(msg)
            } else {
                turn = await this.server.recv()
                this.server.send('restart')
            }
            flytextProps.hover = false
        }
        flytextProps.show = false
        const diceMatrix = Array.from({length:2}, ()=>(
            Array.from({length:this.props.numTubs},()=>(Array(this.props.tubLen).fill(null)))
            )
        )
        let {tubProps, sideProps} = this.state
        sideProps = sideProps.map((side)=>({...side, score : 0, scoreShown : false}))
        tubProps = tubProps.map((side)=>(side.map((tub)=>({...tub, score : null}))))

        flytextProps.slideEnd = ()=>{
            flytextProps.slideEnd = ()=>{}
            flytextProps.onClick = ()=>{this.restart()}
            this.setState({diceMatrix, tubProps, sideProps, flytextProps, turn, rolled : false},()=> this.hasSlid())
        }
        this.setState({flytextProps, isLoading : false}, this.clearClickable)
    }

    gameComplete(){
        if (this.props.turnLimit){
            if (this.state.turnCount <= -0.5){
                return true
            }
            this.setState(prevstate=>({turnCount : prevstate.turnCount - 0.5}))
        }
        return this.state.diceMatrix[this.state.turn].flat().every(e=>e)
        // return this.state.diceMatrix[this.state.turn].flat().filter(e=>e).length > 4
    }

    calcTotal(turn=this.state.turn){
        let total = 0;
        for (const tub of this.state.tubProps[turn]) {
            if (tub.score) total += tub.score
        }
        return total
    }

    destroyAll(tub, turn = this.state.turn){
        let diceMatrix = this.state.diceMatrix
        const onePos = defLength(diceMatrix[turn][tub]) - 1
        if (onePos === 0){
            this.updateScore(tub, turn)
            return false
        }
        const removeNum = diceMatrix[turn][tub][onePos-1].num
        let diceLost = [new Set(),new Set()], promises = []

        for(let i = 0; i < diceMatrix.length; i++) {
            for(let j = 0; j < diceMatrix[i].length; j++) {
                for(let k = 0; k < diceMatrix[i][j].length; k++) {
                    const dice = diceMatrix[i][j][k]
                    if (dice && removeNum === dice.num){
                        diceLost[i].add(j)
                        promises.push(new Promise(resolve=>{
                            dice.shrink = true
                            dice.onShrinkEnd = ()=>{
                                diceMatrix[i][j][k] = null
                                this.setState({diceMatrix}, resolve)
                            }
                        }))
                        
                    }
                }
            }
        }
        this.setState({diceMatrix})
        return new Promise(resolve=>{
            Promise.all(promises).then(()=>{
                promises = []
                diceLost.forEach((s,si)=>{
                    s.forEach(i=>{
                        promises.push(this.updateScore(i, si));
                    })
                })
                Promise.all(promises).then(async ()=>{
                    diceMatrix = this.state.diceMatrix
                    for(let i = 0; i < diceLost.length; i++) {
                        for(const j of diceLost[i]){
                            let freePos = 0
                            for(let k = 0; k < diceMatrix[i][j].length; k++) {
                                const dice = diceMatrix[i][j][k]
                                //console.log(`side ${i} tub ${j} box${k}`)
                                if (dice){
                                    if (k !== freePos) {
                                        await this.handleMoveAnim(j, freePos, k, i)
                                    }
                                    freePos++
                                }
                            }
                        }
                    }
                    resolve(!diceLost[!turn + 0].length)
                })
            })
        })
    }

    async checkDice(tub, num, turn = this.state.turn){
        const diceMatrix = this.state.diceMatrix
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
        for (let i = 0; i < this.props.tubLen; i++) {
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
                case this.props.tubLen:
                    dice.diceColor = "#ecd77a"; 
                    dice.diceBorder = "#cdbe61"; 
                    break;
                case this.props.tubLen - 1:
                    if (this.props.tubLen > 2){
                        dice.diceColor = "#72adcf"; 
                        dice.diceBorder = "#6297b6"; 
                        break;
                    }
                default:
                    dice.diceColor = this.props.diceColor[turn]; 
                    dice.diceBorder = this.props.diceBorder[turn];  
                    break;
            }
        }
        this.setState({diceMatrix})
        const tubProps = this.state.tubProps
        const currTub = tubProps[turn][i]
        const isZero = newScore === 0
        if (newScore === currTub.score || (isZero && currTub.score === null)) {
            return new Promise((resolve)=>{resolve()})
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
            proccessClick={(i,t) => this.proccessClick(i,t)} 
            onShakeAnimEnd={(i,t) => this.onShakeAnimEnd(i,t)} 
            onSideScoreAnimEnd={() => this.onSideScoreAnimEnd(side)}
            id={side}
            cursor={this.state.cursor}
        />)
    }

    proccessClick(i, tub = this.state.turn){
        if (isFull(this.state.diceMatrix[tub][i])) {
            let tubProps = this.state.tubProps.slice()
            tubProps[tub][i].startShake = true
            this.setState({tubProps})
        } else {
            // this.setState({tubsClickable : false})
            if (this.props.time) {
                clearInterval(this.timeInterval)
                const {sideProps, turn} = this.state
                sideProps[turn].time = -1
                this.setState(sideProps)
            }
            this.proccessTurn(i, tub)
        }
    }

    
    onShakeAnimEnd(i, turn){
        const tubProps = this.state.tubProps.slice()
        tubProps[turn][i].startShake = false
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
            newDice.height = this.boxMin() * scale
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
        if (this.props.gameType === 'PVP'){
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
                {this.props.turnLimit ? <div className="turnCounter">
                    <p>{Math.ceil(this.state.turnCount)}</p>
                    <p>{`of ${this.props.turnLimit} turns left`}</p>
                </div> : null}
                {this.props.gameType === 'PVP' ? <div className="settingsInfo">
                    {`${this.props.pickable ? 'Unrestricted, ' : ''}${!!this.props.caravan ? `Caravan ${this.props.caravan}` : ''}`}
                </div> : null}
            </div>
        )
    }
}

export default Game