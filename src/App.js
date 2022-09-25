/* eslint react/prop-types: 0 */

import React from 'react'
import CharSelect from './components/CharSelect.js'
import ServerSetup from './components/ServerSetup.js'
import Server from './util/Server.js'
import Game from './components/Game.js'
import HowTo from './components/HowTo.js'
import KeyManager from './util/KeyManager.js'
import Profile from './util/Profile.js'
import { caravanBounds, randomInRange } from './util/utils.js'
import Flytext from './components/Flytext.js'
import fkey from "./img/fkey.png"
import akey from "./img/akey.png"
import Loading from './components/Loading.js'
import Settings from './components/Settings.js'
import Cookies from 'universal-cookie'
import logo from "./img/logo.png"

function Menu (props) {

  const button = (i)=>(
    <div key={i} className={`kbutton ${i === 0 ? 'space' : ''} ${props.buttons[i].cursorID === props.cursor ? 'hovering' : ''}`} onClick={() => props.buttons[i].onClick()}>{props.buttons[i].text}</div>
  )

  return (<div className={`menu fadeable ${props.fadeAway ? 'hide' : ''}`} style={{pointerEvents: props.pointerEvents}} onTransitionEnd={props.onFade}>
    <div className='menubox'>
      <div className='title' style={{backgroundImage: `url(${logo})`}}/>
      <div className='text'>Based on the dice game of risk and reward from Cult of the Lamb</div>
      {Array(props.buttons.length).fill().map((_,i)=>button(i))}
    </div>
  </div>)
}

class App extends React.Component{

