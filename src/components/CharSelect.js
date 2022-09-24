/* eslint react/prop-types: 0 */

import React from "react";
import Profile from "../util/Profile";
import Bar from "./Bar";
import skullImg from "../img/skulls.png"
import skullRImg from "../img/skulls_red.png"
import skullBImg from "../img/skulls_blue.png"
import heartsImg from "../img/hearts.png"
import sprites from "../img/sprites.png"
import Squiggle from "./Squiggle"

function CharSelect (props) {

    const {selectedAIInd, buttons, cursor, modAIInd, fadeAway, onFade} = props,
        translation = selectedAIInd * (-100 / Profile.ai.length),
        translationName = selectedAIInd * -100,
        leftend = selectedAIInd === 0,
        rightend = selectedAIInd === Profile.ai.length - 1
    let effect = null, cheat = false
    Profile.ai[selectedAIInd].effects.forEach(e=>{
        switch (e) {
            case 'life2': effect = {text : 'Lives', val : 2 / 3, heartsImg}
                break
            case 'life3': effect = {text : 'Lives', val : 3 / 3, heartsImg}
                break
            case 'cheat': cheat = true
                break
            default:
                break
        }
    })
    return (
        <div className={`menu fadeable ${fadeAway ? 'hide' : ''}`} onTransitionEnd={onFade}>
            <div className='menubox'>
                <div className='subtitle'><Squiggle/>Select Opponent<Squiggle/></div>
                <div className="slidePaneContainer">
                    <div className="slidePane" style={{transform : `translateX(${translation}%)`}}>
                        {Profile.ai.map((p, i)=>(
                            <div key={i} className={`pfp simp ${i === selectedAIInd ? 'simphover':''}`} style={{backgroundImage: `url(${p.img})`}}/>
                        ))}
                    </div>
                </div>
                <div className="menubox across cselect">
                    <div className={`arrowL ${leftend ? 'greyed':''}`} style={{backgroundImage:`url(${sprites})`}} onClick={()=>modAIInd(-1)} />
                    <div className={`charInfo ${buttons[0].cursorID === cursor ? 'charInfohover' : ''}`} onClick={() => buttons[0].onClick()}>
                    <div className="slidePaneContainer">
                        <div className="slidePane" style={{transform : `translateX(${translationName}%)`}}>
                        {Profile.ai.map((p, i)=>(
                            <div key={i} className={`subtitle ${i === selectedAIInd ? '':'subtitlehide'}`}>{p.name}</div>
                        ))}
                        </div>
                    </div>
                    <div className="difficulty" style={{gridColumn : effect ? '1 /span 1' : '1 /span 2'}}>
                        <div className='text red' style={{color : cheat ? '#01d5a2' : 'red'}}>Difficulty</div>
                        <Bar progress={Profile.ai[selectedAIInd].skill} 
                            baseImg={skullImg} 
                            fillImg={cheat ? skullBImg : skullRImg}
                            dim={{width: '12vmin', height : '2.56vmin'}}
                        />
                    </div>
                    {effect ? 
                    <div className="difficulty">
                        <div className='text red'>{effect.text}</div>
                        <Bar progress={effect.val} fillImg={heartsImg} dim={{width: '6.94vmin', height : '2.56vmin'}}/>
                    </div>
                    : null}
                    </div>
                    <div className={`arrowR ${rightend ? 'greyed':''}`} style={{backgroundImage:`url(${sprites})`}} onClick={()=>modAIInd(1)} />
                </div>
                <div className={`kbutton space ${buttons[1].cursorID === cursor ? 'hovering' : ''}`} onClick={() => buttons[1].onClick()}>{buttons[1].text}</div>
            </div>
        </div>
    )
}

export default CharSelect