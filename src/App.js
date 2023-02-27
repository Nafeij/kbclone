/* eslint react/prop-types: 0 */

import React from 'react'
import Nav, {navVertical} from 'react-navtree'
import Cookies from 'universal-cookie'

import CharSelect from './components/CharSelect.js'
import ServerSetup from './components/ServerSetup.js'
import Server from './util/Server.js'
import Game from './components/Game.js'
import HowTo from './components/HowTo.js'
import Profile from './util/Profile.js'
import { caravanBounds, randomInRange, strictMod } from './util/Utils.js'
import Flytext from './components/Flytext.js'
import Loading from './components/Loading.js'
import Settings from './components/Settings.js'
import KButton from './components/KButton.js'

import fkey from "./img/fkey.png"
import akey from "./img/akey.png"
import dkey from "./img/dkey.png"
import logo from "./img/logo.png"

const MainMenu = (props) => (
  <div className={`menu fadeable ${props.fadeAway ? 'hide' : ''}`} style={{pointerEvents: props.pointerEvents}} onTransitionEnd={
    () => ( props.fadeAway ?  props.onFadeOut() : props.onFadeIn() ) }>
    <div className='menubox'>
      <div className='title' style={{backgroundImage: `url(${logo})`}}/>
      <div className='text'>Based on the dice game of risk and reward from Cult of the Lamb</div>
      {props.buttons.map((btn,i)=>(
        <div key={i}>
          <KButton defaultFocused={i === 0} text={btn.text} navId={`mainButton ${i}`} onClick={btn.onClick} hasSpacer={i === 0} />
        </div>
      ))}
    </div>
  </div>
)

class App extends React.Component{

  constructor(props){
    super(props)
    this.server = new Server()
    this.cookies = new Cookies()
    this.maxAge = 60 * 60 * 24 * 365 * 100
    this.state = {
      menuProps:{
        fadeAway: false ,
        show: true,
        onFadeOut: ()=>{
          let {menuProps} = this.state
          menuProps.show = false
          this.setState({menuProps})
        },
        onFadeIn: ()=>{
          this.setState({
            htProps : null,
            gameProps : null,
            charSelectProps : null,
            serverSetupProps : null,
            settingsProps : null,
            settingChanged : false
          })
        },
        buttons: [
          {
            text : 'Play',
            onClick: () => {
              this.startGame()
            }
          },
          {
            text : 'Play with the Shack',
            onClick: () => {
              this.startCharacterSelect()
            },
          },
          {
            text : 'Play with a Friend',
            onClick: () => {
              this.startServerSetup()
            },
          },
          {
            text : 'Settings',
            onClick: () => {
              this.startSettings()
            },
          },
          {
            text : 'How to Play',
            onClick: () => {
              this.startHt()
            },
          }
        ]
      },
      htProps : null,
      gameProps : null,
      charSelectProps : null,
      serverSetupProps: null,
      settingsProps : null,
      flytextProps: null,
      selectedAIInd : 0,
      next: null,
      roomID : '',
      isLoading : false,
      settingChanged : false,
      gameSettingsProps : this.cookies.get('gameSettingsProps') || {
        tubLen : 3,
        numTubs : 3,
        diceColor : ['#f4ebce','#f4ebce'],
        diceBorder : ['#d7cbb3', '#d7cbb3'],
        pipColor : ['#382020','#382020'],
        // time : 120
        time : null,
        pickable : false,
        ignoreFull : false,
        preview : false,
        // caravan : [10,18]
        caravan : null,
        turnLimit : null,
        playProfileInd : 0,
        oppProfileInd : 0,
        name : Profile.cosm[0].name,
        oppName : Profile.cosm[0].name,
        gameType : 'DEFAULT'
      },
      settingsRanges : {
        time : {rcursor : 0, range : [null, 1, 5, 10, 20, 30, 60]},
        turnLimit : {rcursor : 0, range : [null, 5, 10, 25, 50, 100, 200, 500]}
      },
      statsProps : this.cookies.get('statsProps') || {
        aggregate : Array(2).fill().map(()=>({
          closestWin : {p : null, o : null},
          numDestroyed : null,
          mostDestroyed : null,
          mostDestroyedTurn : null,
          numClears : null,
          mostClears : null,
          fastestWinTime : null,
        })),
        aiBreakdown : Profile.ai.map((_,i)=>({profileInd : i, nGames : 0,
          sideBreakdown : Array(2).fill().map(()=>({
            nWins : null,
            highestScore : null,
          }))
        , time : 0})),
        pvpBreakdown : {profileInd : null, name : null, nGames : 0,
          sideBreakdown : Array(2).fill().map(()=>({
            nWins : null,
            highestScore : null
          }))
        , time : 0}
      }
      , navEnabled : true
    }
    this.return = this.return.bind(this)
    this.setNavigable = this.setNavigable.bind(this)
    this.setUnNavigable = this.setUnNavigable.bind(this)
    this.navigate = this.navigate.bind(this)
  }