  constructor(props){
    super(props)
    this.keyManager = new KeyManager()
    this.server = new Server()
    this.cookies = new Cookies()
    this.maxAge = 60 * 60 * 24 * 365 * 100
    this.state = {
      menuProps:{
        pointerEvents: 'auto',
        fadeAway: false ,
        onFade: ()=>{},
        // disable: () => {this.disable()},
        buttons: [
          {
            text : 'Play',
            cursorID: -1,
            onClick: () => {
              this.startGame()
            },
          },
          {
            text : 'Play with the Shack',
            cursorID: -1,
            onClick: () => {
              this.startCharacterSelect()
            },
          },
          {
            text : 'Play with a Friend',
            cursorID: -1,
            onClick: () => {
              this.startServerSetup()
            },
          },
          {
            text : 'Settings',
            cursorID: -1,
            onClick: () => {
              this.startSettings()
            },
          },
          {
            text : 'How to Play',
            cursorID: -1,
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
      cursor: this.keyManager.cursor,
      // disable: () => {this.disable()},
      next: null,
      roomID : '',
      isLoading : false,
      settingChanged : false,
      gameSettingsProps : this.cookies.get('gameSettingsProps') || {
        tubLen : 3, 
        numTubs : 3, 
        diceColor : ['#f4ebceff','#f4ebceff'],
        diceBorder : ['#d7cbb3ff', '#d7cbb3ff'], 
        pipColor : ['#382020ff','#382020ff'], 
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
    }
    this.keyManager.initCursorUpdate(()=>{
      this.setState({cursor: this.keyManager.cursor})
    })
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
          const margin = side.closestWin.p - side.closestWin.o
          const marginNew = scoreList[winnerInd] - scoreList[!winnerInd + 0]
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

  setButtonsClickable(callback = ()=>{}){
    this.keyManager.clear()
    let menuProps = this.state.menuProps
    menuProps.buttons = menuProps.buttons.map((btn, i)=>{
      this.keyManager.push(i, btn.onClick)
      return {...btn, cursorID : i}
    })
    this.setState({menuProps}, callback)
  }

  clearClickable(){
    this.keyManager.clear()
    this.keyManager.cursor = 0
    let {menuProps, htprops, charSelectProps} = this.state
    charSelectProps.buttons.map((btn)=>({...btn, cursorID : -1}))
    menuProps.buttons = menuProps.buttons.map((btn)=>({...btn, cursorID : -1}))
    htprops.cursorID = -1
    this.setState({menuProps, htprops})
  }

  startGame(){
    // this.cookies.set('statsProps', {a:1}, { path: '/', maxAge: this.maxAge, sameSite : 'strict'});
    // this.clearClickable()
    //console.log('test')
    this.keyManager.clear()
    this.keyManager.returnAction = ()=> this.return()
    let {menuProps, gameProps, gameSettingsProps} = this.state
    gameSettingsProps.oppName = gameSettingsProps.name
    gameSettingsProps.oppProfileInd = gameSettingsProps.playProfileInd
    gameSettingsProps.gameType ='DEFAULT'
    gameProps = {settings : gameSettingsProps,
      return : ()=>this.return(),
      statUpdate : ()=>{}
    }
    menuProps.fadeAway = true
    menuProps.onFade = ()=>{
      menuProps.onFade = ()=>{}
      menuProps.pointerEvents = 'none'
      this.setState({menuProps})
    }
    this.setState({gameProps, menuProps})
  }

  startHt(){
    // this.clearClickable()
    this.keyManager.clear()
    let {menuProps, htProps} = this.state
    menuProps.buttons = menuProps.buttons.map((btn)=>({...btn, cursorID : -1}))
    htProps = {
      cursorID: 0,
      onClick: () => {
        this.return()
      }
    }
    this.keyManager.push(0, htProps.onClick)
    menuProps.fadeAway = true
    menuProps.onFade = ()=>{
      menuProps.onFade = ()=>{}
      menuProps.pointerEvents = 'none'
      this.setState({menuProps})
    }
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
    menuProps.buttons = menuProps.buttons.map((btn)=>({...btn, cursorID : -1}))
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
          if (gameSettingsProps.caravan) gameSettingsProps.caravan = null
          else {
            gameSettingsProps.caravan = caravanBounds(gameSettingsProps.tubLen)
          }
          this.setState({gameSettingsProps, settingChanged : true})
          //console.log(gameSettingsProps.caravan)
        }
      },
      modColor : (setting,side,color)=>{
        const gameSettingsProps = this.state.gameSettingsProps
        const a = ((color.rgb.a * 255) | 1 << 8).toString(16).slice(1)
        gameSettingsProps[setting][side] = color.hex + a
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
            this.keyManager.clear()
            this.keyManager.cursor = 1
            this.keyManager.push(0, settingsProps.buttons[0].onClick)
            this.keyManager.push([-1,0,1], [
              ()=>{},()=>{
                const newTab = this.cycleSetting('settingsProps','activeTab',-1,2)
                this.state.settingsProps.switchTab(newTab)
              },()=>{
                const newTab = this.cycleSetting('settingsProps','activeTab',1,2)
                this.state.settingsProps.switchTab(newTab)
              }])
            if (settingsProps.showProfiles){
              for (let index = 0; index < Math.ceil(Profile.cosm.length / 4); index++) {
                this.keyManager.push([-1,0,1], [()=>{
                  this.setProfileInd((this.keyManager.cursor - 2) * 4 + this.state.settingsProps.pcursor)
                  this.state.settingsProps.buttons[1].onClick()
                }, ()=>{this.cycleSetting('settingsProps','pcursor',-1,4)}, ()=>{this.cycleSetting('settingsProps','pcursor',1,4)}])
              }
            } else {
              this.keyManager.push(0, settingsProps.buttons[1].onClick)
            }
            this.keyManager.push(0, ()=>{})
            this.keyManager.push([-1,0,1], [()=>{},()=>{this.cycleSetting('settingsProps','pcursor',-1,3)},()=>{this.cycleSetting('settingsProps','pcursor',1,3)}])
            this.keyManager.push([-1,0,1], [()=>{},()=>{this.cycleSetting('settingsProps','pcursor',-1,3)},()=>{this.cycleSetting('settingsProps','pcursor',1,3)}])
            this.setState({settingsProps})
          },
          enabled : true
        }
      ],
      showProfiles : false,
      onFocus : ()=>{this.keyManager.enabled = false},
      onBlur : ()=>{this.keyManager.enabled = true},
      pcursor : 0,
      tabs : ['gameplay', 'personal'],
      activeTab : 0,
      switchTab : (destTab)=>{
        const settingsProps = this.state.settingsProps
        settingsProps.activeTab = destTab
        this.keyManager.clear()
        this.keyManager.cursor = 1
        this.keyManager.push(0, settingsProps.buttons[0].onClick)
        this.keyManager.push([-1,0,1], [
          ()=>{},()=>{
            const newTab = this.cycleSetting('settingsProps','activeTab',-1,2)
            this.state.settingsProps.switchTab(newTab)
          },()=>{
            const newTab = this.cycleSetting('settingsProps','activeTab',1,2)
            this.state.settingsProps.switchTab(newTab)
          }])
        if (destTab === 0){
          this.keyManager.push([-1,0,1], 
            [()=>{},()=>{if (this.state.gameSettingsProps.tubLen > 2) settingsProps.mod('tubLen',-1)},
            ()=>{if (this.state.gameSettingsProps.tubLen < 4) settingsProps.mod('tubLen',1)}])
          this.keyManager.push([-1,0,1], [
            ()=>{},()=>{if (this.state.gameSettingsProps.numTubs > 3) settingsProps.mod('numTubs',-1)},
            ()=>{if (this.state.gameSettingsProps.numTubs < 5) settingsProps.mod('numTubs',1)}])
          this.keyManager.push([-1,0,1], [
            ()=>{},()=>{if (this.state.gameSettingsProps.time !== null) settingsProps.modDscrt('time',-1)},
            ()=>{if (this.state.gameSettingsProps.time !== 60) settingsProps.modDscrt('time',1)}])
          this.keyManager.push([-1,0,1], [
            ()=>{},()=>{if (this.state.gameSettingsProps.turnLimit !== null) settingsProps.modDscrt('turnLimit',-1)},
            ()=>{if (this.state.gameSettingsProps.turnLimit !== 500) settingsProps.modDscrt('turnLimit',1)}])
          this.keyManager.push(0, ()=>{settingsProps.modBool('preview')})
          this.keyManager.push(0, ()=>{settingsProps.modBool('ignoreFull')})
          this.keyManager.push(0, ()=>{settingsProps.modBool('pickable')})
          this.keyManager.push(0, ()=>{settingsProps.modSpec('caravan')})
        } else if (destTab === 1) {
          this.keyManager.push(0, ()=>{settingsProps.buttons[1].onClick()})
          this.keyManager.push(0, ()=>{})
          this.keyManager.push([-1,0,1], [()=>{},()=>{this.cycleSetting('settingsProps','pcursor',-1,3)},()=>{this.cycleSetting('settingsProps','pcursor',1,3)}])
          this.keyManager.push([-1,0,1], [()=>{},()=>{this.cycleSetting('settingsProps','pcursor',-1,3)},()=>{this.cycleSetting('settingsProps','pcursor',1,3)}])
        }
        this.setState({settingsProps})
      }
    }
    menuProps.fadeAway = true
    menuProps.onFade = ()=>{
      menuProps.onFade = ()=>{}
      menuProps.pointerEvents = 'none'
      this.setState({menuProps})
    }
    this.setState({menuProps, settingsProps},()=>this.state.settingsProps.switchTab(0))
  }

