/* eslint react/prop-types: 0 */

import React from "react";

function ServerSetup (props) {
    const {buttons, cursor, shake, onShakeDone, fadeAway, onFade, onFocus, onBlur, setID, setUsername, roomID, lock} = props
    const button = (i)=>(
        <div key={i} className={`kbutton ${buttons[i].cursorID === cursor && !(lock && i < buttons.length - 1) ? 'hovering' : ''}`} style={{pointerEvents : lock && i < buttons.length - 1 ? 'none' : 'auto'}} onClick={() => buttons[i].onClick()} >{buttons[i].text}</div>
    )
    return (
    <div className={`menu fadeable ${fadeAway ? 'hide' : ''}`} onTransitionEnd={onFade}>
        <div className="menubox">
            <div className={`ssBox ${lock ? 'lock' : ''}`}>
                    <div className='subtitle'>Username</div>
                    <input type='text' placeholder="-" readOnly={lock} onFocus={onFocus} onBlur={onBlur} onChange={evt => setUsername(evt)}/>
                </div>
                <div className={`ssBox ${lock ? 'lock' : ''}`}>
                    <input className={shake ? 'shake' : ''} value={roomID} type='text' placeholder="XXXX" size="4" readOnly={lock} onFocus={onFocus} onBlur={onBlur} maxLength="4" onChange={evt => setID(evt)} onAnimationEnd={onShakeDone}/>
                    <div className="menubox across ssinner" >
                        {Array(buttons.length - 1).fill().map((_,i)=>button(i))}
                    </div>
            </div>
            {button(buttons.length - 1)}
        </div>
    </div>
    )
}

export default ServerSetup