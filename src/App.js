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
        turnLimit : null,
        name : Profile.cosm[0].name
      },
      playProfileInd : 0,
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
      playProfile : Profile.cosm[this.state.playProfileInd],
      oppProfile : Profile.cosm[this.state.playProfileInd],
      oppName : this.state.gameSettingsProps.name,
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
      setProfileInd : (i)=>this.setProfileInd(i),
      buttons: [
        {
          text : 'Go Back',
          onClick: () => {
            const {gameSettingsProps, settingsRanges} = this.state
            if (gameSettingsProps.caravan){
              const mid = settingsRanges.caravan[gameSettingsProps.tubLen]
              gameSettingsProps.caravan = [mid-4,mid+4]
            }
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
    this.setState({gameSettingsProps,playProfileInd : i})
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
      shakeSelect : false,
      onShakeDone : ()=>{},
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
      setProfileInd : this.setProfileInd
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
    const playProfile =  Profile.cosm[this.state.playProfileInd]
    let oppProfile, oppName, gameSettingsProps = this.state.gameSettingsProps
    if(this.server.isHost){
      turn = randomInRange(2)
      this.server.send({
        name, 
        turn : !turn + 0, 
        gameSettingsProps,
        oppProfileInd : this.state.playProfileInd})
      let init = await this.server.recv()
      oppProfile = Profile.cosm[init.oppProfileInd]
      oppName = init.name
      //console.log('host turn ' + turn)
    } else {
      this.server.send({name, oppProfileInd : this.state.playProfileInd})
      let init = await this.server.recv()
      turn = init.turn
      oppProfile = Profile.cosm[init.oppProfileInd]
      oppName = init.name
      const {diceColor, diceBorder, pipColor} = gameSettingsProps
      gameSettingsProps = {
        ...init.gameSettingsProps,
        diceColor, diceBorder, pipColor
      }
    }
    let {gameProps, serverSetupProps} = this.state
    gameProps = {settings : this.state.gameSettingsProps,
      name, oppName, turn,
      playProfile,
      oppProfile,
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
    let {gameProps, charSelectProps} = this.state
    gameProps = {settings : this.state.gameSettingsProps,
      playProfile : Profile.cosm[this.state.playProfileInd],
      oppProfile : Profile.ai[this.state.selectedAIInd],
      oppName : Profile.ai[this.state.selectedAIInd].name,
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
        {this.state.settingsProps ? <Settings {...this.state.settingsProps} gameSettingsProps={this.state.gameSettingsProps} settingsRanges={this.state.settingsRanges} cursor={this.state.cursor} settingChanged={this.state.settingChanged} playProfileInd={this.state.playProfileInd}/> : null}
        {this.state.gameProps ? <Game {...this.state.gameProps}/> : null}
        {this.state.serverSetupProps ? <ServerSetup {...this.state.serverSetupProps} cursor={this.state.cursor} name={this.state.gameSettingsProps.name} playProfileInd={this.state.playProfileInd} roomID={this.state.roomID}/> : null}
        {this.state.charSelectProps ? <CharSelect {...this.state.charSelectProps} cursor={this.state.cursor} selectedAIInd={this.state.selectedAIInd}/> : null}
        {this.state.htProps ? <HowTo {...this.state.htProps} cursor={this.state.cursor}/> : null}
        <Menu {...this.state.menuProps} cursor={this.state.cursor}/>
      </div>
    )
  }
}

export default App
