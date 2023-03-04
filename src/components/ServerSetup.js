import React, { useEffect, useRef } from "react"
import PropTypes from "prop-types"
import Nav, { navDynamic } from "react-navtree"

import Profile from "../util/Profile"
import KButton from "./KButton"
import NavInput from "./NavInput"
import PicSelect from "./PicSelect"

export default function ServerSetup (props) {

    const {buttons, shake, onShakeDone, setID, setUsername, roomID, lock, name, playProfileInd, setProfileInd, showProfiles} = props
    const returnId = 'return'

    const button = (i, space = false)=>(
        <KButton
            navId={i === 0 ? returnId : null}
            key={i}
            hasSpacer={space}
            defaultFocused={i === 0}
            style={{pointerEvents : lock && i !== 0 ? 'none' : 'auto'}}
            onClick={buttons[i].onClick}
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
    <div className='menu'>
        <Nav className="menubox profile" func={(key, navTree, focusedNode) => {
            if (lock) return returnId
            tree.current = navTree
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

ServerSetup.propTypes = {
    buttons: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string.isRequired,
        onClick: PropTypes.func.isRequired
    })).isRequired,
    shake: PropTypes.bool.isRequired,
    onShakeDone: PropTypes.func.isRequired,
    setID: PropTypes.func.isRequired,
    setUsername: PropTypes.func.isRequired,
    roomID: PropTypes.string.isRequired,
    lock: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired,
    playProfileInd: PropTypes.number.isRequired,
    setProfileInd: PropTypes.func.isRequired,
    showProfiles: PropTypes.bool.isRequired
}