  statUpdate(time, winnerInd, scoreList, clearList, destroyedList, destroyedMaxTurnList){
    let {statsProps, gameSettingsProps} = this.state
    statsProps.aggregate = statsProps.aggregate.map((side,i)=>{
      side.numDestroyed += destroyedList[i]
      side.mostDestroyed = Math.max(destroyedList[i], side.mostDestroyed)
      side.mostDestroyedTurn = Math.max(destroyedMaxTurnList[i], side.mostDestroyedTurn)
      side.numClears += clearList[i]
      side.mostClears = Math.max(clearList[i], side.mostClears)
      if (i === winnerInd){
        side.fastestWinTime = side.fastestWinTime !== null ? Math.min(side.fastestWinTime, time) : time
        if (!gameSettingsProps.caravan){
          const margin = side.closestWin.p / side.closestWin.o
          const marginNew = scoreList[winnerInd] / scoreList[!winnerInd + 0]
          if (!side.closestWin.p || marginNew < margin) {
            side.closestWin.p = scoreList[winnerInd]
            side.closestWin.o = scoreList[!winnerInd + 0]
          }
        }
      }
      return side
    })

    let focusBreakdown
    if (gameSettingsProps.gameType === 'AI'){
      focusBreakdown = statsProps.aiBreakdown[gameSettingsProps.oppProfileInd]
    } else {
      focusBreakdown = statsProps.pvpBreakdown
      focusBreakdown.profileInd = gameSettingsProps.oppProfileInd
      focusBreakdown.name = gameSettingsProps.oppName
    }
    focusBreakdown.nGames++
    focusBreakdown.time += time
    focusBreakdown.sideBreakdown = focusBreakdown.sideBreakdown.map((side,i)=>{
      if (!gameSettingsProps.caravan) side.highestScore = Math.max(scoreList[i], side.highestScore)
      return side
    })
    if (winnerInd !== -1){
      focusBreakdown.sideBreakdown[winnerInd].nWins++
    }
    this.cookies.set('statsProps', statsProps, { path: '/', maxAge: this.maxAge, sameSite : 'strict'});
    this.setState({statsProps})
  }

  startGame(){
    // this.cookies.set('statsProps', {a:1}, { path: '/', maxAge: this.maxAge, sameSite : 'strict'});
    //console.log('test')
    let {menuProps, gameProps, gameSettingsProps} = this.state
    gameSettingsProps.oppName = gameSettingsProps.name
    gameSettingsProps.oppProfileInd = gameSettingsProps.playProfileInd
    gameSettingsProps.gameType ='DEFAULT'
    gameProps = {settings : gameSettingsProps,
      return : this.return,
      statUpdate : ()=>{}
    }
    menuProps.fadeAway = true
    this.setState({gameProps, menuProps})
  }

  startHt(){
    let {menuProps, htProps} = this.state
    htProps = {
      onClick: this.return
    }
    menuProps.fadeAway = true
    this.setState({menuProps, htProps})
  }

  cycleSetting(propsName,settingName,change,clamp){
    const sprops = this.state[propsName]
    sprops[settingName] = (sprops[settingName] + change + clamp) % clamp
    this.setState({propsName: sprops})
    return sprops[settingName]
  }

