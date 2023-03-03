import React from 'react'
import PropTypes from 'prop-types'
import Nav, { navVertical } from 'react-navtree'
import { TransitionGroup, CSSTransition } from "react-transition-group"
import { Route, Routes } from 'react-router-dom'

import Cookies from 'universal-cookie'

import CharSelect from './components/CharSelect.js'
import Flytext from './components/Flytext.js'
import Game from './components/Game.js'
import HowTo from './components/HowTo.js'
import KButton from './components/KButton.js'
import Loading from './components/Loading.js'
import ServerSetup from './components/ServerSetup.js'
import Settings from './components/Settings.js'
import { withLocation, withNavigate } from './NavHooks.js'
import Profile from './util/Profile.js'
import Server from './util/Server.js'
import { caravanBounds, GameType, keyConvert, randomInRange, strictMod } from './util/Utils.js'

import akey from "./img/akey.png"
import dkey from "./img/dkey.png"
import fkey from "./img/fkey.png"
import logo from "./img/logo.png"
import caravanImg from "./img/caravan.png"
import hourGlass from "./img/hourglass.png"
import pick from "./img/pick.png"

const MainMenu = (props) => (
  <div className='menu' style={{pointerEvents: props.pointerEvents}}>
    <div className='menubox'>
      <div className='title' style={{backgroundImage: `url(${logo})`}}/>
      <div className='text'>Based on the dice game of risk and reward from Cult of the Lamb</div>
      {props.buttons.map((btn,i)=>(
        <div key={i}>
          <KButton defaultFocused={i === 0} text={btn.text} navId={`mainButton ${i}`} onClick={(e) => {props.navigate(btn.to)}} hasSpacer={i === 0} />
        </div>
      ))}
    </div>
  </div>
)

MainMenu.propTypes = {
  pointerEvents: PropTypes.string,
  buttons: PropTypes.arrayOf(PropTypes.shape({
    text: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired
  })).isRequired,
  navigate: PropTypes.func.isRequired
}

class App extends React.Component{

