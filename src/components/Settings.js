/* eslint react/prop-types: 0 */

import React from "react";
import { SketchPicker } from "react-color";
import Profile from "../util/Profile";

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
    const {mod, modDscrt, modBool, modSpec, modVal, settingsRanges, modColor, cursor, pcursor, settingChanged, tabs, activeTab, switchTab, playProfileInd, onFocus, onBlur, showProfiles, setProfileInd,buttons} = props
    let offset = 0
    if (showProfiles) offset = Math.floor(Profile.cosm.length / 4)
    return (<div className='menu settings'>
      <div className='menubox'>
        <div className='subtitle'>~ Settings ~</div>
        <div className="menubox across TabBar">
            <div className="arrowL" style={{opacity : 1 === cursor ? 1 : .2}}>⯇</div>
            <div className={`Tab ${tabs[activeTab] === 'gameplay' ? 'hovering':''}`} onClick={()=>switchTab(0)}>Gameplay</div>
            <div className={`Tab ${tabs[activeTab] === 'personal' ? 'hovering':''}`} onClick={()=>switchTab(1)}>Personalization</div>
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
            {!showProfiles ? <div className='menubox'>
                <div className="pfp" style={{backgroundImage: `url(${Profile.cosm[playProfileInd].img})`}}/>
                <div className={`kbutton ${2 === cursor ? 'hovering' : ''}`} onClick={() => buttons[1].onClick()}>{buttons[1].text}</div>
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
                    <div className="arrowL" style={{opacity : time === null ? .2 : 1}} onClick={()=>{if (time !== null) modDscrt('time',-1)}}>⯇</div>
                    {time ? time + (time > 1 ? ' seconds' : ' second') : 'None'}
                    <div className="arrowR" style={{opacity : time >= 60 ? .2 : 1}} onClick={()=>{if (time !== 60) modDscrt('time',1)}}>⯈</div>
                </div>
            </div>
            <div className={`settingsItem ${5 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>Turn Limit</div>
                <div className="settingInput">
                    <div className="arrowL" style={{opacity : turnLimit === null ? .2 : 1}} onClick={()=>{if (turnLimit !== null) modDscrt('turnLimit',-1)}}>⯇</div>
                    {turnLimit ? turnLimit + ' turns' : 'None'}
                    <div className="arrowR" style={{opacity : turnLimit >= 500 ? .2 : 1}} onClick={()=>{if (turnLimit !== 500) modDscrt('turnLimit',1)}}>⯈</div>
                </div>
            </div>

            <div className={`settingsItem ${6 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>
                    Auto-calculate
                    <div className='text'>preview the scores before a move is made</div>
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