/* eslint react/prop-types: 0 */

import React from "react";
import Profile from "../util/Profile";

const Bar = (props) => (
    <div className="barContainer">
        <div className="bar" style={{width : props.progress * 100 + "%"}}/>
    </div>
)

function CharSelect (props) {

    const {selectedAIInd, buttons, cursor, modAIInd, shakeSelect, onShakeDone, fadeAway, onFade} = props
    const translation = selectedAIInd * -20
    const translationName = selectedAIInd * -100
    const leftend = selectedAIInd === 0
    const rightend = selectedAIInd === Profile.ai.length - 1
    return (
        <div className={`menu fadeable ${fadeAway ? 'hide' : ''}`} onTransitionEnd={onFade}>
            <div className='menubox'>
                <div className='subtitle'>~ Select Opponent ∽</div>
                <div className="slidePaneContainer">
                    <div className="slidePane" style={{transform : `translateX(${translation}%)`}}>
                        {Profile.ai.map((p, i)=>(
                            <div key={i} className={`pfp simp ${i === selectedAIInd ? 'simphover':''}`} style={{backgroundImage: `url(${p.img})`}}/>
                        ))}
                    </div>
                </div>
                <div className="menubox across cselect">
                    <div className="arrowL" style={{opacity : leftend ? .2 : 1}} onClick={()=>modAIInd(-1)}>⯇</div>
                    <div className={`charInfo ${buttons[0].cursorID === cursor ? 'charInfohover' : ''} ${shakeSelect ? 'shake' : ''}`} onClick={() => buttons[0].onClick()} onAnimationEnd={()=>onShakeDone()}>
                    <div className="slidePaneContainer">
                        <div className="slidePane" style={{transform : `translateX(${translationName}%)`}}>
                        {Profile.ai.map((p, i)=>(
                            <div key={i} className={`subtitle ${i === selectedAIInd ? '':'subtitlehide'}`}>{p.name}</div>
                        ))}
                        </div>
                        </div>
                        <div className="difficulty">
                            <div className='text red'>Difficulty</div>
                            <Bar progress={Profile.ai[selectedAIInd].skill}/>
                        </div>
                    </div>
                    <div className="arrowR" style={{opacity : rightend ? .2 : 1}} onClick={()=>modAIInd(1)}>⯈</div>
                </div>
                <div className={`kbutton space ${buttons[1].cursorID === cursor ? 'hovering' : ''}`} onClick={() => buttons[1].onClick()}>{buttons[1].text}</div>
            </div>
        </div>
    )
}

export default CharSelect