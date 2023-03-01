/* eslint react/prop-types: 0 */

import React from "react"
import Nav, { navVertical } from 'react-navtree'

import Profile from "../util/Profile"
import { caravanBounds, timeFormatLong } from "../util/Utils"
import KButton from './KButton.js'
import NavInput from "./NavInput.js"
import PicSelect from "./PicSelect.js"

import sprites from "../img/sprites.png"
import Squiggle from "./Squiggle"

const Switch = ({ isOn, handleToggle, sid}) => (
      <Nav navId={`switch ${sid}`} className="settingInput" func={key => { key !== 'up' && key !== 'down' && handleToggle() }}>
        <input
          checked={isOn}
          onChange={handleToggle}
          className="react-switch-checkbox"
          id={`react-switch-new-${sid}`}
          type="checkbox"
        />
        <label
          className="react-switch-label"
          htmlFor={`react-switch-new-${sid}`}
          style={{ background: isOn && '#01d5a2' }}
        >
          <span className={`react-switch-button`} />
        </label>
      </Nav>
)

const Picker = ({color, onChange}) => (<NavInput type="color" className="testColor" value={color} onChange={e => onChange(e.target.value)}/>)

const NavCounter = (props) => (
    <Nav sid={`counter ${props.id}`} className="settingInput" func={ key => {
        key === 'left' && props.within.l && props.click.l() ||
        key === 'right' && props.within.r && props.click.r()
    }
    }>
        <div
            className={`arrowL ${!props.within.l ? 'greyed':''}`}
            style={{backgroundImage:`url(${sprites})`}}
            onClick={()=>{ props.within.l && props.click.l() }}
        />
        {props.value}
        <div
            className={`arrowR ${!props.within.r ? 'greyed':''}`}
            style={{backgroundImage:`url(${sprites})`}}
            onClick={()=>{ props.within.r && props.click.r() }}
        />
    </Nav>
)

