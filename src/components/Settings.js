/* eslint react/prop-types: 0 */

import React from "react";
import { SketchPicker } from "react-color";

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

    const {tubLen, numTubs, diceColor, diceBorder, pipColor, time, pickable, caravan, turnLimit} = props.gameSettingsProps
    const {mod, modDscrt, modBool, modSpec, settingsRanges, modColor, cursor, pcursor, settingChanged} = props
  
    return (<div className='menu'>
      <div className='menubox'>
        <div className='subtitle'>~ Settings ~</div>
        <div className="menubox settingsList">
            <div className={`settingsItem ${1 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>Number of Rows</div>
                <div className="settingInput">
                    <div className="arrowL" style={{opacity : tubLen <= 2 ? .2 : 1}} onClick={()=>{if (tubLen > 2) mod('tubLen',-1)}}>⯇</div>
                    {tubLen}
                    <div className="arrowR" style={{opacity : tubLen >= 4 ? .2 : 1}} onClick={()=>{if (tubLen < 4) mod('tubLen',1)}}>⯈</div>
                </div>
            </div>
            <div className={`settingsItem ${2 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>Number of Columns</div>
                <div className="settingInput">
                    <div className="arrowL" style={{opacity : numTubs <= 3 ? .2 : 1}} onClick={()=>{if (numTubs > 3) mod('numTubs',-1)}}>⯇</div>
                    {numTubs}
                    <div className="arrowR" style={{opacity : numTubs >= 5 ? .2 : 1}} onClick={()=>{if (numTubs < 5) mod('numTubs',1)}}>⯈</div>
                </div>
            </div>
            <div className={`settingsItem ${3 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>Dice Color</div>
                <div className="settingInput">
                    <div className="menubox">
                        You: 
                        <div className={`testColor ${3 === cursor && pcursor? 'hovering' : ''}`} style={{background: diceColor[1]}}>
                            <div className="pickWrapper" >
                                <SketchPicker color={diceColor[1]} onChange={(color)=>{
                                    modColor('diceColor',1,color)
                                }}/>
                            </div>
                        </div>
                    </div>
                    <div className="menubox">
                        Opponent: 
                        <div className={`testColor ${3 === cursor && !pcursor? 'hovering' : ''}`} style={{background: diceColor[0]}}>
                            <div className="pickWrapper" >
                                <SketchPicker color={diceColor[0]} onChange={(color)=>{modColor('diceColor',0,color)}}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={`settingsItem ${4 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>Dice Border</div>
                <div className="settingInput">
                    <div className="menubox">
                        You: 
                        <div className={`testColor ${4 === cursor && pcursor? 'hovering' : ''}`} style={{background: diceBorder[1]}}>
                            <div className="pickWrapper" >
                                <SketchPicker color={diceBorder[1]} onChange={(color)=>{modColor('diceBorder',1,color)}}/>
                            </div>
                        </div>
                    </div>
                    <div className="menubox">
                        Opponent: 
                        <div className={`testColor ${4 === cursor && !pcursor? 'hovering' : ''}`} style={{background: diceBorder[0]}}>
                            <div className="pickWrapper" >
                                <SketchPicker color={diceBorder[0]} onChange={(color)=>{modColor('diceBorder',0,color)}}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={`settingsItem ${5 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>Pip Color</div>
                <div className="settingInput">
                    <div className="menubox">
                        You: 
                        <div className={`testColor ${5 === cursor && pcursor? 'hovering' : ''}`} style={{background: pipColor[1]}}>
                            <div className="pickWrapper" >
                                <SketchPicker color={pipColor[1]} onChange={(color)=>{modColor('pipColor',1,color)}}/>
                            </div>
                        </div>
                    </div>
                    <div className="menubox">
                        Opponent: 
                        <div className={`testColor ${5 === cursor && !pcursor? 'hovering' : ''}`} style={{background: pipColor[0]}}>
                            <div className="pickWrapper" >
                                <SketchPicker color={pipColor[0]} onChange={(color)=>{modColor('pipColor',0,color)}}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={`settingsItem ${6 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>Turn Timer</div>
                <div className="settingInput">
                    <div className="arrowL" style={{opacity : time === null ? .2 : 1}} onClick={()=>{if (time !== null) modDscrt('time',-1)}}>⯇</div>
                    {time ? time + (time > 1 ? ' seconds' : ' second') : 'None'}
                    <div className="arrowR" style={{opacity : time >= 60 ? .2 : 1}} onClick={()=>{if (time !== 60) modDscrt('time',1)}}>⯈</div>
                </div>
            </div>
            <div className={`settingsItem ${7 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>Turn Limit</div>
                <div className="settingInput">
                    <div className="arrowL" style={{opacity : turnLimit === null ? .2 : 1}} onClick={()=>{if (turnLimit !== null) modDscrt('turnLimit',-1)}}>⯇</div>
                    {turnLimit ? turnLimit + ' turns' : 'None'}
                    <div className="arrowR" style={{opacity : turnLimit >= 500 ? .2 : 1}} onClick={()=>{if (turnLimit !== 500) modDscrt('turnLimit',1)}}>⯈</div>
                </div>
            </div>
            <div className={`settingsItem ${8 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>
                    Unrestricted
                    <div className='text'>you can place dice onto your opponent&rsquo;s board</div>
                </div>
                <div className="settingInput">
                    <Switch sid={0} isOn={pickable} handleToggle={()=>{modBool('pickable')}}/>
                </div>
            </div>
            <div className={`settingsItem ${9 === cursor ? 'hovering' : ''}`}>
                <div className='subtitle'>
                    Caravan Rules
                    <div className='text'>{`over ${settingsRanges.caravan[tubLen] - 5}, under ${settingsRanges.caravan[tubLen] + 5}, ones are Jokers`}</div>
                </div>
                <div className="settingInput">
                    <Switch sid={1} isOn={!!caravan} handleToggle={()=>{modSpec('caravan')}}/>
                </div>
            </div>
        </div>
        <div className={`kbutton space ${0 === cursor ? 'hovering' : ''}`} onClick={() => props.onClick()}>{settingChanged ? 'Save' : 'Back'}
        </div>
      </div>
    </div>)
}

export default Settings