  startSettings(){
    let {menuProps, settingsProps} = this.state

    settingsProps = {
      modVal : (setting,val)=>{
        const gameSettingsProps = this.state.gameSettingsProps
        gameSettingsProps[setting] = val
        this.setState({gameSettingsProps, settingChanged : true})
      },
      mod : (setting,i)=>{
        const gameSettingsProps = this.state.gameSettingsProps
        gameSettingsProps[setting] = gameSettingsProps[setting] + i
        this.setState({gameSettingsProps, settingChanged : true})
      },
      modDscrt : (setting,i)=>{
        const {gameSettingsProps, settingsRanges} = this.state
        const rcursor = settingsRanges[setting].range.indexOf(gameSettingsProps[setting])
        if ((rcursor === 0 && i < 0) || (rcursor === settingsRanges[setting].range.length -1 && i > 0 )) return
        settingsRanges[setting].rcursor = rcursor + i
        gameSettingsProps[setting] = settingsRanges[setting].range[settingsRanges[setting].rcursor]
        this.setState({gameSettingsProps, settingsRanges, settingChanged : true})
      },
      modBool : (setting)=>{
        const gameSettingsProps = this.state.gameSettingsProps
        gameSettingsProps[setting] = !gameSettingsProps[setting]
        this.setState({gameSettingsProps, settingChanged : true})
      },
      modSpec : (setting)=>{
        if (setting === 'caravan') {
          const {gameSettingsProps} = this.state
          if (gameSettingsProps.caravan) {
            gameSettingsProps.caravan = null
          }
          else {
            gameSettingsProps.caravan = caravanBounds(gameSettingsProps.tubLen)
          }
          this.setState({gameSettingsProps, settingChanged : true})
          //console.log(gameSettingsProps.caravan)
        }
      },
      modColor : (setting,side,color)=>{
        const gameSettingsProps = this.state.gameSettingsProps
        gameSettingsProps[setting][side] = color
        this.setState({gameSettingsProps, settingChanged : true})
      },
      setProfileInd : (i)=>this.setProfileInd(i),
      buttons: [
        {
          text : 'Go Back',
          onClick: () => {
            const {gameSettingsProps} = this.state
            if (gameSettingsProps.caravan){
              gameSettingsProps.caravan = caravanBounds(gameSettingsProps.tubLen)
            }
            this.cookies.set('gameSettingsProps', gameSettingsProps, { path: '/', maxAge: this.maxAge, sameSite : 'strict' });
            this.setState({gameSettingsProps},this.return)
          },
          enabled : true
        },
        {
          text : 'Choose Form',
          onClick: () => {
            const {settingsProps} = this.state
            settingsProps.showProfiles = !settingsProps.showProfiles
            this.setState({settingsProps})
          },
          enabled : true
        }
      ],
      showProfiles : false,
      tabs : ['gameplay', 'personal'],
      activeTab : 0,
      switchTab : (destTab)=>{
        const settingsProps = this.state.settingsProps
        if (settingsProps.showProfiles){
          settingsProps.buttons[1].onClick()
        }
        settingsProps.activeTab = destTab
        this.setState({settingsProps})
      }
    }
    menuProps.fadeAway = true
    this.setState({menuProps, settingsProps})
  }

  setProfileInd(i){
    const gameSettingsProps = this.state.gameSettingsProps
    gameSettingsProps.name = Profile.cosm[i].name
    gameSettingsProps.playProfileInd = i
    this.cookies.set('gameSettingsProps', gameSettingsProps, { path: '/', maxAge: this.maxAge, sameSite : 'strict' });
    this.setState({gameSettingsProps})
  }

  startCharacterSelect(){
    let {menuProps, charSelectProps} = this.state
    charSelectProps = {
      buttons: [
        {
          onClick: () => {
            this.startAIGame()
          },
        },
        {
          text : 'Go Back',
          onClick: this.return
        },
      ],
      modAIInd : (i)=>this.modAIInd(i),
      modSetAIInd: (i)=>this.modSetAIInd(i),
      fadeAway : false,
      hasWrapped: false,
      onFade : ()=>{}
    }
    menuProps.fadeAway = true
    this.setState({menuProps, charSelectProps})
  }