const Settings = (props) => {
    const {tubLen, numTubs, diceColor, diceBorder, pipColor, time, pickable, caravan, turnLimit, ignoreFull, preview, name} = props.gameSettingsProps,
    {mod, modDscrt, modBool, modSpec, modVal, modColor, settingChanged, tabs, activeTab, switchTab, playProfileInd, showProfiles, setProfileInd, buttons, statsProps} = props,
    combiBreakdown = statsProps.aiBreakdown.slice(),
    tubLenInLimit = {l: tubLen > 1 && tubLen > numTubs - 2, r: tubLen < numTubs + 2},
    numTubsInLimit = {l: numTubs > 1 && numTubs > tubLen - 2, r: numTubs < tubLen + 2}
    combiBreakdown.push(statsProps.pvpBreakdown)
    const aggregate = statsProps.aggregate,
        newAggregate = combiBreakdown.reduce((pObj, cObj)=>{
        pObj.nGames += cObj.nGames
        pObj.time += cObj.time
        pObj.sideBreakdown.map((prevSide,i)=>{
            const side = cObj.sideBreakdown[i]
            prevSide.nWins += side.nWins
            prevSide.highestScore = Math.max(prevSide.highestScore, side.highestScore)
            return prevSide
        })
        return pObj
    },{
        nGames : 0,
        sideBreakdown : Array(2).fill().map(()=>({
            nWins : 0,
            highestScore : 0,
            closestWin : {p : null, o : null},
            numDestroyed : 0,
            mostDestroyed : 0,
            mostDestroyedTurn : 0,
            numClears : 0,
            mostClears : 0,
            fastestWinTime : null,
        })),
        time: 0
    })
    /*
    let offset
    if (showProfiles) {
        offset = Math.ceil(Profile.cosm.length / 3) - 1
    }
    */
    return (
        <div className='menu settings'>
            <div className='menubox'>
                <div className='subtitle'><Squiggle/>Settings<Squiggle/></div>
                <Nav className="menubox">
                    <Nav className="menubox across TabBar"
                        navId="TabBar"
                        // onNav={path => {if (path) switchTab(Number(path[0]))}}
                        onClick={()=>switchTab(!activeTab + 0)}
                        func={ key => (key !== 'up' && key !== 'down') && switchTab(!activeTab + 0) }
                    >
                        <div className={`arrowL ${tabs[activeTab] === 'gameplay' ? 'greyed':''}`} style={{backgroundImage:`url(${sprites})`}}/>
                        <div className={`Tab ${tabs[activeTab] === 'gameplay' ? 'hovering':''}`}>Gameplay</div>
                        <div className={`Tab ${tabs[activeTab] === 'personal' ? 'hovering':''}`}>Profile</div>
                        <div className={`arrowR ${tabs[activeTab] === 'personal' ? 'greyed':''}`} style={{backgroundImage:`url(${sprites})`}}/>
                    </Nav>
                    {tabs[activeTab] === 'personal' &&
                        <Nav className="menubox across personal" /* func={navVertical} */>
                            {showProfiles &&
                                <div className="scrollContainer">
                                    <PicSelect playProfileInd={playProfileInd} onClick={i => {
                                        setProfileInd(i)
                                        buttons[1].onClick()
                                    }}/>
                                </div>
                            }
                            {!showProfiles &&
                                <div className="scrollContainer">
                                    <div className='menubox stats'>
                                        <div className="pfp" style={{backgroundImage: `url(${Profile.cosm[playProfileInd].img})`}}/>
                                        <KButton text={buttons[1].text} scrollOnFocus onClick={ () => {
                                            buttons[1].onClick()
                                        }}/>
                                        <div className="menubox across">
                                            <div className='menubox'>
                                                <div className="subtitle">{newAggregate.nGames}</div>
                                                <div className="subtitle">{' game' + (newAggregate.nGames > 1 || !newAggregate.nGames ? 's' :'')}</div>
                                            </div>
                                            <div className='menubox'>
                                                <div className="subtitle">{newAggregate.sideBreakdown[1].nWins}</div>
                                                <div className="subtitle">{' win' + (newAggregate.sideBreakdown[1].nWins > 1 || !newAggregate.sideBreakdown[1].nWins? 's' :'')}</div>
                                            </div>
                                            <div className='menubox'>
                                                <div className="subtitle">{newAggregate.sideBreakdown[0].nWins}</div>
                                                <div className="subtitle">{' loss' + (newAggregate.sideBreakdown[0].nWins > 1 || !newAggregate.sideBreakdown[0].nWins? 'es' :'')}</div>
                                            </div>
                                        </div>
                                        <div className='settingsItem'>
                                            <div className='subtitle'>Stats</div>
                                            <div className="menubox misc">
                                                <div className="subtitle">High Score: {newAggregate.sideBreakdown[1].highestScore}</div>
                                                <div className="subtitle">Dice Destroyed: {aggregate[1].numDestroyed + 0}</div>
                                                <div className="subtitle">Closest Win: {aggregate[1].closestWin.o === null ? 'None':aggregate[1].closestWin.p + ' - ' + aggregate[1].closestWin.o}</div>
                                                <div className="subtitle">Most Destroyed in a Game: {aggregate[1].mostDestroyed + 0}</div>
                                                <div className="subtitle">Closest Defeat: {aggregate[0].closestWin.o === null ? 'None': aggregate[0].closestWin.o + ' - ' + aggregate[0].closestWin.p}</div>
                                                <div className="subtitle">Most Destroyed in a Turn: {aggregate[1].mostDestroyedTurn + 0}</div>
                                                <div className="subtitle">Board Clears: {aggregate[1].numClears + 0}</div>
                                                <div className="subtitle">Most Clears in a Game: {aggregate[1].mostClears + 0}</div>
                                                <div className="subtitle">Playtime: {newAggregate.time ? timeFormatLong(newAggregate.time / 1000) : 'None'}</div>
                                                <div className="subtitle">Fastest Win: {aggregate[1].fastestWinTime ? timeFormatLong(aggregate[1].fastestWinTime / 1000) : 'None'}</div>
                                                <div className="subtitle">Fastest Defeat: {aggregate[0].fastestWinTime ? timeFormatLong(aggregate[0].fastestWinTime / 1000) : 'None'}</div>
                                            </div>
                                            <div className='subtitle'>Opponent Breakdown</div>
                                            <div className="menubox settingsList opponent">
                                                {statsProps.aiBreakdown.map((p,i)=>(
                                                    <div key={i*6} className='settingsItem'>
                                                        <div key={i*6+2} className='menubox'>
                                                            <div key={i*6+3} className='subtitle'><b>{Profile.ai[p.profileInd].name}</b></div>
                                                            <div key={i*6+4} className='subtitle'>{
                                                            (!p.nGames ? 'No' : p.nGames) + ' Game' + (p.nGames > 1 || !p.nGames? 's' :'') + ', ' +
                                                            (!p.sideBreakdown[0].nWins ? 'No' : p.sideBreakdown[0].nWins) + ' Win' + (p.sideBreakdown[0].nWins > 1 || !p.sideBreakdown[0].nWins ? 's' :'') + ', ' +
                                                            (!p.sideBreakdown[1].nWins ? 'No' : p.sideBreakdown[1].nWins) + ' Loss' + (p.sideBreakdown[1].nWins > 1 || !p.sideBreakdown[1].nWins ? 'es' :'')
                                                            }</div>
                                                            <div key={i*6+5} className='subtitle'>High Score: {p.sideBreakdown[0].highestScore ? p.sideBreakdown[0].highestScore : 'None'} --- Playtime: {timeFormatLong(p.time / 1000)}</div>
                                                        </div>
                                                        <div key={i*6+1} className='pfp' loading='lazy' style={{backgroundImage: `url(${Profile.ai[p.profileInd].img})`}}/>
                                                    </div>
                                                ))}
                                            </div>
                                            {statsProps.pvpBreakdown.name ? <div className='subtitle'>Online Opponents</div> : null}
                                            {statsProps.pvpBreakdown.name ?
                                                <div className="menubox settingsList opponent">
                                                    <div className='settingsItem'>
                                                        <div className='menubox'>
                                                            <div className='subtitle'>Most Recent: <b>{statsProps.pvpBreakdown.name}</b></div>
                                                            <div className='subtitle'>{
                                                            (!statsProps.pvpBreakdown.nGames ? 'No' : statsProps.pvpBreakdown.nGames) + ' Game' + (statsProps.pvpBreakdown.nGames > 1 || !statsProps.pvpBreakdown.nGames? 's' :'') + ', ' +
                                                            (!statsProps.pvpBreakdown.sideBreakdown[1].nWins ? 'No' : statsProps.pvpBreakdown.sideBreakdown[1].nWins) + ' Win' + (statsProps.pvpBreakdown.sideBreakdown[1].nWins > 1 || !statsProps.pvpBreakdown.sideBreakdown[1].nWins ? 's' :'') + ', ' +
                                                            (!statsProps.pvpBreakdown.sideBreakdown[0].nWins ? 'No' : statsProps.pvpBreakdown.sideBreakdown[0].nWins) + ' Loss' + (statsProps.pvpBreakdown.sideBreakdown[0].nWins > 1 || !statsProps.pvpBreakdown.sideBreakdown[0].nWins ? 'es' :'')
                                                            }</div>
                                                            <div className='subtitle'>High Score: {statsProps.pvpBreakdown.sideBreakdown[0].highestScore ? statsProps.pvpBreakdown.sideBreakdown[0].highestScore : 'None'} --- Playtime: {timeFormatLong(statsProps.pvpBreakdown.time / 1000)}</div>
                                                        </div>
                                                        <div className='pfp' loading='lazy' style={{backgroundImage: `url(${Profile.cosm[statsProps.pvpBreakdown.profileInd].img})`, scale : '-1 1'}}/>
                                                    </div>
                                                </div>
                                            : null}
                                        </div>
                                    </div>
                                </div>
                            }
                            <div className="menubox settingsList">
                                <div className="settingsItem">
                                    <div className='subtitle'>Name</div>
                                    <div className="settingInput">
                                        <NavInput value={name} placeholder="Enter Username" onChange={e => modVal('name',e.target.value)}/>
                                    </div>
                                </div>
                                <div className="settingsItem">
                                    <div className='subtitle'>Colors</div>
                                    <div className="settingInput">
                                        <div className="menubox">
                                            Dice:
                                            <Picker color={diceColor[1]} onChange={(color)=>{modColor('diceColor',1,color)}}/>
                                        </div>
                                        <div className="menubox">
                                            Border:
                                            <Picker color={diceBorder[1]} onChange={(color)=>{modColor('diceBorder',1,color)}}/>
                                        </div>
                                        <div className="menubox">
                                            Pip:
                                            <Picker color={pipColor[1]} onChange={(color)=>{modColor('pipColor',1,color)}}/>
                                        </div>
                                    </div>
                                </div>
                                <div className="settingsItem">
                                    <div className='subtitle'>Opponent Colors</div>
                                    <div className="settingInput">
                                        <div className="menubox">
                                            Dice:
                                            <Picker color={diceColor[0]} onChange={(color)=>{modColor('diceColor',0,color)}}/>
                                        </div>
                                        <div className="menubox">
                                            Border:
                                            <Picker color={diceBorder[0]} onChange={(color)=>{modColor('diceBorder',0,color)}}/>
                                        </div>
                                        <div className="menubox">
                                            Pip:
                                            <Picker color={pipColor[0]} onChange={(color)=>{modColor('pipColor',0,color)}}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Nav>
                    }
                    {tabs[activeTab] === 'gameplay' &&
                        <Nav className="menubox settingsList" style={{display : tabs[activeTab] === 'gameplay' ? 'flex' : 'none'}} func={navVertical}>
                            <div className="settingsItem">
                                <div className='subtitle'>Number of Rows</div>
                                <NavCounter id={'tubLen'} within={tubLenInLimit} click={{l : ()=>mod('tubLen',-1), r : ()=>mod('tubLen',1)}} value={tubLen}/>
                            </div>
                            <div className="settingsItem">
                                <div className='subtitle'>Number of Columns</div>
                                <NavCounter id={'numTubs'} within={numTubsInLimit} click={{l : ()=>mod('numTubs',-1), r : ()=>mod('numTubs',1)}} value={numTubs}/>
                            </div>
                            <div className="settingsItem">
                                <div className='subtitle'>Turn Timer</div>
                                <NavCounter
                                    id={'time'}
                                    within={{l : time !== null, r : time < 60}}
                                    click={{l : ()=>modDscrt('time',-1), r : ()=>modDscrt('time',1)}}
                                    value={time ? time + (time > 1 ? ' seconds' : ' second') : 'None'}
                                />
                            </div>
                            <div className="settingsItem">
                                <div className='subtitle'>Turn Limit</div>
                                <NavCounter
                                    id={'turnLimit'}
                                    within={{l : turnLimit !== null, r : turnLimit < 500}}
                                    click={{l : ()=>modDscrt('turnLimit',-1), r : ()=>modDscrt('turnLimit',1)}}
                                    value={turnLimit ? turnLimit + ' turns' : 'None'}
                                />
                            </div>
                            <div className="settingsItem">
                                <div className='subtitle'>
                                    Move Hinting
                                    <div className='text'>preview scores and dice before a move is made</div>
                                </div>
                                <Switch sid={0} isOn={preview} handleToggle={()=>{modBool('preview')}}/>
                            </div>
                            <div className="settingsItem">
                                <div className='subtitle'>
                                    Longplay
                                    <div className='text'>game continues until there are no legal moves</div>
                                </div>
                                <Switch sid={1} isOn={ignoreFull} handleToggle={()=>{modBool('ignoreFull')}}/>
                            </div>
                            <div className="settingsItem">
                                <div className='subtitle'>
                                    Sabotage
                                    <div className='text'>you can place dice onto your opponent&rsquo;s board</div>
                                </div>
                                <Switch sid={2} isOn={pickable} handleToggle={()=>{modBool('pickable')}}/>
                            </div>
                            <div className="settingsItem">
                                <div className='subtitle'>
                                    Caravan Rules
                                    <div className='text'>{`over ${caravanBounds(tubLen)[0] - 1}, under ${caravanBounds(tubLen)[1] + 1}, ones are Jokers`}</div>
                                </div>
                                <Switch sid={3} isOn={!!caravan} handleToggle={()=>{modSpec('caravan')}}/>
                            </div>
                        </Nav>
                    }
                </Nav>
                <KButton text={settingChanged ? 'Save' : 'Back'} onClick={buttons[0].onClick} hasSpacer defaultFocused/>
            </div>
        </div>
    )
}

export default Settings