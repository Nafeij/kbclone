/* eslint react/prop-types: 0 */

import React from "react"
import Nav from "react-navtree"

import Profile from "../util/Profile"
import SlidePane from "./SlidePane"
import KButton from "./KButton"
import Bar from "./Bar"

import Squiggle from "./Squiggle"
import skullImg from "../img/skulls.png"
import skullRImg from "../img/skulls_red.png"
import skullBImg from "../img/skulls_blue.png"
import heartsImg from "../img/hearts.png"
import sprites from "../img/sprites.png"

export default function CharSelect (props) {

    const {selectedAIInd, buttons, modAIInd,
            fadeAway, onFade, modSetAIInd, hasWrapped} = props,
        translation = -selectedAIInd / Profile.ai.length,
        translationName = selectedAIInd * -100
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
        <div className={`menu fadeable ${fadeAway ? 'hide' : ''}`} onTransitionEnd={()=>onFade(fadeAway)}>
            <div className='menubox'>
                <div className='subtitle'><Squiggle/>Select Opponent<Squiggle/></div>
                <div className="slidePaneContainer">
                    <SlidePane translateX={translation} hasWrapped={hasWrapped} releaseCallback={modSetAIInd} numSep={Profile.ai.length}>
                        {Profile.ai.map((p, i)=>(
                            <div key={i} className="pfp simp" loading='lazy' style={{
                                backgroundImage: `url(${p.img})`,
                                opacity: i === selectedAIInd ? 1 : .6,
	                            scale: i === selectedAIInd ? '1' : '.8'
                            }}/>
                        ))}
                    </SlidePane>
                </div>
                <Nav className="menubox across cselect"
                    func={key => {
                        if (key === 'left') {
                            modAIInd(-1)
                        } else if (key === 'right') {
                            modAIInd(1)
                        } else if (key === 'enter') {
                            buttons[0].onClick()
                        }
                    }
                }>
                    <div className="arrowL" style={{backgroundImage:`url(${sprites})`}} onClick={()=>modAIInd(-1)} />
                    <div className="charInfo" onClick={() => buttons[0].onClick()}>
                    <div className="slidePaneContainer">
                        <div className="slidePane" style={{translate: translationName + '%'}}>
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
                            dim={{width: '8rem', height : '1.7081rem'}}
                        />
                    </div>
                    {effect &&
                        <div className="difficulty">
                            <div className='text red'>{effect.text}</div>
                            <Bar progress={effect.val} fillImg={heartsImg} dim={{width: '5rem', height : '1.843rem'}}/>
                        </div>
                    }
                    </div>
                    <div className="arrowR" style={{backgroundImage:`url(${sprites})`}} onClick={()=>modAIInd(1)} />
                </Nav>
                <KButton className={`kbutton space`} onClick={() => buttons[1].onClick()} text={buttons[1].text}/>
            </div>
        </div>
    )
}