  modAIInd(i){
    const pLength = Profile.ai.length,
      {charSelectProps, selectedAIInd} = this.state,
      newInd = selectedAIInd + i,
      inbounds = (0 <= newInd && newInd <= pLength-1)
    // console.log(this.state.selectedAIInd)
    // if ((this.state.selectedAIInd > 0 && i === -1)
    //   || (this.state.selectedAIInd < pLength - 1 && i === 1)) {
    //     this.setState((prevstate)=>({selectedAIInd : prevstate.selectedAIInd + i}))
    //   }
    // else this.shakeSelect()
    charSelectProps.hasWrapped ^= !inbounds
    this.setState({selectedAIInd : strictMod(newInd, pLength), charSelectProps,})
  }

  modSetAIInd(i){
    const pLength = Profile.ai.length
    if (i > 0.5/pLength || i <= -1){ return }
    const selectedAIInd = Math.round((pLength * -i)%(pLength-0.5))
    if (selectedAIInd !== this.state.selectedAIInd){
      this.setState({selectedAIInd})
    }
  }

  showFlytext(text){
    const flytextProps = {
      message : text,
      show : true,
      timeOut : 1,
    }
    this.setState({flytextProps})
    setTimeout(()=>{
      flytextProps.show = false
      flytextProps.slideEnd = () => {
        this.setState({flytextProps : null})
      }
      this.setState({flytextProps})
    }, 2000)
  }

  startServerSetup(){
    let {menuProps, serverSetupProps} = this.state
    serverSetupProps = {
      buttons: [
        {
          text : 'Go Back',
          onClick: () => {
            this.server.close()
            this.return()
          },
          enabled : true
        },
        {
          text : 'Choose Form',
          onClick: () => {
            const {serverSetupProps} = this.state
            const toggle = serverSetupProps.showProfiles
            serverSetupProps.showProfiles = !toggle
            serverSetupProps.buttons[2].enabled = toggle
            serverSetupProps.buttons[3].enabled = toggle
            if (serverSetupProps.showProfiles) {
              serverSetupProps.buttons[1].text = 'Done'
            } else {
              serverSetupProps.buttons[1].text = 'Choose Form'
            }
            this.setState({serverSetupProps})
          },
          enabled : true
        },
        {
          text : 'Create Room',
          onClick: () => {
            this.startRoom()
          },
          enabled : true
        },
        {
          text : 'Join Room',
          onClick: () => {
            this.joinRoom()
          },
          enabled : true
        }
      ],
      lock : false,
      shake : false,
      onShakeDone : ()=>{},
      fadeAway : false,
      showProfiles : false,
      onFade : ()=>{},
      setUsername : (evt)=>{
        const gameSettingsProps = this.state.gameSettingsProps
        gameSettingsProps.name = evt.target.value
        this.setState({gameSettingsProps})
      },
      setID : (evt)=>{
        const id = evt.target.value.toUpperCase()
        this.setState({roomID : id})
      },
      setProfileInd : (i)=>this.setProfileInd(i)
    }
    menuProps.fadeAway = true
    this.setState({menuProps, serverSetupProps})
  }

  startRoom(){
    let {gameSettingsProps, serverSetupProps} = this.state
    let username = gameSettingsProps.name
    if (!username.length){
      username = 'Player 1'
    }
    serverSetupProps.lock = true
    const baseText = 'Waiting'
    let count = 1
    serverSetupProps.buttons[2].text = baseText
    const interval = setInterval(()=>{
      serverSetupProps.buttons[2].text = baseText + ('.'.repeat(count))
      this.setState({serverSetupProps})
      count = (count + 1) % 4
    },1000)
    serverSetupProps.buttons[0].onClick = ()=>{
      this.setState({isLoading : false})
      clearInterval(interval)
      this.server.close()
      this.return()
    }

    if (this.server.peer) this.server.close()
    const roomID = this.server.createRoom(()=>{
      clearInterval(interval)
      this.startPVPGame(username)
    }, ()=>{
      this.setState({isLoading : false})
      this.server.close()
      //console.log('other closed')
      clearInterval(interval)
      this.return()
      this.showFlytext("Player Disconnected")
    }, (e)=>{
      console.log(e)
      this.setState({isLoading : false})
      this.server.close()
      clearInterval(interval)
      this.showFlytext("Connection Failed")
      this.shakeServer()
    })
    navigator.clipboard.writeText(roomID)
    this.setState({serverSetupProps, username, roomID, isLoading : true})
  }

