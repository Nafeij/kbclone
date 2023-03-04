import React from "react";
import PropTypes from "prop-types";
import Nav, { navDynamic } from "react-navtree";

import Side from '../components/Side.js';
import { withParams } from "../NavHooks.js";
import { cheatDice, evaluate, scoreAll } from "../util/AI.js";
import Profile from "../util/Profile.js";
import Server from "../util/Server.js";
import { convertToNumMat, defLength, eleDimensions, GameType, isFull, numMatchingDice, randomExcluding, randomInRange, scoreTub, tubBoxWidth, typeFromParam, flipScoreObj } from '../util/Utils.js';
import Flytext from "./Flytext.js";
import Loading from "./Loading.js";

const scale = .95, numFaces = 6, boxAspectRatio = 7/5

class Game extends React.Component {
  constructor(props){
    super(props)
    this.gameType = typeFromParam(this.props.params.gameType)
    this.server = new Server()
    this.tubBoxAspect = (this.props.settings.tubLen + .8) / (boxAspectRatio * this.props.settings.numTubs)

    let numLives, oppProfile,
      {oppProfileInd, oppName, playProfileInd, name, numTubs, tubLen, preview, caravan, time, turnLimit, turn} = this.props.settings
    if (this.gameType === GameType.AI){
      oppProfile = Profile.ai[this.props.params.charInd]
      oppName = oppProfile.name
      if (oppProfile.effects.includes('life2')) numLives = 1
      else if (oppProfile.effects.includes('life3')) numLives = 2
    } else {
      if (this.gameType === GameType.DEFAULT) {
        oppName = name
        oppProfileInd = playProfileInd
      } else if (this.gameType === GameType.ONLINE){
        if (!this.server.peer || this.server.peer.disconnected) {
          console.error('Game: Server not connected')
        }
      }
      oppProfile = Profile.cosm[oppProfileInd]
    }

    ;['gameStart', 'proccessClick', 'onShakeAnimEnd', 'onKeyUp', 'blockingFunc', 'return', 'restart', 'onResize', 'scrambleDice'].forEach(func => {
      this[func] = this[func].bind(this)
    })

    this.state = {
      diceMatrix: Array.from({length:2}, ()=>(
        Array.from({length: numTubs},()=>(Array(tubLen).fill(null)))
        )
      ),
      tubProps: Array.from({length:2},(_,i)=>(
        Array.from({length: numTubs}, (_,j) => ({
          startShake: false,
          animClass: '',
          onScoreAnimEnd: ()=>{},
          score: null,
          oldScore: null,
          scoreMemo: null,
          boxRefs: Array(tubLen).fill().map(React.createRef),
          scoreScale: 'none',
          caravan : caravan,
          scoreHover : preview ? (h)=>{this.scoreHover(h,i,j)} : ()=>{}
        })))
      ),
      sideProps: Array.from({length:2},(_,i)=>({
          tubsClickable: false,
          id: i,
          newDice: null,
          score: 0,
          scoreShown: false,
          scoreShake: false,
          profile: i ? Profile.cosm[playProfileInd] : oppProfile,
          name : i ? name : oppName,
          rollRef : React.createRef(),
          tubsRef : React.createRef(),
          numTubs: numTubs,
          tubLen: tubLen,
          maxWidth: '0',
          boxAspectRatio,
          time : time === null ? time : -1,
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
        display: false,
        show: false,
        hover : false,
        buttons: [
          {
            text : 'Rematch',
            onClick: this.restart
          },
          {
            text : this.gameType === GameType.ONLINE ? 'Disconnect' : 'Back',
            onClick: this.return,
          }
        ]
      },
      turnCount: turnLimit,
      gameTime: null,
      turn: this.gameType === GameType.ONLINE ? turn : randomInRange(2),
      rolled: false,
      slid: false,
      dkey: 0,
      isLoading: false
    }
  }

  generateDice(){
    this.setState((state)=>({dkey : state.dkey + 1}))
    const turn = this.state.turn
    return {
      key: this.state.dkey,
      height: this.boxMin() * scale,
      transitionTimingFunction: 'ease-in',
      translate: 'none',
      scale: 'none',
      shrink: false,
      shrinkPreview: false,
      cheat: false,
      match: null,
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
    let ref = this.state.tubProps[this.state.turn][0].boxRefs[0].current
    if (!ref) return
    const rect = ref.getBoundingClientRect()
    return Math.min(rect.height, rect.width)
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
    if (this.gameType === GameType.ONLINE){
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
    const {gameTime, turn} = this.state
    this.updateCurrSide({newDice}, {gameTime : gameTime ?? Date.now()}, ()=>{
      const { interval } = this.scrambleDice(newDice)
      setTimeout(() => {
        clearInterval(interval)
        if (this.gameType === GameType.ONLINE){
          newDice.num = rnum
          if (!turn) {
            const {sideProps, turn} = this.state
            const {newDice} = sideProps[turn]
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
              this.setState({sideProps, newDice, isLoading : false},()=>{
                this.proccessTurn(mov.tub,mov.side,mov.memo)
            })})
          } else {
            this.playerActivate()
          }
        } else if (this.gameType === GameType.AI && !turn){
          const {diceMatrix, sideProps} = this.state
          const {profile , newDice} = sideProps[turn]
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

  scrambleDice(newDice) {
    const { turn, sideProps } = this.state
    const diceHeight = newDice.height
    const { height, width } = eleDimensions(sideProps[turn].rollRef.current)
    newDice.translate = this.translateCoords(diceHeight, diceHeight, width, height)
    const interval = setInterval(() => {
      newDice = sideProps[turn].newDice
      newDice.num = randomExcluding(numFaces, newDice.num) + 1
      this.setState({ sideProps })
    }, 100)
    return { interval }
  }

  translateCoords(srcX, srcY, destX, destY) {
    const axisDiff = (src, dest) => {
      return Math.round(((dest - src) / 2) * (Math.random() * 2 - 1));
    }
    return axisDiff(srcX, destX) + "px " + axisDiff(srcY, destY) + "px";
  }

  playerActivate() {
    this.setTubClickable()
    const { sideProps, turn } = this.state
    const { time } = this.props.settings
    if (time) {
      let thisTime = time
      sideProps[turn].time = thisTime
      this.timeInterval = setInterval(() => {
        if (thisTime <= 0) {
          clearInterval(this.timeInterval)
          if (this.gameType === GameType.ONLINE) {
            this.server.send('timeout')
          }
          this.timeoutDestroy()
        } else {
          thisTime--
          sideProps[turn].time = thisTime
          this.setState(sideProps)
        }
      }, 1000)
    }
    this.setState(sideProps)
  }

  timeoutDestroy(){
    const {sideProps, turn} = this.state
    this.clearClickable()

    const newDice = sideProps[turn].newDice
    if (newDice.fwdref.current) {
      // this.proccessTurn(evaluate(diceMatrix, newDice.num, 0, turn))
      newDice.scale = '0'
      newDice.onMovEnd = ()=>{
        sideProps[turn].newDice = null
        this.setState({sideProps, turn: !turn + 0}, this.checkEnd)
      }
    }
    this.setState({sideProps, isLoading : false})
  }

  setTubClickable(){
    let {tubProps, sideProps, turn} = this.state
    const {pickable} = this.props.settings

    sideProps[turn].tubsClickable = true
    if (pickable) sideProps[!turn + 0].tubsClickable = true
    this.tree && this.tree.focus([turn + '', '1'])
    tubProps = tubProps.map((side)=>{
      return side.map((tub)=>{
        return {...tub, scoreMemo : null, oldScore : tub.score}
      })
    })
    this.setState({tubProps, sideProps})
  }

  clearClickable(){
    let {sideProps, tubProps} = this.state
    sideProps[0].tubsClickable = false
    sideProps[1].tubsClickable = false
    tubProps = tubProps.map((side)=>{
      return side.map((tub)=>{
        return {...tub, scoreMemo : null}
      })
    })
    this.setState({sideProps, tubProps})
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
        return this.updateCurrSide({newDice:null}, {diceMatrix}, ()=>{
          resolve(num)
        })
      }
      if (srcPos) this.setState({diceMatrix})
    })

  }

  async proccessTurn(tub, turn = this.state.turn, memo = this.fetchMemo(turn, tub)){
    console.log(this.state.sideProps[1].name, memo)
    if (this.gameType === GameType.ONLINE && this.state.turn){
      this.server.send({num : this.state.sideProps[this.state.turn].newDice.num, tub, side : !turn + 0, memo : flipScoreObj(memo)})
    }
    console.log(this.state.sideProps[1].name, memo)
    // console.log(this.state.sideProps[1].name, memo)
    this.clearClickable()
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

    this.gameType !== GameType.DEFAULT && statUpdate(time, winnerInd, scoreList, clearList, destroyedList, destroyedMaxTurnList, this.gameType)
  }

  showFlytext(text, timeOut=-1, delay=-1){
    const flytextProps = this.state.flytextProps
    flytextProps.message = text
    flytextProps.timeOut = timeOut
    flytextProps.display = true
    if (timeOut <= 0) {
      this.setState({flytextProps}, ()=>setTimeout(
        ()=>this.setState(
          {flytextProps : {...flytextProps, show : true}}
        ), 100
      ))
    } else {
      if (delay <= 0) delay = timeOut
      return new Promise((resolve)=>
        this.setState({flytextProps}, ()=>setTimeout(
          ()=>this.setState({flytextProps : {...flytextProps, show : true}}, ()=>setTimeout(
            ()=>{
              flytextProps.show = false
              flytextProps.slideEnd = () => {
                resolve()
                flytextProps.display = false
                flytextProps.slideEnd = ()=>{}
                this.setState({flytextProps})
              }
              this.setState({flytextProps})
            }, timeOut))
        , 10))
      )
    }
  }

  async restart(){
    let turn = randomInRange(2)
    const flytextProps = this.state.flytextProps
    if (this.gameType === GameType.ONLINE){
      flytextProps.hover = true
      flytextProps.buttons[0].onClick = ()=>{}
      this.setState({flytextProps,isLoading : true})
      if(this.server.isHost){
        this.server.send(!turn + 0)
        await this.server.recv()
      } else {
        turn = await this.server.recv()
        this.server.send('restart')
      }
      flytextProps.hover = false
    }

    const diceMatrix = Array.from({length:2}, ()=>(
      Array.from({length:this.props.settings.numTubs},()=>(Array(this.props.settings.tubLen).fill(null))))
    )

    let {tubProps, sideProps} = this.state
    sideProps = sideProps.map((side)=>({...side, score : 0, destroyed : 0, destroyedTurn : 0, cleared : 0, prevDiceNum : 0, scoreShown : false, lives: side.maxLives}))
    tubProps = tubProps.map((side)=>(side.map((tub)=>({...tub, score : null}))))

    flytextProps.show = false
    flytextProps.slideEnd = ()=>{
      flytextProps.slideEnd = ()=>{}
      flytextProps.buttons[0].onClick = this.restart
      flytextProps.display = false
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
      return memo.scores[turn].reduce((part, a) => this.scoreReduce(part, a, caravan), 0)
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
        if (!destAll) {
          promises = [this.updateScore(tub, turn, memo)]
        }
        diceLost.forEach((s,si)=>{
          s.forEach(i=>{
            if (tub !== i || turn !== si) promises.push(this.updateScore(i, si, memo));
          })
        })
        Promise.all(promises).then(async ()=>{
          diceMatrix = this.state.diceMatrix
          for(let i = 0; i < diceLost.length; i++) {
            for(const j of diceLost[i]){
              let freePos = 0
              for(let k = 0; k < diceMatrix[i][j].length; k++) {
                const dice = diceMatrix[i][j][k]
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
    const {diceMatrix, sideProps} = this.state
    const oppTurn = !turn + 0
    let destroyed = 0;
    const fLen = defLength(diceMatrix[oppTurn][tub])
    for (let i = 0; i < fLen; i++) {
      const oppDice = diceMatrix[oppTurn][tub][i]
      if (num === oppDice.num){
        destroyed++
        oppDice.shrink = true
        await new Promise((resolve)=>{
          oppDice.onShrinkEnd = ()=>{
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
          dice.match = 'match-all';
          break;
        case this.props.settings.tubLen - 1:
          dice.match = 'match';
          break;
        default:
          dice.match = '';
          break;
      }
      if (!scoreMemo) {
        newScore += dice.num * numMatch
      }
    }
    if (scoreMemo) {
      newScore = scoreMemo.scores[turn][i]
    }
    this.setState({diceMatrix, tubProps})
    return this.handleScoreHover(newScore,turn,i,true)
  }

  handleScoreHover(newScore,side,tub,isHover){
    const tubProps = this.state.tubProps
    if (!isHover) {
      newScore = tubProps[side][tub].oldScore
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
            tubProp.scoreScale = '0'
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
    let { tubProps } = this.state
    if (!tubProps[i][j].scoreMemo) {
      const {diceMatrix, turn, sideProps} = this.state
      const settings = this.props.settings
      const newDiceNum = sideProps[turn].newDice.num
      const numMat = convertToNumMat(diceMatrix);
      tubProps[i][j].scoreMemo = scoreAll(newDiceNum, numMat, turn, { side: i, tub: j }, settings, true);
      this.setState({tubProps})
    }
    return tubProps[i][j].scoreMemo
  }

  scoreHover(isHover,i,j){
    let {diceMatrix, tubProps} = this.state
    if (isFull(diceMatrix[i][j])) return
    const memo = this.fetchMemo(i, j);
    const {scores, removedAt} = memo

    removedAt.forEach(t=>{
      diceMatrix[t.s][t.t][t.d].shrinkPreview = isHover
    })

    this.setState({diceMatrix, tubProps},()=>{
      scores.forEach((s,si)=>{
        s.forEach((newScore,ti)=>{
          this.handleScoreHover(newScore,si,ti,isHover)
        })
      })
    })
  }

  proccessClick(tub, turn = this.state.turn){
    if (isFull(this.state.diceMatrix[turn][tub])) {
      let tubProps = this.state.tubProps.slice()
      tubProps[turn][tub].startShake = true
      this.setState({tubProps})
    } else {
      if (this.props.settings.time) {
        clearInterval(this.timeInterval)
        const {sideProps, turn} = this.state
        sideProps[turn].time = -1
        this.setState(sideProps)
      }
      this.proccessTurn(tub, turn)
    }
  }

  return() {
    const {flytextProps} = this.state
    flytextProps.show = false
    this.setState({flytextProps})
    if (this.props.settings.time) {
      clearInterval(this.timeInterval)
    }
    this.clearClickable()
    this.props.return()
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
    this.setState(prevState => {
      prevState.sideProps = prevState.sideProps.map(s=>{
        if (!s.tubsRef.current) return s
        const {height, width} = eleDimensions(s.tubsRef.current)
        s.maxWidth = tubBoxWidth(height / width, this.tubBoxAspect)
        if (s.newDice) {
          s.newDice.height = this.boxMin() * scale
        }
        return s
      })
      return prevState
    })
  }

  onKeyUp(e){
    if (e.key === 'f') {
      this.return()
    }
  }

  blockingFunc(key, navTree, focusedNode) {
    const {turn, sideProps} = this.state
    if (!navTree.focusedNode && sideProps[turn].tubsClickable) {
      return '' + turn
    }
    let next = navDynamic(key, navTree, focusedNode)
    if (next !== '0' && next !== '1') {
      return next
    }
    const [oCLickable, pCLickable] = sideProps.map(s=>s.tubsClickable)
    if ((next === '0' && !oCLickable) || (next === '1' && !pCLickable)) {
      navTree.focus(navTree.getFocusedPath())
    } else if (next && next !== navTree.focusedNode) {
      navTree.focus([next, navTree.getFocusedPath().at(-1)])
    }
  }

  componentDidMount(){
    this.onResize()
    window.addEventListener("resize", this.onResize)
    window.addEventListener("keyup", this.onKeyUp)
  }

  componentWillUnmount(){
    window.removeEventListener("resize", this.onResize)
    window.removeEventListener("keyup", this.onKeyUp)
  }

  renderSide(side){
    return (<Side
      {...this.state.sideProps[side]}
      tubProps={this.state.tubProps[side]}
      diceMatrix={this.state.diceMatrix[side]}
      turn={this.state.turn}
      rolled={this.state.rolled}
      slid={this.state.slid}
      hasSlid={this.gameStart}
      proccessClick={this.proccessClick}
      onShakeAnimEnd={this.onShakeAnimEnd}
      onSideScoreAnimEnd={() => this.onSideScoreAnimEnd(side)}
      id={side}
    />)
  }

  render(){
    // const {ignoreFull, pickable, caravan} = this.props.settings
    // const isPVP = this.gameType === GameType.ONLINE
    const {flytextProps, isLoading, turnCount} = this.state,
      {turnLimit} = this.props.settings,
      turnRatio = turnLimit ? turnCount / turnLimit * 100 : 0
    return (
      <Nav className="game" func={(key, ...rest) => {
        if (key === 'enter') {
          return navDynamic(key, ...rest)
        } else {
          return this.blockingFunc(key, ...rest)
        }
      }} ref={(nav) => {
        this.tree = nav && nav.tree
      }}>
        {this.renderSide(0)}
        {this.renderSide(1)}
        {flytextProps.display && <Flytext {...flytextProps}/>}
        {isLoading && <Loading/>}
        {turnLimit &&
          <div className="turnCounter" style={{background : `linear-gradient(0deg, #BB0011 0%, #BB0011 ${turnRatio - 1}%, black ${turnRatio}%, black 100%)`}}>
            <p>{Math.ceil(turnCount)}</p>
            <p>turns left</p>
          </div>
        }
        {/* <div className="settingsInfo">
          {`${ignoreFull && isPVP && 'Longplay, ' || ''}${pickable && isPVP && 'Sabotage, ' || ''}${!!caravan && `Caravan ${caravan}` || ''}`}
        </div> */}
      </Nav>
    )
  }
}

Game.propTypes = {
  settings: PropTypes.shape({
    time: PropTypes.number,
    turn: PropTypes.number,
    turnLimit: PropTypes.number,
    ignoreFull: PropTypes.bool,
    pickable: PropTypes.bool,
    caravan: PropTypes.arrayOf(PropTypes.number),
    tubLen: PropTypes.number,
    numTubs: PropTypes.number,
    oppProfileInd: PropTypes.number,
    playProfileInd: PropTypes.number,
    oppName: PropTypes.string,
    name: PropTypes.string,
    preview: PropTypes.bool,
    diceColor: PropTypes.arrayOf(PropTypes.string),
    diceBorder: PropTypes.arrayOf(PropTypes.string),
    pipColor: PropTypes.arrayOf(PropTypes.string),
  }),
  return: PropTypes.func.isRequired,
  statUpdate: PropTypes.func.isRequired,
  params: PropTypes.object,
}

export default withParams(Game)