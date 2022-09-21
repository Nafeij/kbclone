/* eslint react/prop-types: 0 */

import React from "react";
import { SketchPicker } from "react-color";
import Profile from "../util/Profile";
import { timeFormatLong } from "../util/utils";

const Switch = ({ isOn, handleToggle, sid}) => {
    return (
      <>
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
      </>
    );
};

function Settings (props) {

    // console.log(props.cursorID + ' : ' + props.cursor)
    // console.log(props.graphicwidth)

    const {tubLen, numTubs, diceColor, diceBorder, pipColor, time, pickable, caravan, turnLimit, ignoreFull, preview, name} = props.gameSettingsProps
    const {mod, modDscrt, modBool, modSpec, modVal, settingsRanges, modColor, cursor, pcursor, settingChanged, tabs, activeTab, switchTab, playProfileInd, onFocus, onBlur, showProfiles, setProfileInd,buttons,statsProps} = props
    const combiBreakdown = statsProps.aiBreakdown.slice()
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
    let offset = 0
    if (showProfiles) offset = Math.floor(Profile.cosm.length / 4)
    return (<div className='menu settings'>
      <div className='menubox'>
        <div className='subtitle'>~ Settings ~</div>
        <div className="menubox across TabBar">
            <div className="arrowL" style={{opacity : 1 === cursor ? 1 : .2}}>⯇</div>
            <div className={`Tab ${tabs[activeTab] === 'gameplay' ? 'hovering':''}`} onClick={()=>switchTab(0)}>Gameplay</div>
            <div className={`Tab ${tabs[activeTab] === 'personal' ? 'hovering':''}`} onClick={()=>switchTab(1)}>Profile</div>
            <div className="arrowR" style={{opacity : 1 === cursor ? 1 : .2}}>⯈</div>
        </div>
        <div className="menubox across personal" style={{display : tabs[activeTab] === 'personal' ? 'flex' : 'none'}}>
            {showProfiles ? <div className="scrollContainer">
                <div className="formGrid">
                    {Profile.cosm.map((p,i)=>(
                        <div key={i} className={`pfp ${i === playProfileInd ? 'active':''} ${cursor === 2 + Math.floor(i/4) && pcursor === i % 4? 'hovering':''}`} style={{backgroundImage: `url(${p.img})`}} onClick={()=>{setProfileInd(i);buttons[1].onClick()}}/>
                    ))}
                </div>
            </div> : null}
            {!showProfiles ? <div className="scrollContainer">
                <div className='menubox stats'>
                    <div className="pfp" style={{backgroundImage: `url(${Profile.cosm[playProfileInd].img})`}}/>
                    <div className={`kbutton ${2 === cursor ? 'hovering' : ''}`} onClick={() => buttons[1].onClick()}>{buttons[1].text}</div>
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
                            <div className="subtitle"><s>Perfect</s> Board Clears: {aggregate[1].numClears + 0}</div>
                            <div className="subtitle">Most Clears in a Game: {aggregate[1].mostClears + 0}</div>
                            <div className="subtitle">Playtime: {aggregate.time ? timeFormatLong(aggregate.time / 1000) : 'None'}</div>
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
                                    <div key={i*6+1} className='pfp' style={{backgroundImage: `url(${Profile.ai[p.profileInd].img})`}}/>
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
                                    <div className='pfp' style={{backgroundImage: `url(${Profile.cosm[statsProps.pvpBreakdown.profileInd].img})`, transform : 'scaleX(-1)'}}/>
                                </div>
                            </div>
                        : null}
                    </div>
                </div>
            </div> : null}
            <div className="menubox settingsList">
                <div className={`settingsItem ${3 + offset === cursor ? 'hovering' : ''}`}>
                    <div className='subtitle'>Name</div>
                    <div className="settingInput">
                        <input type='text' value={name} placeholder="Enter Username" onFocus={onFocus} onBlur={onBlur} onChange={evt => modVal('name',evt.target.value)}/>
                    </div>
                </div>
                <div className={`settingsItem ${4 + offset === cursor ? 'hovering' : ''}`}>
                    <div className='subtitle'>Colors</div>
                    <div className="settingInput">
                        <div className="menubox">
                            Dice: 
                            <div className={`testColor ${4 + offset === cursor && 0 === pcursor? 'hovering' : ''}`} style={{background: diceColor[1]}}>
                                <div className="pickWrapper" >
                                    <SketchPicker color={diceColor[1]} onChange={(color)=>{
                                        modColor('diceColor',1,color)
                                    }}/>
                                </div>
                            </div>
                        </div>
                        <div className="menubox">
                            Border: 
                            <div className={`testColor ${4 + offset === cursor && 1 === pcursor? 'hovering' : ''}`} style={{background: diceBorder[1]}}>
                                <div className="pickWrapper" >
                                    <SketchPicker color={diceBorder[1]} onChange={(color)=>{modColor('diceBorder',1,color)}}/>
                                </div>
                            </div>
                        </div>
                        <div className="menubox">
                            Pip: 
                            <div className={`testColor ${4 + offset === cursor && 2 === pcursor? 'hovering' : ''}`} style={{background: pipColor[1]}}>
                                <div className="pickWrapper" >
                                    <SketchPicker color={pipColor[1]} onChange={(color)=>{modColor('pipColor',1,color)}}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={`settingsItem ${5 + offset === cursor ? 'hovering' : ''}`}>
                    <div className='subtitle'>Opponent Colors</div>
                    <div className="settingInput">
                        <div className="menubox">
                            Dice: 
                            <div className={`testColor ${5 + offset === cursor && 0 === pcursor? 'hovering' : ''}`} style={{background: diceColor[0]}}>
                                <div className="pickWrapper" >
                                    <SketchPicker color={diceColor[0]} onChange={(color)=>{modColor('diceColor',0,color)}}/>
                                </div>
                            </div>
                        </div>
                        <div className="menubox">
                            Border: 
                            <div className={`testColor ${5 + offset === cursor && 1 === pcursor? 'hovering' : ''}`} style={{background: diceBorder[0]}}>
                                <div className="pickWrapper" >
                                    <SketchPicker color={diceBorder[0]} onChange={(color)=>{modColor('diceBorder',0,color)}}/>
                                </div>
                            </div>
                        </div>
                        <div className="menubox">
                            Pip: 
                            <div className={`testColor ${5 + offset === cursor && 2 === pcursor? 'hovering' : ''}`} style={{background: pipColor[0]}}>
                                <div className="pickWrapper" >
                                    <SketchPicker color={pipColor[0]} onChange={(color)=>{modColor('pipColor',0,color)}}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="menubox settingsList" style={{display : tabs[activeTab] === 'gameplay' ? 'flex' : 'none'}}>
            <div className={`settingsItem ${2 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>Number of Rows</div>
                <div className="settingInput">
                    <div className="arrowL" style={{opacity : tubLen <= 2 ? .2 : 1}} onClick={()=>{if (tubLen > 2) mod('tubLen',-1)}}>⯇</div>
                    {tubLen}
                    <div className="arrowR" style={{opacity : tubLen >= 4 ? .2 : 1}} onClick={()=>{if (tubLen < 4) mod('tubLen',1)}}>⯈</div>
                </div>
            </div>
            <div className={`settingsItem ${3 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>Number of Columns</div>
                <div className="settingInput">
                    <div className="arrowL" style={{opacity : numTubs <= 3 ? .2 : 1}} onClick={()=>{if (numTubs > 3) mod('numTubs',-1)}}>⯇</div>
                    {numTubs}
                    <div className="arrowR" style={{opacity : numTubs >= 5 ? .2 : 1}} onClick={()=>{if (numTubs < 5) mod('numTubs',1)}}>⯈</div>
                </div>
            </div>
            <div className={`settingsItem ${4 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>Turn Timer</div>
                <div className="settingInput">
                    <div className="arrowL" style={{opacity : time === null ? .2 : 1}} onClick={()=>{modDscrt('time',-1)}}>⯇</div>
                    {time ? time + (time > 1 ? ' seconds' : ' second') : 'None'}
                    <div className="arrowR" style={{opacity : time >= 60 ? .2 : 1}} onClick={()=>{modDscrt('time',1)}}>⯈</div>
                </div>
            </div>
            <div className={`settingsItem ${5 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>Turn Limit</div>
                <div className="settingInput">
                    <div className="arrowL" style={{opacity : turnLimit === null ? .2 : 1}} onClick={()=>{modDscrt('turnLimit',-1)}}>⯇</div>
                    {turnLimit ? turnLimit + ' turns' : 'None'}
                    <div className="arrowR" style={{opacity : turnLimit >= 500 ? .2 : 1}} onClick={()=>{modDscrt('turnLimit',1)}}>⯈</div>
                </div>
            </div>

            <div className={`settingsItem ${6 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>
                    Move Hinting
                    <div className='text'>preview scores and dice before a move is made</div>
                </div>
                <div className="settingInput">
                    <Switch sid={0} isOn={preview} handleToggle={()=>{modBool('preview')}}/>
                </div>
            </div>

            <div className={`settingsItem ${7 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>
                    Longplay
                    <div className='text'>game continues until there are no legal moves</div>
                </div>
                <div className="settingInput">
                    <Switch sid={1} isOn={ignoreFull} handleToggle={()=>{modBool('ignoreFull')}}/>
                </div>
            </div>
            <div className={`settingsItem ${8 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>
                    Sabotage
                    <div className='text'>you can place dice onto your opponent&rsquo;s board</div>
                </div>
                <div className="settingInput">
                    <Switch sid={2} isOn={pickable} handleToggle={()=>{modBool('pickable')}}/>
                </div>
            </div>
            <div className={`settingsItem ${9 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>
                    Caravan Rules
                    <div className='text'>{`over ${settingsRanges.caravan[tubLen] - 5}, under ${settingsRanges.caravan[tubLen] + 5}, ones are Jokers`}</div>
                </div>
                <div className="settingInput">
                    <Switch sid={3} isOn={!!caravan} handleToggle={()=>{modSpec('caravan')}}/>
                </div>
            </div>
        </div>
        <div className={`kbutton space ${0 === cursor ? 'hovering' : ''}`} onClick={() => buttons[0].onClick()}>{settingChanged ? 'Save' : 'Back'}
        </div>
      </div>
    </div>)
}

export default Settings