  joinRoom(){
    const pattern = /[A-Z]{4}/
    let {gameSettingsProps, roomID} = this.state
    let username = gameSettingsProps.name
    if (!roomID || !pattern.test(roomID)) {
      // console.log(pattern.test(roomID))
      this.shakeServer()
      return
    }
    roomID = roomID.match(pattern)[0]
    if (!username.length) username = 'Player 2'
    this.setState({username, roomID})
    if (this.server.peer) this.server.close()
    this.setState({isLoading : true})
    this.server.connectRoom(roomID, ()=>{
      this.startPVPGame(username)
    }, ()=>{
      this.server.close()
      this.setState({isLoading : false})
      //console.log('other closed')
      this.return()
      this.showFlytext("Player Disconnected")
    }, (e)=>{
      console.log(e)
      this.setState({isLoading : false})
      this.server.close()
      this.showFlytext("Connection Failed")
      this.shakeServer()
    })
  }


  async startPVPGame(name){
    // console.log(' Player: ' + name + ' Opponent: ' + oppName)
    let turn, gameSettingsProps = this.state.gameSettingsProps
    const playProfileInd =  gameSettingsProps.playProfileInd
    if(this.server.isHost){
      turn = randomInRange(2)
      this.server.send({
        name,
        turn : !turn + 0,
        gameSettingsProps,
        oppProfileInd : playProfileInd})
      let init = await this.server.recv()
      gameSettingsProps.oppProfileInd = init.oppProfileInd
      gameSettingsProps.oppName = init.name
      //console.log('host turn ' + turn)
    } else {
      this.server.send({name, oppProfileInd : playProfileInd})
      let init = await this.server.recv()
      turn = init.turn
      const {diceColor, diceBorder, pipColor} = gameSettingsProps
      gameSettingsProps = {
        ...init.gameSettingsProps,
        diceColor, diceBorder, pipColor,
        name : gameSettingsProps.name,
        playProfileInd : gameSettingsProps.playProfileInd,
        oppName : init.name,
        oppProfileInd : init.oppProfileInd
      }
    }
    let {gameProps, serverSetupProps} = this.state
    gameSettingsProps.gameType = 'PVP'
    gameProps = {settings : gameSettingsProps,
      turn,
      return : ()=> {
        this.server.close()
        this.return()
      },
      statUpdate : (...args)=>{this.statUpdate(...args)}
    }
    serverSetupProps.fadeAway = true
    serverSetupProps.onFade = ()=>{
      serverSetupProps = null
      this.setState({serverSetupProps})
    }
    this.setState({gameProps, serverSetupProps, gameSettingsProps, isLoading : false})
  }

  shakeServer(){
    const serverSetupProps = this.state.serverSetupProps
    serverSetupProps.shake = true
    serverSetupProps.onShakeDone = ()=>{
      serverSetupProps.shake = false
      serverSetupProps.onShakeDone = ()=>{}
      this.setState({serverSetupProps})
    }
    this.setState({serverSetupProps})
  }

  shakeSelect(){
    const charSelectProps = this.state.charSelectProps
    charSelectProps.shakeSelect = true
    charSelectProps.onShakeDone = ()=>{
      charSelectProps.shakeSelect = false
      charSelectProps.onShakeDone = ()=>{}
      this.setState({charSelectProps})
    }
    this.setState({charSelectProps})
  }

