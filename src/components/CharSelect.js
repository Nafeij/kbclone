/* eslint react/prop-types: 0 */

import React from "react";
import Profile from "../util/profile";

const Bar = (props) => (
    <div className="barContainer">
        <div className="bar" style={{width : props.progress * 100 + "%"}}/>
    </div>
)

function CharSelect (props) {

    const {selectedpfp, buttons, cursor, incrementPfp, decrementPfp, shakeSelect, onShakeDone, fadeAway, onFade} = props
    const translation = (selectedpfp - 1) * -20
    const translationName = (selectedpfp - 1) * -100
    const leftend = selectedpfp <= 1
    const rightend = selectedpfp >= Profile.names.length - 1
    return (
        <div className={`menu fadeable ${fadeAway ? 'hide' : ''}`} onTransitionEnd={onFade}>
            <div className='menubox'>
                <div className='subtitle'>~ Select Opponent ∽</div>
                <div className="slidePaneContainer">
                    <div className="slidePane" style={{transform : `translateX(${translation}%)`}}>
                        {Array(Profile.names.length - 1).fill(null).map((_, i)=>(
                            <div key={i} className={`pfp simp ${i + 1 === selectedpfp ? 'simphover':''}`} style={{backgroundImage: `url(${Profile.imgs[i + 1]})`}}/>
                        ))}
                    </div>
                </div>
                <div className="menubox across cselect">
                    <div className="arrowL" style={{opacity : leftend ? .2 : 1}} onClick={()=>decrementPfp()}>⯇</div>
                    <div className={`charInfo ${buttons[0].cursorID === cursor ? 'charInfohover' : ''} ${shakeSelect ? 'shake' : ''}`} onClick={() => buttons[0].onClick()} onAnimationEnd={()=>onShakeDone()}>
                    <div className="slidePaneContainer">
                        <div className="slidePane" style={{transform : `translateX(${translationName}%)`}}>
                        {Array(Profile.names.length - 1).fill(null).map((_, i)=>(
                            <div key={i} className={`subtitle ${i + 1 === selectedpfp ? '':'subtitlehide'}`}>{Profile.names[i + 1]}</div>
                        ))}
                        </div>
                        </div>
                        <div className="difficulty">
                            <div className='text red'>Difficulty</div>
                            <Bar progress={Profile.skill[selectedpfp]}/>
                        </div>
                    </div>
                    <div className="arrowR" style={{opacity : rightend ? .2 : 1}} onClick={()=>incrementPfp()}>⯈</div>
                </div>
                <div className={`kbutton space ${buttons[1].cursorID === cursor ? 'hovering' : ''}`} onClick={() => buttons[1].onClick()}>{buttons[1].text}</div>
            </div>
        </div>
    )
}

export default CharSelect