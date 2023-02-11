/* eslint react/prop-types: 0 */

import React from "react";
import Profile from "../util/Profile";

function ServerSetup (props) {
    const {buttons, cursor, shake, onShakeDone, fadeAway,
        onFade, onFocus, onBlur, setID, setUsername, roomID, lock, name, playProfileInd, setProfileInd, showProfiles, pcursor} = props
    const button = (i, space=false)=>(
        <div key={i} className={`kbutton ${space ? 'space' : ''} ${i === cursor && !(lock && i !== 0) ? 'hovering' : ''}`} style={{pointerEvents : lock && i !== 0 ? 'none' : 'auto'}} onClick={() => buttons[i].onClick()}>{buttons[i].text}</div>
    )
    return (
    <div className={`menu fadeable ${fadeAway ? 'hide' : ''}`} onTransitionEnd={onFade}>
        <div className="menubox profile">
            <div className={`ssBox profile ${lock ? 'lock' : ''}`}>
                <div className="menubox">
                    <div className="pfp" style={{backgroundImage: `url(${Profile.cosm[playProfileInd].img})`}}/>
                    {button(1)}
                </div>
                <input type='text' value={name} placeholder="Enter Username" readOnly={lock} onFocus={onFocus} onBlur={onBlur} onChange={evt => setUsername(evt)}/>
            </div>
            {showProfiles ? <div className="ssBox profile">
                <div className="formGrid">
                    {Profile.cosm.map((p,i)=>(
                        <div key={i} className={`pfp ${i === playProfileInd ? 'active':''} ${cursor === 2 + Math.floor(i/6) && pcursor === i % 6? 'hovering':''}`} style={{backgroundImage: `url(${p.img})`}} onClick={()=>{buttons[1].onClick();setProfileInd(i)}}/>
                    ))}
                </div>
            </div> : null}
            {!showProfiles ?
            <div className={`ssBox ${lock ? 'lock' : ''}`}>
                <span>
                    <input className={shake ? 'shake' : ''} value={roomID} type='text' placeholder="XXXX" size="4" readOnly={lock} onFocus={onFocus} onBlur={onBlur} maxLength="4" onChange={evt => setID(evt)} onAnimationEnd={onShakeDone}/>
                </span>
                <div className="menubox across ssinner" >
                    {Array(buttons.length - 2).fill().map((_,i)=>button(i+2))}
                </div>
            </div> : null}
            {button(0,true)}
        </div>
    </div>
    )
}

export default ServerSetup