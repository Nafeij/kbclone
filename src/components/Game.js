/* eslint react/prop-types: 0 */

import React from "react";
import Side from '../components/Side.js'
import Flytext from "./Flytext.js";
import {randomInRange, defLength, numMatchingDice, isFull, scoreTub, convertToNumMat, eleDimensions, tubBoxWidth} from '../util/Utils.js';
import KeyManager from "../util/KeyManager.js";
import {evaluate, cheatDice, scoreAll} from "../util/AI.js";
import Server from "../util/Server.js";
import Loading from "./Loading.js";
import Profile from "../util/Profile.js";


const scale = .95, numFaces = 6, boxAspectRatio = 7/5

class Game extends React.Component {
    constructor(props){
        super(props)
        this.keyManager = new KeyManager()
        this.server = new Server()
        this.tubBoxAspect = (props.settings.tubLen + 1) / (boxAspectRatio * props.settings.numTubs)
        // console.log(this.tubBoxAspect)
        const isAI = props.settings.gameType === 'AI',
            oppProfile = isAI ? Profile.ai[props.settings.oppProfileInd] : Profile.cosm[props.settings.oppProfileInd]
        let numLives = null
        if (isAI){
            if (Profile.ai[props.settings.oppProfileInd].effects.includes('life2')) numLives = 1
            else if (Profile.ai[props.settings.oppProfileInd].effects.includes('life3')) numLives = 2
        }
        this.state = {
            diceMatrix: Array.from({length:2}, ()=>(
                Array.from({length: props.settings.numTubs},()=>(Array(props.settings.tubLen).fill(null)))
                )
            ),
            tubProps: Array.from({length:2},(_,i)=>(
                Array.from({length: props.settings.numTubs}, (_,j) => ({
                    startShake: false,
                    animClass: '',
                    onScoreAnimEnd: ()=>{},
                    score: null,
                    oldScore: null,
                    scoreMemo: null,
                    boxRefs: Array(props.settings.tubLen).fill().map(React.createRef),
                    scoreScale: 'none',
                    cursorID: -1,
                    caravan : props.settings.caravan,
                    scoreHover : this.props.settings.preview ? (h)=>{this.scoreHover(h,i,j)} : ()=>{}
                })))
            ),
            sideProps: Array.from({length:2},(_,i)=>({
                    tubsClickable: false,
                    id: i,
                    newDice: null,
                    score: 0,
                    scoreShown: false,
                    scoreShake: false,
                    profile: i ? Profile.cosm[props.settings.playProfileInd] : oppProfile,
                    name : i ? props.settings.name : props.settings.oppName,
                    rollRef : React.createRef(),
                    tubsRef : React.createRef(),
                    numTubs: props.settings.numTubs,
                    tubLen: props.settings.tubLen,
                    maxWidth: 0,
                    boxAspectRatio,
                    time : props.settings.time === null ? props.settings.time : -1,
                    maxLives : !i ? numLives : null,
                    lives : !i ? numLives : null,
                    prevDiceNum : 0,
                    cleared : 0,
                    destroyed : 0,
                    destroyedTurn: 0
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
                        if (props.settings.time) clearInterval(this.timeInterval)
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
            turnCount: props.settings.turnLimit,
            gameTime: null
        }
        this.keyManager.initCursorUpdate(()=>{
            this.setState({cursor: this.keyManager.cursor})
        })
    }

    generateDice(){
        this.setState((state)=>({dkey : state.dkey + 1}))
        const turn = this.state.turn
        return {
            key: this.state.dkey,
            height: this.boxMin() * scale,
            transition: '.3s',
            transitionTimingFunction: 'ease-in',
            translate: 'none',
            scale: 'none',
            shrink: false,
            shrinkPreview: false,
            cheat: false,
            num: randomInRange(numFaces) + 1,
            diceColor : this.props.settings.diceColor[turn],
            diceBorder : this.props.settings.diceBorder[turn],
            pipColor : this.props.settings.pipColor[turn],
            zIndex: 1,
            onMovEnd: ()=>{},
            onShrinkEnd: ()=>{},
            fwdref: React.createRef(),
            isCaravan : !!this.props.settings.caravan,
        }
    }

    boxMin(){
        const rect = this.state.tubProps[this.state.turn][0].boxRefs[0].current.getBoundingClientRect()
        return rect.height < rect.width ? rect.height : rect.width
    }

    updateCurrSide(props, other={}, callback = ()=>{}){
        return this.setState(prevState => ({
            sideProps: prevState.sideProps.map(side => (
                side.id === prevState.turn ?
                    { ...side, ...props } : side)),
            ...other
        }), callback)
    }

    async gameStart(){
        this.setState({slid : true})
        const name = this.state.sideProps[this.state.turn].name.toUpperCase()
        await this.showFlytext(name + " ROLLS FIRST", 2000, 500)
        this.rollDice()
    }

    async rollDice(){
        this.setState({rolled : true})
        let rnum
        if (this.props.settings.gameType === 'PVP'){
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
        const {gameTime} = this.state
        this.updateCurrSide({newDice}, {gameTime : !!gameTime ? gameTime : Date.now()}, ()=>{
            const {sideProps, turn} = this.state
            newDice = sideProps[turn].newDice
            const diceHeight = newDice.height
            const {height, width} = eleDimensions(sideProps[turn].rollRef.current)
            if (diceHeight < height){
                /* console.log(rollH - diceHeight) */
                newDice.translate = Math.round(((width - diceHeight) / 2) * (Math.random()*2-1))+ "px " + Math.round(((height - diceHeight) / 2) * (Math.random()*2-1)) + "px"
            }
            const interval = setInterval(()=>{
                const {sideProps, turn} = this.state
                newDice = sideProps[turn].newDice
                newDice.num = (newDice.num + randomInRange(numFaces-1) + 1) % numFaces + 1
                this.setState({sideProps})
            },100);
            setTimeout(() => {
                clearInterval(interval)
                const {diceMatrix, sideProps, turn} = this.state
                const {profile , newDice} = sideProps[turn]
                if (this.props.settings.gameType === 'PVP'){
                    newDice.num = rnum
                    if (!turn) {
                        this.setState({isLoading : true})
                        if (this.props.settings.time) {
                            let thisTime = this.props.settings.time
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
                                this.timeoutDestroy()
                                return
                            }
                            newDice.num = mov.num
                            if (this.props.settings.time) {
                                sideProps[turn].time = -1
                                clearInterval(this.timeInterval)
                            }
                            this.setState({sideProps, isLoading : false},()=>{
                                this.proccessTurn(mov.tub,!mov.side + 0)
                        })})
                    } else {
                        this.playerActivate()
                    }
                } else if (this.props.settings.gameType === 'AI' && !turn){
                    const numMat = convertToNumMat(diceMatrix)
                    if(profile.effects.includes('cheat') && Math.random() > 0.5) {
                        let best = cheatDice(numMat, turn, numFaces, this.props.settings, this.state.turnCount)
                        newDice.num = best.num
                        newDice.cheat = true
                        this.setState({sideProps},()=>{this.proccessTurn(best.tub, best.side)})
                        return
                    }
                    const choice = evaluate(numMat, newDice.num, profile, turn, this.props.settings, this.state.turnCount)
                    this.proccessTurn(choice.tub, choice.side)
                } else {
                    this.playerActivate()
                }
            }, 800)
        })
    }

    playerActivate() {
        this.setTubClickable()
        this.updateCurrSide({ tubsClickable: true }, {}, () => {
            const { sideProps, turn } = this.state
            const {pickable, time, gameType} = this.props.settings
            if (pickable) sideProps[!turn + 0].tubsClickable = true
            if (time) {
                let thisTime = time
                sideProps[turn].time = thisTime
                this.timeInterval = setInterval(() => {
                    if (thisTime <= 0) {
                        clearInterval(this.timeInterval)
                        if (gameType === 'PVP') this.server.send('timeout')
                        this.timeoutDestroy()
                        // this.proccessTurn(evaluate(diceMatrix, newDice.num, 0, turn))
                    } else {
                        thisTime--
                        sideProps[turn].time = thisTime
                        this.setState(sideProps)
                    }
                }, 1000)
            }
            this.setState(sideProps)
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
            newDice.scale = 0
            newDice.onMovEnd = ()=>{
                sideProps[turn].newDice = null
                this.setState({sideProps, turn: !turn + 0}, this.checkEnd)
            }
        }
        this.setState({sideProps})
    }

    setTubClickable(){
        // this.clearClickable()
        // this.keyManager.cursor = 0
        let {tubProps, turn} = this.state
        const offset = this.props.settings.numTubs
        tubProps = tubProps.map((side, si)=>{
            return side.map((tub, ti)=>{
                if (si === 1 - turn) {
                    if (this.props.settings.pickable){
                        const j = ti + offset
                        this.keyManager.push(j, ()=>{this.proccessClick(ti, si)})
                        return {...tub, cursorID : j, scoreMemo : null, oldScore : tub.score}
                    }
                    return {...tub, scoreMemo : null, oldScore : tub.score}
                }
                this.keyManager.push(ti, ()=>{this.proccessClick(ti, si)})
                return {...tub, cursorID : ti, scoreMemo : null, oldScore : tub.score}
            })
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
        // this.keyManager.cursor = 0
        let {tubProps, flytextProps, turn} = this.state
        // const oldScore = (si,ti) => (memo ? memo[0][si][ti] : null)
        tubProps = tubProps.map((side)=>{
            return side.map((tub)=>{
                return {...tub, cursorID : -1, scoreMemo : null}
            })
        })

        // const p = tubProps.map((side)=>(side.map((tub)=>(tub.oldScore))))
        // console.log(p)

        flytextProps.buttons = flytextProps.buttons.map((btn)=>({...btn, cursorID : -1}))
        this.setState({tubProps, flytextProps})
    }

    handleMoveAnim(tubId, destPos = null, srcPos = null, turn = this.state.turn){
        // const turn = this.state.turn
        const tubProps = this.state.tubProps[turn][tubId]
        const diceMatrix = this.state.diceMatrix
        if (destPos === null) destPos = defLength(diceMatrix[turn][tubId])
        const newDice = srcPos === null ? this.state.sideProps[this.state.turn].newDice : diceMatrix[turn][tubId][srcPos]

        if (!newDice) return new Promise((r)=>r())

        const srcRect = newDice.fwdref.current.getBoundingClientRect()
        const destRect = tubProps.boxRefs[destPos].current.getBoundingClientRect()

        const transX = destRect.x - srcRect.x + (destRect.width - srcRect.width) / 2
        const transY = destRect.y - srcRect.y + (destRect.height - srcRect.height) / 2
        if (srcPos === null){
            const orig = [...newDice.translate.matchAll(/-?\d+/g)].flat()
            newDice.translate = (Math.round(transX) + Number(orig[0])) + "px " +
                    (Math.round(transY) + Number(orig[1])) + "px"
            newDice.transitionTimingFunction = 'ease-in-out'
        } else {
            newDice.translate = Math.round(transX) + "px " + Math.round(transY) + "px"
        }
        newDice.zIndex = 2
        return new Promise((resolve) =>{
            newDice.onMovEnd = ()=>{
                newDice.onMovEnd = ()=>{}
                newDice.translate = 'none'
                newDice.zIndex = 0
                newDice.height = (scale * 100) + '%'
                const num = newDice.num
                const diceMatrix = this.state.diceMatrix.slice()
                if (srcPos !== null) diceMatrix[turn][tubId][srcPos] = null
                diceMatrix[turn][tubId][destPos] = newDice
                // if (srcPos) console.log(newDice)
                return this.updateCurrSide({newDice:null}, {diceMatrix}, ()=>{
                    resolve(num)
                })
            }
            if (srcPos) this.setState({diceMatrix})
        })

    }

    async proccessTurn(tub, turn = this.state.turn){
        if (this.props.settings.gameType === 'PVP' && this.state.turn){
            this.server.send({num : this.state.sideProps[this.state.turn].newDice.num, tub, side : turn})
        }
        const memo = this.fetchMemo(turn, tub)
        this.clearClickable()
        const {sideProps} = this.state
        sideProps[0].tubsClickable = false
        sideProps[1].tubsClickable = false
        this.setState({sideProps})
        const num = await this.handleMoveAnim(tub, null, null, turn)
        if (this.props.settings.caravan && num === 1){
            const scoreChanged = await this.destroyAll(tub, turn, memo)
            this.setState(prevState => ({
                sideProps: prevState.sideProps.map((side,ind) => ({ ...side, score: this.calcTotal(ind, memo) , scoreShake : (turn === ind || scoreChanged)})),
                turn: !prevState.turn + 0,
            }), this.checkEnd)
            return
        }
        await this.updateScore(tub, turn, memo);
        // this.updateCurrSide({score : total}, {turn : !prevState.turn, rolled: false}, this.rollDice)
        const scoreChanged = await this.destroyTub(tub, num, turn, memo);
        const oppTurn = !turn + 0
        this.setState(prevState => ({
            sideProps: prevState.sideProps.map(side => (
                side.id === turn ?
                    { ...side, score: this.calcTotal(turn, memo) , scoreShown : true, scoreShake : true}:
                    { ...side, score: this.calcTotal(oppTurn, memo) , scoreShake : scoreChanged})),
            turn: !prevState.turn + 0,
            // rolled: false
        }), this.checkEnd)

    }

    checkEnd(){
        if (this.gameComplete()) this.gameEnd()
        else this.setState({rolled : false}, this.rollDice)
    }

    async gameEnd(){
        const {statUpdate, settings} = this.props
        const {gameTime, diceMatrix, sideProps} = this.state
        let winnerInd = -1, scoreList, time = Date.now() - gameTime
        if (settings.caravan){
            scoreList = diceMatrix.map(s=>(
                s.map(t=>scoreTub(t)).filter(sc=>(
                    sc >= settings.caravan[0] &&
                    sc <= settings.caravan[1]
                ))
            ))
            if (scoreList[1].length !== scoreList[0].length){
                winnerInd = (scoreList[1].length > scoreList[0].length) + 0
                scoreList[0] = scoreList[0].length; scoreList[1] = scoreList[1].length
            } else {
                scoreList[0].sort().reverse()
                scoreList[1].sort().reverse()
                let win = false
                for (let i = 0; i < scoreList[0].length; i++) {
                    if (scoreList[1][i] !== scoreList[0][i]){
                        winnerInd = (scoreList[1][i] > scoreList[0][i]) + 0
                        scoreList[0] = scoreList[0][i]
                        scoreList[1] = scoreList[1][i]
                        win = true
                        break
                    }
                }
                if (!win) {
                    scoreList[0] = scoreList[0].length
                    scoreList[1] = scoreList[1].length
                }
            }
        } else {
            scoreList = diceMatrix.map(s=>(
                s.map(t=>scoreTub(t)).reduce((a,b)=>(a+b),0)
            ))
            if (scoreList[1] !== scoreList[0]) winnerInd = (scoreList[1] > scoreList[0]) + 0
        }

        if (winnerInd >= 0){
            if (sideProps[!winnerInd+0].lives){
                sideProps[!winnerInd+0].lives--
                await this.destroyAll(null, null)
                this.setState({sideProps, rolled : false, turnCount : this.props.settings.turnLimit}, this.rollDice)
                return
            }
            this.showFlytext(sideProps[winnerInd].name.toUpperCase() + " WINS " + scoreList[winnerInd] + " - " + scoreList[!winnerInd + 0])
        }
        else {
            if (sideProps.some(s=>(s.maxLives))){
                await this.destroyAll(null, null)
                this.setState({rolled : false, turnCount : this.props.settings.turnLimit}, this.rollDice)
                return
            }
            this.showFlytext("TIE GAME " + scoreList[0] + " - " + scoreList[1])
        }

        const destroyedList = sideProps.map(s=>(s.destroyed)),
            clearList = sideProps.map(s=>(s.cleared)),
            destroyedMaxTurnList = sideProps.map(s=>(s.destroyedTurn))
        statUpdate(time, winnerInd, scoreList, clearList, destroyedList, destroyedMaxTurnList)
    }

    showFlytext(text, timeOut=-1, delay=-1){
        const flytextProps = this.state.flytextProps
        flytextProps.message = text
        flytextProps.timeOut = timeOut
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
        if (this.props.settings.gameType === 'PVP'){
            flytextProps.hover = true
            flytextProps.onClick = ()=>{}
            this.setState({flytextProps,isLoading : true})
            if(this.server.isHost){
                this.server.send(!turn + 0)
                await this.server.recv()
                //const msg = await this.server.recv()
                // console.log(msg)
            } else {
                turn = await this.server.recv()
                this.server.send('restart')
            }
            flytextProps.hover = false
        }
        flytextProps.show = false
        const diceMatrix = Array.from({length:2}, ()=>(
            Array.from({length:this.props.settings.numTubs},()=>(Array(this.props.settings.tubLen).fill(null))))
        )

        let {tubProps, sideProps} = this.state
        sideProps = sideProps.map((side)=>({...side, score : 0, destroyed : 0, destroyedTurn : 0, cleared : 0, prevDiceNum : 0, scoreShown : false, lives: side.maxLives}))
        tubProps = tubProps.map((side)=>(side.map((tub)=>({...tub, score : null}))))

        flytextProps.slideEnd = ()=>{
            flytextProps.slideEnd = ()=>{}
            flytextProps.onClick = ()=>{this.restart()}
            this.setState({diceMatrix, tubProps, sideProps, flytextProps, turn, rolled : false},()=> this.gameStart())
        }
        this.setState({flytextProps, gameTime : null, turnCount : this.props.settings.turnLimit, isLoading : false}, this.clearClickable)
    }

    gameComplete(){
        let {turnCount, diceMatrix, turn, sideProps} = this.state
        const {turnLimit, ignoreFull, tubLen, numTubs} = this.props.settings

        const numDice = diceMatrix.map(s=>(s.flat().filter(e=>e).length)),
            prevNums = sideProps.map(s=>s.prevDiceNum),
            max = tubLen * numTubs

        sideProps = sideProps.map((s,i)=>{
            const opp = !i+0
            if (prevNums[opp] && !numDice[opp]) s.cleared++
            s.prevDiceNum = numDice[i]
            return s
        })

        if (turnLimit){
            if (turnCount <= -0.5){
                this.setState({sideProps})
                return true
            }
            this.setState({sideProps, turnCount : turnCount - 0.5})
        } else {
            this.setState({sideProps})
        }

        if (ignoreFull) return numDice[turn] >= max
        return numDice[!turn+0] >= max || numDice[turn] >= max
        // return diceMatrix[turn].flat().filter(e=>e).length > 4
    }

    calcTotal(turn=this.state.turn, memo=null){
        const caravan = this.props.settings.caravan
        if (memo) {
            return memo[0][turn].reduce((part, a) => this.scoreReduce(part, a, caravan), 0)
        }
        return this.state.diceMatrix[turn].map(t=>(scoreTub(t))).reduce((part, a) => this.scoreReduce(part, a, caravan), 0)
    }

    scoreReduce(part, a, caravan) {
        if (caravan) {
            a = a >= caravan[0] && a <= caravan[1] ? 1 : 0
        }
        return part + a
    }

    destroyAll(tub, turn = this.state.turn, memo = null){
        let {diceMatrix, sideProps} = this.state
        let onePos, removeNum, destAll = tub === null
        if (!destAll){
            onePos = defLength(diceMatrix[turn][tub])
            removeNum = -1
            if (onePos > 1) removeNum = diceMatrix[turn][tub][onePos-2].num
        }

        let diceLost = [new Set(),new Set()], promises = [], destroyed = [0,0]
        for(let i = 0; i < diceMatrix.length; i++) {
            for(let j = 0; j < diceMatrix[i].length; j++) {
                for(let k = 0; k < diceMatrix[i][j].length; k++) {
                    const dice = diceMatrix[i][j][k]
                    if (dice && (removeNum === dice.num || (dice.num === 1 && i !== turn && j === tub) || destAll)){
                        diceLost[i].add(j)
                        destroyed[i]++
                        promises.push(new Promise(resolve=>{
                            dice.shrink = true
                            dice.onShrinkEnd = ()=>{
                                diceMatrix[i][j][k] = null
                                const sideProps = this.state.sideProps
                                this.setState({diceMatrix,sideProps}, resolve)
                            }
                        }))
                    }
                }
            }
        }
        if (!destAll){
            if (!promises.length){
                this.updateScore(tub, turn, memo)
                return false
            }
            sideProps = sideProps.map((s,i)=>{
                s.destroyed += destroyed[!i+0]
                s.destroyedTurn = Math.max(s.destroyedTurn, destroyed[!i+0])
                return s
            })
        }
        this.setState({diceMatrix, sideProps})
        return new Promise(resolve=>{
            Promise.all(promises).then(()=>{
                if (!destAll) promises = [this.updateScore(tub, turn, memo)]
                diceLost.forEach((s,si)=>{
                    s.forEach(i=>{
                        if (tub !== i || turn !== si) promises.push(this.updateScore(i, si, memo));
                    })
                })
                // console.log(promises)
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

    async destroyTub(tub, num, turn = this.state.turn, memo = null){
        const {diceMatrix, sideProps, tubProps} = this.state
        const oppTurn = !turn + 0
        let destroyed = 0;
        const fLen = defLength(diceMatrix[oppTurn][tub])
        for (let i = 0; i < fLen; i++) {
            // const dice = diceMatrix[turn][tub][i]
            const oppDice = diceMatrix[oppTurn][tub][i]
            // console.log(`(${dice.num} : ${oppDice.num})`)
            if (num === oppDice.num){
                destroyed++
                oppDice.shrink = true
                await new Promise((resolve)=>{
                    oppDice.onShrinkEnd = ()=>{
                        // currDice.shrink = false
                        diceMatrix[oppTurn][tub][i] = null
                        this.setState({diceMatrix})
                        resolve()
                    }
                    this.setState({diceMatrix})
                })
            }
        }
        if (!destroyed) return false;
        sideProps[turn].destroyed += destroyed
        sideProps[turn].destroyedTurn = Math.max(sideProps[turn].destroyedTurn, destroyed)
        this.setState({sideProps})
        await this.updateScore(tub, oppTurn, memo);
        let freePos = 0;
        for (let i = 0; i < this.props.settings.tubLen; i++) {
            const oppDice = diceMatrix[oppTurn][tub][i]
            if (oppDice){
                if (i !== freePos) {
                    await this.handleMoveAnim(tub, freePos, i, oppTurn)
                }
                freePos++
            }
        }
        return true
    }

    updateScore(i, turn = this.state.turn, scoreMemo = null){
        let newScore = 0;
        const {diceMatrix, tubProps} = this.state
        for (const dice of diceMatrix[turn][i]){
            if (!dice) continue
            const numMatch = numMatchingDice(diceMatrix[turn][i], dice.num);
            switch (numMatch) {
                case this.props.settings.tubLen:
                    dice.diceColor = "#ecd77a";
                    dice.diceBorder = "#cdbe61";
                    break;
                case this.props.settings.tubLen - 1:
                    dice.diceColor = "#72adcf";
                    dice.diceBorder = "#6297b6";
                    break;
                default:
                    dice.diceColor = this.props.settings.diceColor[turn];
                    dice.diceBorder = this.props.settings.diceBorder[turn];
                    break;
            }
            if (!scoreMemo) {
                newScore += dice.num * numMatch
            }
        }
        if (scoreMemo) {
            newScore = scoreMemo[0][turn][i]
        }
        // tubProps[turn][i].oldScore = newScore
        // console.log(`${turn},${i} : memo fetch oldScore set ${newScore}`)
        this.setState({diceMatrix, tubProps})
        return this.handleScoreHover(newScore,turn,i,true)
    }

    handleScoreHover(newScore,side,tub,isHover){
        const tubProps = this.state.tubProps
        //const p = tubProps.map((side)=>(side.map((tub)=>(tub.oldScore))))
        //console.log(p)
        if (!isHover) {
            newScore = tubProps[side][tub].oldScore
            // console.log(`${side},${tub} : oldScore ${newScore}`)
        }
        return new Promise((resolve)=>{
            if (!newScore) newScore = null
            const tubProp = tubProps[side][tub]
            if (tubProp.animClass !== '') resolve()
            tubProp.animClass = ''
            tubProp.scoreScale = 'none'
            if (tubProp.score !== newScore){
                if (newScore) {
                    this.setState({tubProps},()=>{
                        tubProp.score = newScore
                        tubProp.animClass = 'shake'
                        tubProp.onScoreAnimEnd = ()=>{
                            tubProp.animClass = ''
                            tubProp.onScoreAnimEnd = ()=>{}
                            this.setState({tubProps})
                            resolve()
                        }
                        this.setState({tubProps})
                    })
                } else {
                    this.setState({tubProps},()=>{
                        tubProp.animClass = 'shrink-out'
                        tubProp.scoreScale = 0
                        tubProp.onScoreAnimEnd = ()=>{
                            tubProp.score = newScore
                            tubProp.animClass = ''
                            tubProp.onScoreAnimEnd = ()=>{}
                            this.setState({tubProps},()=>{
                                tubProp.scoreScale = 'none'
                                this.setState({tubProps})
                            })
                            resolve()
                        }
                        this.setState({tubProps})
                    })
                }
            } else {
                this.setState({tubProps})
                resolve()
            }
        })
    }

    fetchMemo(i, j) {
        let {diceMatrix, tubProps, turn, sideProps} = this.state
        if (!tubProps[i][j].scoreMemo) {
            const settings = this.props.settings
            const newDice = sideProps[turn].newDice.num
            const numMat = convertToNumMat(diceMatrix);
            tubProps[i][j].scoreMemo = scoreAll(newDice, numMat, turn, { side: i, tub: j }, settings, true);
            this.setState({tubProps})
        }
        return tubProps[i][j].scoreMemo
    }

    scoreHover(isHover,i,j){
        let {diceMatrix, tubProps} = this.state
        if (isFull(diceMatrix[i][j])) return
        const memo = this.fetchMemo(i, j);
        const [scores, changes ,] = memo
        // if (isHover) {
        //     changes.forEach(t=>{
        //         diceMatrix[t.s][t.t][t.d].shrinkPreview = isHover
        //     })
        // } else {
        //     diceMatrix = diceMatrix.map(s=>(
        //         s.map(t=>(
        //             t.map(d=>{
        //                 if(d) {d.shrinkPreview = false} return d
        //             })
        //         ))
        //     ))
        // }
        changes.forEach(t=>{
            diceMatrix[t.s][t.t][t.d].shrinkPreview = isHover
        })
        // this.setState({diceMatrix, tubProps},()=>{
        //     scores.forEach((s,si)=>{
        //         s.forEach((newScore,ti)=>{
        //             this.handleScoreHover(newScore,si,ti,isHover)
        //         })
        //     })
        // })
        this.setState({diceMatrix, tubProps},()=>{
            scores.forEach((s,si)=>{
                s.forEach((newScore,ti)=>{
                    this.handleScoreHover(newScore,si,ti,isHover)
                })
            })
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
            hasSlid={() => this.gameStart()}
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
            if (this.props.settings.time) {
                clearInterval(this.timeInterval)
                const {sideProps, turn} = this.state
                sideProps[turn].time = -1
                this.setState(sideProps)
            }
            this.proccessTurn(i, tub)
        }
    }


    onShakeAnimEnd(i, turn){
        const tubProps = this.state.tubProps
        tubProps[turn][i].startShake = false
        this.setState({tubProps})
    }

    onSideScoreAnimEnd(side){
        const sideProps = this.state.sideProps
        sideProps[side].scoreShake = false
        this.setState({sideProps})
    }

    onResize(){
        try{
            this.setState(prevState => {
                prevState.sideProps = prevState.sideProps.map(s=>{
                    const {height, width} = eleDimensions(s.tubsRef.current)
                    s.maxWidth = tubBoxWidth(height / width, this.tubBoxAspect)
                    // console.log(s.maxWidth)
                    if (s.newDice) {
                        s.newDice.height = this.boxMin() * scale
                    }
                    return s
                })
                return prevState
            })
        } catch (e) {}
    }

    // tubSizeOnResize(){
    //     try{
    //         this.setState(prevState => {
    //             prevState.sideProps = prevState.sideProps.map(s=>{
    //                 s.tubsDim = eleDimensions(s.tubsRef.current)
    //                 return s
    //             })
    //             return prevState
    //         })
    //     } catch (e) {}
    // }


    componentDidMount(){
        // let {sideProps} = this.state
        // sideProps = sideProps.map(s=>{s.tubsDim = eleDimensions(s.tubsRef.current);return s})
        if (this.props.settings.gameType === 'PVP'){
            const flytextProps = this.state.flytextProps
            flytextProps.buttons[1].text = "Disconnect"
            this.setState({turn : this.props.turn, flytextProps})
        } else {
            this.setState({turn : randomInRange(2)})
        }
        this.onResize()
        window.addEventListener("resize", this.onResize)
    }

    componentWillUnmount(){
        window.removeEventListener("resize", this.onResize)
    }

    render(){
        const {ignoreFull, pickable, caravan} = this.props.settings
        const isPVP = this.props.settings.gameType === 'PVP'
        return (
            <div className="game">
                {this.renderSide(0)}
                {this.renderSide(1)}
                <Flytext {...this.state.flytextProps} cursor={this.state.cursor}/>
                <Loading show={this.state.isLoading}/>
                {this.props.settings.turnLimit ? <div className="turnCounter">
                    <p>{Math.ceil(this.state.turnCount)}</p>
                    <p>{`of ${this.props.settings.turnLimit} turns left`}</p>
                </div> : null}
                <div className="settingsInfo">
                    {`${ignoreFull && isPVP? 'Longplay, ' : ''}${pickable && isPVP? 'Sabotage, ' : ''}${!!caravan ? `Caravan ${caravan}` : ''}`}
                </div>
            </div>
        )
    }
}

export default Game