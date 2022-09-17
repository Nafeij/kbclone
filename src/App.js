/* eslint react/prop-types: 0 */

import React from 'react'
import CharSelect from './components/CharSelect.js'
import ServerSetup from './components/ServerSetup.js'
import Server from './util/Server.js'
import Game from './components/Game.js'
import HowTo from './components/HowTo.js'
import KeyManager from './util/KeyManager.js'
import Profile from './util/Profile.js'
import { randomInRange } from './util/utils.js'
import Flytext from './components/Flytext.js'
import fkey from "./img/fkey.png"
import akey from "./img/akey.png"
import Loading from './components/Loading.js'
import Settings from './components/Settings.js'

function Menu (props) {

  const button = (i)=>(
    <div key={i} className={`kbutton ${i === 0 ? 'space' : ''} ${props.buttons[i].cursorID === props.cursor ? 'hovering' : ''}`} onClick={() => props.buttons[i].onClick()}>{props.buttons[i].text}</div>
  )

  return (<div className={`menu fadeable ${props.fadeAway ? 'hide' : ''}`} style={{pointerEvents: props.pointerEvents}} onTransitionEnd={props.onFade}>
    <div className='menubox'>
      <div className='subtitle'>~⚅⚅⚅∽</div>
      <div className='title'>KNUCKLECLONE</div>
      <div className='logo'>✵</div>
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
              this.startChapterSelect()
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
      selectedpfp : 1,
      cursor: this.keyManager.cursor,
      // disable: () => {this.disable()},
      next: null,
      username: '',
      roomID : '',
      isLoading : false,
      graphicRef : React.createRef(),
      settingChanged : false,
      gameSettingsProps : {
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
        turnLimit : null
      },
      settingsRanges : {
        time : {rcursor : 0, range : [null, 1, 5, 10, 20, 30, 60]},
        turnLimit : {rcursor : 0, range : [null, 5, 10, 50, 100, 200, 500]},
        caravan : {2 : 8, 3 : 14, 4 : 21, 5 : 29}
      }
    }
/*     this.keyManager.initCallback(()=>{
      const {menuProps, htProps: htprops} = this.state
      this.setState({menuProps, htprops})
    }) */
    this.keyManager.initCursorUpdate(()=>{
      this.setState({cursor: this.keyManager.cursor})
    })
  }