  setProfileInd(i){
    const gameSettingsProps = this.state.gameSettingsProps
    gameSettingsProps.name = Profile.cosm[i].name
    gameSettingsProps.playProfileInd = i
    this.cookies.set('gameSettingsProps', gameSettingsProps, { path: '/', maxAge: this.maxAge, sameSite : 'strict' });
    this.setState({gameSettingsProps})
  }

  startCharacterSelect(){
    // this.clearClickable()
    this.keyManager.clear()
    let {menuProps, charSelectProps} = this.state
    menuProps.buttons = menuProps.buttons.map((btn)=>({...btn, cursorID : -1}))

    charSelectProps = {
      buttons: [
        {
          cursorID: 0,
          onClick: () => {
            this.startAIGame()
          },
        },
        {
          text : 'Go Back',
          cursorID: 1,
          onClick: () => {
            this.return()
          }
        },
      ],
      modAIInd : (i)=>this.modAIInd(i),
      fadeAway : false,
      onFade : ()=>{}
    }
    this.keyManager.push([-1, 0, 1], [()=>{this.startAIGame()},()=>{this.modAIInd(-1)},()=>{this.modAIInd(1)}])
    this.keyManager.push(1, charSelectProps.buttons[1].onClick)
    menuProps.fadeAway = true
    menuProps.onFade = ()=>{
      menuProps.onFade = ()=>{}
      menuProps.pointerEvents = 'none'
      this.setState({menuProps})
    }
    this.setState({menuProps, charSelectProps})
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
    // this.clearClickable()
    this.keyManager.clear()
    let {menuProps, serverSetupProps} = this.state
    menuProps.buttons = menuProps.buttons.map((btn)=>({...btn, cursorID : -1}))

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
            serverSetupProps.showProfiles = !serverSetupProps.showProfiles
            serverSetupProps.buttons[2].enabled = !serverSetupProps.showProfiles
            serverSetupProps.buttons[3].enabled = !serverSetupProps.showProfiles
            this.keyManager.clear()
            serverSetupProps.buttons.forEach((e,i) => {
              if (e.enabled) this.keyManager.push(i, e.onClick)
            });
            if (serverSetupProps.showProfiles) {
              serverSetupProps.buttons[1].text = 'Done'
              for (let index = 0; index < Math.ceil(Profile.cosm.length / 7); index++) {
                this.keyManager.push([-1,0,1], [()=>{
                  this.setProfileInd((this.keyManager.cursor - 2) * 7 + this.state.serverSetupProps.pcursor)
                  this.state.serverSetupProps.buttons[1].onClick()
                }, ()=>{this.cycleSetting('serverSetupProps','pcursor',-1,7)}, ()=>{this.cycleSetting('serverSetupProps','pcursor',1,7)}])
              }
            }
            else serverSetupProps.buttons[1].text = 'Choose Form'
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
      pcursor : 0,
      onFade : ()=>{},
      onFocus : ()=>{this.keyManager.enabled = false},
      onBlur : ()=>{this.keyManager.enabled = true},
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
    serverSetupProps.buttons.forEach((e,i) => {
      if (e.enabled) this.keyManager.push(i, e.onClick)
    });
    menuProps.fadeAway = true
    menuProps.onFade = ()=>{
      menuProps.onFade = ()=>{}
      menuProps.pointerEvents = 'none'
      this.setState({menuProps})
    }
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
    this.keyManager.clear()
    this.keyManager.push(0, serverSetupProps.buttons[0].onClick)

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
    // this.clearClickable()
    // console.log(' Player: ' + name + ' Opponent: ' + oppName)
    this.keyManager.clear()
    this.keyManager.returnAction = ()=> {
      this.server.close()
      this.return()
    }
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
      serverSetupProps=null
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

  modAIInd(i){
    const pLength = Profile.ai.length
    // console.log(this.state.selectedAIInd)
    if ((this.state.selectedAIInd > 0 && i === -1) || (this.state.selectedAIInd < pLength - 1 && i === 1)) this.setState((prevstate)=>({selectedAIInd : prevstate.selectedAIInd + i}))
    else this.shakeSelect()
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
    // this.clearClickable()
    this.keyManager.clear()
    this.keyManager.returnAction = ()=>this.return()
    let {gameProps, charSelectProps, gameSettingsProps} = this.state
    gameSettingsProps.oppProfileInd = this.state.selectedAIInd
    gameSettingsProps.oppName = Profile.ai[this.state.selectedAIInd].name
    gameSettingsProps.gameType = 'AI'
    gameProps = {
      settings : gameSettingsProps,
      statUpdate : (...args)=>{this.statUpdate(...args)},
      return : ()=>this.return(),
    }
    charSelectProps.fadeAway = true
    charSelectProps.onFade = ()=>{
      charSelectProps=null
      this.setState({charSelectProps})
    }
    this.setState({gameProps, charSelectProps})
  }

  return(callback = ()=>{}){
    // this.clearClickable()
    // this.keyManager.clicked = false
    window.removeEventListener("resize", this.graphicOnResize)
    this.keyManager.initCursorUpdate(()=>{
      this.setState({cursor: this.keyManager.cursor})
    })
    let {menuProps, htProps, gameProps, charSelectProps, serverSetupProps, settingsProps} = this.state
    htProps = null
    gameProps = null
    charSelectProps = null
    serverSetupProps = null
    settingsProps = null
    menuProps.fadeAway = false
    menuProps.onFade = ()=>{
      menuProps.onFade = ()=>{}
      menuProps.pointerEvents = 'auto'
      this.setState({menuProps, htProps, gameProps, charSelectProps, serverSetupProps, settingsProps, settingChanged : false}, ()=>{
        this.setButtonsClickable(callback)
      })
    }
    this.setState({menuProps})
  }

  componentDidMount(){
    this.setButtonsClickable()
  }

  componentWillUnmount(){
    this.server.close()
  }
  
  render(){
    const {flytextProps,isLoading,gameProps,settingsProps,gameSettingsProps,statsProps,
      settingsRanges, cursor, settingChanged, serverSetupProps, roomID, charSelectProps, 
      selectedAIInd, htProps, menuProps} = this.state
    return (
      <div>
        {(flytextProps) ? <Flytext {...flytextProps} /> : null}
        <Loading show={isLoading}/>
        <div className='footer'>
          <div className="fcontain" style={{display : gameProps ? 'flex' : 'none'}} onClick={()=>{
                          /* this.clearClickable() */
                          this.return()}}>
            <div className="symb backSymb" style={{backgroundImage: `url(${fkey})`}}/><div className="text">Back</div>
          </div>
          <div className="fcontain">
            <div className="symb" style={{backgroundImage: `url(${akey})`}}/><div className="text">Navigate</div>
          </div>
        </div>
        {settingsProps ? <Settings {...settingsProps} gameSettingsProps={gameSettingsProps} statsProps={statsProps} settingsRanges={settingsRanges} cursor={cursor} settingChanged={settingChanged} playProfileInd={gameSettingsProps.playProfileInd}/> : null}
        {gameProps ? <Game {...gameProps}/> : null}
        {serverSetupProps ? <ServerSetup {...serverSetupProps} cursor={cursor} name={gameSettingsProps.name} playProfileInd={gameSettingsProps.playProfileInd} roomID={roomID}/> : null}
        {charSelectProps ? <CharSelect {...charSelectProps} cursor={cursor} selectedAIInd={selectedAIInd}/> : null}
        {htProps ? <HowTo {...htProps} cursor={cursor}/> : null}
        <Menu {...menuProps} cursor={cursor}/>
      </div>
    )
  }
}

export default App
