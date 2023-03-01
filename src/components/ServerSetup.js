/* eslint react/prop-types: 0 */

import React, { useEffect, useRef } from "react";
import Nav, { navDynamic } from "react-navtree";

import Profile from "../util/Profile";
import KButton from "./KButton";
import NavInput from "./NavInput";
import PicSelect from "./PicSelect";


export default function ServerSetup (props) {
    const {buttons, shake, onShakeDone, fadeAway,
        onFade, setID, setUsername, roomID, lock, name, playProfileInd, setProfileInd, showProfiles} = props
    const returnId = 'return'
    const button = (i, space = false)=>(
        <KButton
            navId={i === 0 ? returnId : null}
            key={i}
            hasSpacer={space}
            defaultFocused={i === 0}
            style={{pointerEvents : lock && i !== 0 ? 'none' : 'auto'}}
            onClick={() => buttons[i].onClick()}
            text={buttons[i].text}
        />
    )
    let tree = useRef(null)
    useEffect(() => {
        if (lock) {
            tree && tree.current && tree.current.focus([returnId])
        }
    }, [lock])
    return (
    <div className={`menu fadeable ${fadeAway ? 'hide' : ''}`} onTransitionEnd={()=>onFade(fadeAway)}>
        <Nav className="menubox profile" func={(key, navTree, focusedNode) => {
            if (lock) return returnId
            tree.current = navTree
            // console.log(tree)
            return navDynamic(key, navTree, focusedNode)
        }}>
            <Nav className="menubox">
                <Nav className={`ssBox profile ${lock ? 'lock' : ''}`} func={navDynamic}>
                    <div className="menubox">
                        <div className="pfp" style={{backgroundImage: `url(${Profile.cosm[playProfileInd].img})`}}/>
                        {button(1)}
                    </div>
                    <NavInput value={name} placeholder="Enter Username" readOnly={lock} onChange={evt => setUsername(evt)}/>
                </Nav>
                {showProfiles &&
                    <div className="ssBox profile">
                        <PicSelect playProfileInd={playProfileInd} onClick={i => {
                            setProfileInd(i)
                            buttons[1].onClick()
                        }}/>
                    </div>
                }
                {!showProfiles &&
                    <div className={`ssBox ${lock ? 'lock' : ''}`}>
                        <span>
                            <NavInput className={shake ? 'shake' : ''} value={roomID} placeholder="XXXX" size="4" readOnly={lock} maxLength="4" onChange={evt => setID(evt)} onAnimationEnd={onShakeDone}/>
                        </span>
                        <div className="menubox across ssinner" >
                            {Array(buttons.length - 2).fill().map((_,i)=>button(i+2))}
                        </div>
                    </div>
                }
            </Nav>
            {button(0,true)}
        </Nav>
    </div>
    )
}