/*   disable(){
    console.log('disable')
    this.setState({enabled : false})
  } */

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
    charSelectProps
    menuProps.buttons = menuProps.buttons.map((btn)=>({...btn, cursorID : -1}))
    htprops.cursorID = -1
    this.setState({menuProps, htprops})
  }

  startGame(){
    // this.clearClickable()
    //console.log('test')
    this.keyManager.clear()
    this.keyManager.returnAction = ()=> this.return()
    let {menuProps, gameProps} = this.state
    gameProps = {settings : this.state.gameSettingsProps,
      ai : 0,
      return : ()=>this.return(),
      gameType : 'DEFAULT'
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
      },
      fwdref : this.state.graphicRef,
      graphicwidth : 0
    }
    this.keyManager.push(0, htProps.onClick)
    menuProps.fadeAway = true
    menuProps.onFade = ()=>{
      menuProps.onFade = ()=>{}
      menuProps.pointerEvents = 'none'
      this.setState({menuProps})
    }
    this.setState({menuProps, htProps}, ()=>{
      htProps.graphicwidth = this.state.graphicRef.current.getBoundingClientRect().width
      this.setState({htProps})
      window.addEventListener("resize", this.graphicOnResize)
    })
  }

  startSettings(){
    this.keyManager.clear()
    let {menuProps, settingsProps} = this.state
    menuProps.buttons = menuProps.buttons.map((btn)=>({...btn, cursorID : -1}))
    settingsProps = {
      onClick: () => {
        const {gameSettingsProps, settingsRanges} = this.state
        if (gameSettingsProps.caravan){
          const mid = settingsRanges.caravan[gameSettingsProps.tubLen]
          gameSettingsProps.caravan = [mid-4,mid+4]
        }
        this.setState({gameSettingsProps},this.return)
      },
      mod : (setting,i)=>{
        const gameSettingsProps = this.state.gameSettingsProps
        gameSettingsProps[setting] = gameSettingsProps[setting] + i
        //console.log(gameSettingsProps[setting])
        this.setState({gameSettingsProps, settingChanged : true})
      },
      modDscrt : (setting,i)=>{
        const {gameSettingsProps, settingsRanges} = this.state
        settingsRanges[setting].rcursor += i
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
          const {gameSettingsProps, settingsRanges} = this.state
          if (gameSettingsProps.caravan) gameSettingsProps.caravan = null
          else {
            const mid = settingsRanges.caravan[gameSettingsProps.tubLen]
            gameSettingsProps.caravan = [mid-4,mid+4]
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
      pcursor : 0,
    }

    const togglePCursor = (p)=>{
      const settingsProps = this.state.settingsProps
      settingsProps.pcursor = (settingsProps.pcursor + p + 3) % 3
      this.setState({settingsProps})
    }
    // this.keyManager.push(0, htProps.onClick)
    this.keyManager.push(0, settingsProps.onClick)
    this.keyManager.push([-1,0,1], 
      [()=>{},()=>{if (this.state.gameSettingsProps.tubLen > 2) settingsProps.mod('tubLen',-1)},
      ()=>{if (this.state.gameSettingsProps.tubLen < 4) settingsProps.mod('tubLen',1)}])
    this.keyManager.push([-1,0,1], [
      ()=>{},()=>{if (this.state.gameSettingsProps.numTubs > 3) settingsProps.mod('numTubs',-1)},
      ()=>{if (this.state.gameSettingsProps.numTubs < 5) settingsProps.mod('numTubs',1)}])
    this.keyManager.push([-1,0,1], [
      ()=>{},()=>{togglePCursor(-1)},()=>{togglePCursor(1)}])
    this.keyManager.push([-1,0,1], [
      ()=>{},()=>{togglePCursor(-1)},()=>{togglePCursor(1)}])
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
    menuProps.fadeAway = true
    menuProps.onFade = ()=>{
      menuProps.onFade = ()=>{}
      menuProps.pointerEvents = 'none'
      this.setState({menuProps})
    }
    this.setState({menuProps, settingsProps})
  }

  startChapterSelect(){
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
      incrementPfp : ()=>{this.incrementPfp()},
      decrementPfp : ()=>{this.decrementPfp()},
      shakeSelect : false,
      onShakeDone : ()=>{},
      fadeAway : false,
      onFade : ()=>{},
    }
    this.keyManager.push([-1, 0, 1], [()=>{this.startAIGame()},()=>{this.decrementPfp()},()=>{this.incrementPfp()}])
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
          text : 'Create Room',
          cursorID: 0,
          onClick: () => {
            this.startRoom()
          },
        },
        {
          text : 'Join Room',
          cursorID: 1,
          onClick: () => {
            this.joinRoom()
          }
        },
        {
          text : 'Go Back',
          cursorID: 2,
          onClick: () => {
            this.server.close()
            this.return()
          }
        },
      ],
      lock : false,
      shake : false,
      onShakeDone : ()=>{},
      fadeAway : false,
      onFade : ()=>{},
      onFocus : ()=>{this.keyManager.enabled = false},
      onBlur : ()=>{this.keyManager.enabled = true},
      setUsername : (e)=>{this.setUsername(e)},
      setID : (e)=>{this.setID(e)}
    }
    serverSetupProps.buttons.forEach(e => {
      this.keyManager.push(e.cursorID, e.onClick)
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
    let {username, serverSetupProps} = this.state
    if (!username.length){
      username = 'Player 1'
    }
    serverSetupProps.lock = true
    this.keyManager.clear()
    serverSetupProps.buttons[0].cursorID = 3
    serverSetupProps.buttons[2].cursorID = 0
    const baseText = 'Waiting'
    let count = 1
    serverSetupProps.buttons[0].text = baseText
    const interval = setInterval(()=>{
      serverSetupProps = this.state.serverSetupProps
      serverSetupProps.buttons[0].text = baseText + ('.'.repeat(count))
      this.setState({serverSetupProps})
      count = (count + 1) % 4
    },1000)
    serverSetupProps.buttons[2].onClick = ()=>{
      this.setState({isLoading : false})
      clearInterval(interval)
      this.server.close()
      this.return()
    }
    this.keyManager.push(0, serverSetupProps.buttons[2].onClick)

    if (this.server.peer) this.server.close()
    const roomID = this.server.createRoom(()=>{
      this.server.send({username, gameSettingsProps : this.state.gameSettingsProps})
      this.server.recv().then((oppName)=>{
        //console.log(oppName)
        clearInterval(interval)
        this.startPVPGame(username, oppName)
      })
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
    let {username, roomID} = this.state
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
      this.server.send(username)
      this.server.recv().then(initObj=>{
        const {diceColor, diceBorder, pipColor} = this.state.gameSettingsProps
        //console.log(oppName)
        initObj.gameSettingsProps = {
          ...initObj.gameSettingsProps,
          diceColor, diceBorder, pipColor
        }
        this.setState({gameSettingsProps : initObj.gameSettingsProps},()=>{
          this.startPVPGame(username, initObj.username)
        })
      })
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

  async startPVPGame(name, oppName){
    // this.clearClickable()
    // console.log(' Player: ' + name + ' Opponent: ' + oppName)
    this.keyManager.clear()
    this.keyManager.returnAction = ()=> {
      this.server.close()
      this.return()
    }
    let turn, hostPfp, guestPfp
    if(this.server.isHost){
      turn = randomInRange(2)
      const prange = Profile.names.length
      hostPfp = randomInRange(prange)
      guestPfp = (hostPfp + 1 + randomInRange(prange - 1)) % prange
      this.server.send({turn : !turn + 0, hostPfp, guestPfp})
      //console.log('host turn ' + turn)
    } else {
      const init = await this.server.recv()
      turn = init.turn; guestPfp = init.hostPfp; hostPfp= init.guestPfp
    }
    let {gameProps, serverSetupProps} = this.state
    gameProps = {settings : this.state.gameSettingsProps,
      name, oppName, turn, hostPfp, guestPfp,
      gameType : 'PVP',
      return : ()=> {
        this.server.close()
        this.return()
      }
    }
    serverSetupProps.fadeAway = true
    serverSetupProps.onFade = ()=>{
      serverSetupProps=null
      this.setState({serverSetupProps})
    }
    this.setState({gameProps, serverSetupProps, isLoading : false})
  }

  setUsername(evt){
    const name = evt.target.value;
    if (name) this.setState({username : name})
  }

  setID(evt){
    const id = evt.target.value.toUpperCase()
    this.setState({roomID : id})
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

  incrementPfp(){
    if (this.state.selectedpfp < Profile.names.length - 1) this.setState((prevstate)=>({selectedpfp : prevstate.selectedpfp + 1})) 
    else this.shakeSelect()
  }

  decrementPfp(){
    if (this.state.selectedpfp > 1) this.setState((prevstate)=>({selectedpfp : prevstate.selectedpfp - 1}))
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
    let {gameProps, charSelectProps} = this.state
    gameProps = {settings : this.state.gameSettingsProps,
      ai : this.state.selectedpfp,
      return : ()=>this.return(),
      gameType : 'AI'
    }
    charSelectProps.fadeAway = true
    charSelectProps.onFade = ()=>{
      charSelectProps=null
      this.setState({charSelectProps})
    }
    this.setState({gameProps, charSelectProps})
  }

  graphicOnResize(){
    if(this.state){
      const htProps = this.state.htProps
      htProps.graphicwidth = this.state.graphicRef.current.getBoundingClientRect().width
      this.setState({htProps})
    }
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
    // const {cursor, disable, enabled} = this.state
    return (
      <div>
        {(this.state.flytextProps) ? <Flytext {...this.state.flytextProps} /> : null}
        <Loading show={this.state.isLoading}/>
        <div className='footer'>
          <div className="fcontain" style={{display : this.state.gameProps ? 'flex' : 'none'}} onClick={()=>{
                          /* this.clearClickable() */
                          this.return()}}>
            <div className="symb backSymb" style={{backgroundImage: `url(${fkey})`}}/><div className="text">Back</div>
          </div>
          <div className="fcontain">
            <div className="symb" style={{backgroundImage: `url(${akey})`}}/><div className="text">Navigate</div>
          </div>
        </div>
        {this.state.settingsProps ? <Settings {...this.state.settingsProps} gameSettingsProps={this.state.gameSettingsProps} settingsRanges={this.state.settingsRanges} cursor={this.state.cursor} settingChanged={this.state.settingChanged}/> : null}
        {this.state.gameProps ? <Game {...this.state.gameProps}/> : null}
        {this.state.serverSetupProps ? <ServerSetup {...this.state.serverSetupProps} cursor={this.state.cursor} roomID={this.state.roomID}/> : null}
        {this.state.charSelectProps ? <CharSelect {...this.state.charSelectProps} cursor={this.state.cursor} selectedpfp={this.state.selectedpfp}/> : null}
        {this.state.htProps ? <HowTo {...this.state.htProps} cursor={this.state.cursor}/> : null}
        <Menu {...this.state.menuProps} cursor={this.state.cursor}/>
      </div>
    )
  }
}

export default App