  startAIGame(){
    let {gameProps, charSelectProps, gameSettingsProps} = this.state
    gameSettingsProps.oppProfileInd = this.state.selectedAIInd
    gameSettingsProps.oppName = Profile.ai[this.state.selectedAIInd].name
    gameSettingsProps.gameType = 'AI'
    gameProps = {
      settings : gameSettingsProps,
      statUpdate : (...args)=>{this.statUpdate(...args)},
      return : this.return,
    }
    charSelectProps.fadeAway = true
    charSelectProps.onFade = ()=>{
      charSelectProps = null
      this.setState({charSelectProps})
    }
    this.setState({gameProps, charSelectProps})
  }

  return(){
    let {menuProps} = this.state
    menuProps.show = true
    menuProps.fadeAway = true
    this.setState({menuProps},() => {
      setTimeout(()=>{
        menuProps.fadeAway = false
        this.setState({menuProps})
      }, 10)
    })
  }

  setNavigable(e){
    const {navEnabled} = this.state
    if (!navEnabled) {
      // We consume the event on nav context switch to prevent unintended selection
      this.setState({navEnabled : true})
      return
    }
    this.navigate(e)
  }

  setUnNavigable(){
    this.setState({navEnabled : false})
  }

  navigate(e){
    let key
    switch (e.key) {
      case "ArrowDown":
        key = 'down'; break
      case "ArrowUp":
        key = 'up'; break
      case "ArrowLeft":
        key = 'left'; break
      case "ArrowRight":
        key = 'right'; break
      case "Enter":
      case "e":
      case " ":
        key = 'enter'; break
      default:
    }
    if (key) {
      e.preventDefault()
      this.props.tree.resolve(key)
      //console.log(this.props.tree.getFocusedPath())
    }
  }

  componentDidMount(){
    window.addEventListener('pointermove', this.setUnNavigable)
    window.addEventListener('keydown', this.setNavigable)
  }

  componentWillUnmount(){
    this.server.close()
    window.removeEventListener('pointermove', this.setUnNavigable)
    window.removeEventListener('keydown', this.setNavigable)
  }

  render(){
    const {flytextProps,isLoading,gameProps,settingsProps,gameSettingsProps,statsProps,
      settingsRanges, settingChanged, serverSetupProps, roomID, charSelectProps,
      selectedAIInd, htProps, menuProps, navEnabled} = this.state
    return (
      <Nav id='app' tree={this.props.tree} className={navEnabled ? 'navigable' : null} func={navVertical}>
        {(flytextProps) ? <Flytext {...flytextProps} /> : null}
        <Loading show={isLoading}/>
        <div className='footer'>
          <div className="fcontain mobile" style={{display : gameProps ? 'flex' : 'none'}} onClick={this.return}>
            <div className="symb backSymb" style={{backgroundImage: `url(${fkey})`}}/><div className="text">Back</div>
          </div>
          <div className="fcontain">
            <div className="symb" style={{backgroundImage: `url(${akey})`}}/><div className="text">Navigate</div>
          </div>
          <div className="fcontain" style={{display : charSelectProps ? 'flex' : 'none'}}>
            <div className="symb dragSymb" style={{backgroundImage: `url(${dkey})`}}/><div className="text">Drag</div>
          </div>
        </div>
        {settingsProps ? <Settings {...settingsProps} gameSettingsProps={gameSettingsProps} statsProps={statsProps} settingsRanges={settingsRanges} settingChanged={settingChanged} playProfileInd={gameSettingsProps.playProfileInd}/> : null}
        {gameProps ? <Game {...gameProps}/> : null}
        {serverSetupProps ? <ServerSetup {...serverSetupProps} name={gameSettingsProps.name} playProfileInd={gameSettingsProps.playProfileInd} roomID={roomID}/> : null}
        {charSelectProps ? <CharSelect {...charSelectProps} selectedAIInd={selectedAIInd}/> : null}
        {htProps ? <HowTo {...htProps}/> : null}
        {menuProps.show ? <MainMenu {...menuProps}/> : null}
      </Nav>
    )
  }
}

export default App