  constructor(props){
    super(props)
    this.server = new Server()
    this.cookies = new Cookies()
    this.maxAge = 60 * 60 * 24 * 365 * 100;
    ['statUpdate', 'setProfileInd', 'modAIInd', 'modSetAIInd', 'startAIGame', 'return', 'setNavigable', 'setUnNavigable', 'navigate', 'keyNav', 'cleanup'].forEach(
      (fn) => this[fn] = this[fn].bind(this)
    )
    this.state = {
      pageProps : {
        mainMenu:{
          navigate : this.navigate,
          buttons: [
            {
              text : 'Play',
              to: '/play'
            },
            {
              text : 'Play with the Shack',
              to : '/shack',
            },
            {
              text : 'Play with a Friend',
              to : '/io'
            },
            {
              text : 'Settings',
              to : '/settings'
            },
            {
              text : 'How to Play',
              to : '/help'
            }
          ]
        },
        howTo : {
          onClick: this.return
        },
        game : {
          return : this.return,
          statUpdate : this.statUpdate
        },
        charSelect : {
          buttons: [
            {
              onClick: this.startAIGame,
            },
            {
              text : 'Go Back',
              onClick: this.return
            },
          ],
          modAIInd : this.modAIInd,
          modSetAIInd: this.modSetAIInd,
          hasWrapped: 0
        },
        serverSetup: {
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
                const {pageProps} = this.state
                const toggle = pageProps.serverSetup.showProfiles
                pageProps.serverSetup.showProfiles = !toggle
                pageProps.serverSetup.buttons[2].enabled = toggle
                pageProps.serverSetup.buttons[3].enabled = toggle
                if (pageProps.serverSetup.showProfiles) {
                  pageProps.serverSetup.buttons[1].text = 'Done'
                } else {
                  pageProps.serverSetup.buttons[1].text = 'Choose Form'
                }
                this.setState({pageProps})
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
          showProfiles : false,
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
        },
        settings : {
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
          setProfileInd : this.setProfileInd,
          buttons: [
            {
              text : 'Go Back',
              onClick: () => {
                const {gameSettingsProps} = this.state
                if (gameSettingsProps.caravan){
                  gameSettingsProps.caravan = caravanBounds(gameSettingsProps.tubLen)
                }
                this.cookies.set('gameSettingsProps', gameSettingsProps, { path: '/', maxAge: this.maxAge, sameSite : 'strict' });
                this.setState({gameSettingsProps, settingChanged : false},this.return)
              }
            },
            {
              text : 'Choose Form',
              onClick: () => {
                const {pageProps} = this.state
                pageProps.settings.showProfiles = !pageProps.settings.showProfiles
                this.setState({pageProps})
              }
            }
          ],
          showProfiles : false,
          tabs : ['gameplay', 'personal'],
          activeTab : 0,
          switchTab : (destTab)=>{
            const {pageProps} = this.state
            if (pageProps.settings.showProfiles){
              pageProps.settings.buttons[1].onClick()
            }
            pageProps.settings.activeTab = destTab
            this.setState({pageProps})
          }
        }
      },
      flytextProps: {
        message : '',
        display : false,
        show: false,
        timeOut : 1,
      },
      selectedAIInd : 0,
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
        turn : null,
        pickable : false,
        ignoreFull : false,
        preview : false,
        // caravan : [10,18]
        caravan : null,
        turnLimit : null,
        playProfileInd : 0,
        oppProfileInd : 0,
        name : Profile.cosm[0].name,
        oppName : Profile.cosm[0].name
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
      },
      navEnabled : true
    }
  }

  navigate(to = ''){
    this.props.navigate(to, { replace: true })
  }

  statUpdate(time, winnerInd, scoreList, clearList, destroyedList, destroyedMaxTurnList, gameType){
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
    if (gameType === GameType.AI){
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

  cycleSetting(propsName,settingName,change,clamp){
    const sprops = this.state[propsName]
    sprops[settingName] = (sprops[settingName] + change + clamp) % clamp
    this.setState({propsName: sprops})
    return sprops[settingName]
  }

  setProfileInd(i){
    const gameSettingsProps = this.state.gameSettingsProps
    gameSettingsProps.name = Profile.cosm[i].name
    gameSettingsProps.playProfileInd = i
    this.cookies.set('gameSettingsProps', gameSettingsProps, { path: '/', maxAge: this.maxAge, sameSite : 'strict' });
    this.setState({gameSettingsProps})
  }

  modAIInd(i){
    const pLength = Profile.ai.length,
      {pageProps, selectedAIInd} = this.state,
      newInd = selectedAIInd + i,
      inbounds = (0 <= newInd && newInd <= pLength-1)
    // console.log(this.state.selectedAIInd)
    // if ((this.state.selectedAIInd > 0 && i === -1)
    //   || (this.state.selectedAIInd < pLength - 1 && i === 1)) {
    //     this.setState((prevstate)=>({selectedAIInd : prevstate.selectedAIInd + i}))
    //   }
    // else this.shakeSelect()
    pageProps.charSelect.hasWrapped ^= !inbounds
    this.setState({selectedAIInd : strictMod(newInd, pLength), pageProps})
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
    const {flytextProps} = this.state
    flytextProps.message = text
    flytextProps.display = true
    flytextProps.show = false
    this.setState({flytextProps})
    setTimeout(()=>{
      flytextProps.show = true
      flytextProps.slideEnd = () => {
        setTimeout(()=>{
          flytextProps.show = false
          flytextProps.slideEnd = () => {
            flytextProps.display = false
            this.setState({flytextProps})
          }
          this.setState({flytextProps})
        }, 2000)
      }
      this.setState({flytextProps})
    }, 100)
  }

  cleanup() {
    const {pageProps} = this.state
    pageProps.serverSetup.lock = false
    pageProps.serverSetup.buttons[2].text = 'Create Room'
    pageProps.serverSetup.buttons[0].onClick = ()=>{
      this.server.close()
      this.return()
    }
    this.setState({pageProps, isLoading : false})
  }

  startRoom(){
    let {gameSettingsProps, pageProps} = this.state
    let username = gameSettingsProps.name
    if (!username.length){
      username = 'Player 1'
    }
    pageProps.serverSetup.lock = true
    const baseText = 'Waiting'
    let count = 1
    pageProps.serverSetup.buttons[2].text = baseText
    const interval = setInterval(()=>{
      pageProps.serverSetup.buttons[2].text = baseText + ('.'.repeat(count))
      this.setState({pageProps})
      count = (count + 1) % 4
    },1000)
    pageProps.serverSetup.buttons[0].onClick = ()=>{
      clearInterval(interval)
      this.cleanup()
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
    this.setState({pageProps, username, roomID, isLoading : true})
  }

  joinRoom(){
    const pattern = /[A-Z]{4}/
    let {gameSettingsProps, roomID} = this.state
    let username = gameSettingsProps.name
    if (!roomID || !pattern.test(roomID)) {
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
    let turn, {gameSettingsProps} = this.state
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
    gameSettingsProps.turn = turn
    this.cleanup()
    this.setState({gameSettingsProps}, ()=>{this.navigate('/io/play')})
  }

  shakeServer(){
    const {pageProps} = this.state.pageProps
    pageProps.serverSetup.shake = true
    pageProps.serverSetup.onShakeDone = ()=>{
      pageProps.serverSetup.shake = false
      pageProps.serverSetup.onShakeDone = ()=>{}
      this.setState({pageProps})
    }
    this.setState({pageProps})
  }

  shakeSelect(){
    const {pageProps} = this.state
    pageProps.charSelect.shakeSelect = true
    pageProps.charSelect.onShakeDone = ()=>{
      pageProps.charSelect.shakeSelect = false
      pageProps.charSelect.onShakeDone = ()=>{}
      this.setState({pageProps})
    }
    this.setState({pageProps})
  }

  startAIGame(){
    const {pageProps, gameSettingsProps} = this.state
    gameSettingsProps.oppProfileInd = this.state.selectedAIInd
    gameSettingsProps.oppName = Profile.ai[this.state.selectedAIInd].name
    this.setState({pageProps, gameSettingsProps}, ()=>{this.navigate('/shack/play')})
  }

  return(){
    this.server.close()
    this.navigate('')
  }

  setNavigable(e){
    if (!this.state.navEnabled) {
      // We consume the event on nav context switch to prevent unintended selection
      this.setState({navEnabled : true})
      if (["Enter", "e", " "].includes(e.key)) return
    }
    this.keyNav(e)
  }

  setUnNavigable(){
    this.state.navEnabled && this.setState({navEnabled : false})
  }

  keyNav(e){
    // e.stopPropagation()
    if (e.key === "Tab") {
      e.preventDefault()
      return
    }
    let key = keyConvert(e.key)
    if (key) {
      this.props.tree.resolve(key)
      e.preventDefault()
      // console.log(this.props.tree.getFocusedPath())
    }
  }

  componentDidMount(){
    window.addEventListener('pointermove', this.setUnNavigable)
    window.addEventListener('keyup', this.setNavigable)
  }

  componentWillUnmount(){
    this.server.close()
    window.removeEventListener('pointermove', this.setUnNavigable)
    window.removeEventListener('keyup', this.setNavigable)
  }

  render(){
    const {flytextProps, isLoading, pageProps, gameSettingsProps, statsProps,
      settingsRanges, settingChanged, roomID, selectedAIInd, navEnabled} = this.state,
      {caravan, pickable, ignoreFull} = gameSettingsProps
    return (
      <Nav id='app' tree={this.props.tree} className={navEnabled ? 'navigable' : null} func={navVertical}>
        <Flytext {...flytextProps} />
        <Loading show={isLoading}/>
        <TransitionGroup component={null}>
          <CSSTransition key={this.props.location.key} classNames="fade" timeout={300}>
            <Routes location={this.props.location}>
              <Route path='/:gameType?/play' element={<Game {...pageProps.game} settings={gameSettingsProps}/>}/>
              <Route path='/' element={<MainMenu {...pageProps.mainMenu}/>} />
              <Route path='/settings' element={<Settings {...pageProps.settings} gameSettingsProps={gameSettingsProps} statsProps={statsProps} settingsRanges={settingsRanges} settingChanged={settingChanged}/>}/>
              <Route path='/io/' element={<ServerSetup {...pageProps.serverSetup} name={gameSettingsProps.name} playProfileInd={gameSettingsProps.playProfileInd} roomID={roomID}/>}/>
              <Route path='/shack/' element={<CharSelect {...pageProps.charSelect} selectedAIInd={selectedAIInd}/>}/>
              <Route path='/help' element={<HowTo {...pageProps.howTo}/>}/>
            </Routes>
          </CSSTransition>
        </TransitionGroup>
        <div className='footer'>
          <div className="fcontain">
            <div className="symb" style={{backgroundImage: `url(${akey})`}}/><div className="text">Navigate</div>
          </div>
          <Routes>
            <Route path='/shack' element={
              <div className="fcontain mobile">
                <div className="symb mobile dragSymb" style={{backgroundImage: `url(${dkey})`}}/><div className="text">Drag</div>
              </div>
            } />
            <Route path='/io?/shack?/play' element={
              <>
                <div className="fcontain mobile" onPointerUp={this.return}>
                  <div className="symb backSymb" style={{backgroundImage: `url(${fkey})`}}/><div className="text">Back</div>
                </div>
                <div className="fcontain mobile right">
                  {ignoreFull &&
                    <div className="symb mobile infoSymb" style={{backgroundImage: `url(${hourGlass})`}}>
                      <div className="text">Game continues until there are no legal moves</div>
                    </div>
                  }
                  {pickable &&
                    <div className="symb mobile infoSymb" style={{backgroundImage: `url(${pick})`}}>
                      <div className="text">You can place dice on the opposing board</div>
                    </div>
                  }
                  {caravan &&
                    <div className="symb mobile infoSymb" style={{backgroundImage: `url(${caravanImg})`}}>
                      <div className="text">{`Caravan Rules: Over ${caravan[0]}, Under ${caravan[1]}`}</div>
                    </div>
                  }
                </div>
              </>
            } />
            <Route path='*' element={<></>}/>
          </Routes>
        </div>
      </Nav>
    )
  }
}

App.propTypes = {
  tree: PropTypes.shape({
    resolve: PropTypes.func.isRequired,
    getFocusedPath: PropTypes.func.isRequired
  }).isRequired,
  location: PropTypes.shape({
    key: PropTypes.string.isRequired
    }).isRequired,
  navigate: PropTypes.func.isRequired
}

export default withLocation(withNavigate(App))