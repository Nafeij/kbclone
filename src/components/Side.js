/* eslint react/prop-types: 0 */

import React from "react"
import Die from "./Die"
import Tub from "./Tub"
import { timeFormat } from "../util/Utils"
import Bar from "./Bar"
import rollerImg from "../img/sprites.png"
import heartsImg from "../img/hearts.png"
import Squiggle from "./Squiggle"

const Timer = (props) => (
    <div className="timer" style={{color : props.color}}>{props.time}</div>
)

export default class Side extends React.Component {
    renderTub(i){
        const id = this.props.id
        return (<Tub
            {...this.props.tubProps[i]}
            boxAspectRatio={this.props.boxAspectRatio}
            tubLen={this.props.tubLen}
            key = {i}
            diceList={this.props.diceMatrix[i]}
            clickable={this.props.tubsClickable}
            flip={this.props.id}
            proccessClick={() => {if (this.props.tubsClickable) this.props.proccessClick(i, id)}}
            onShakeAnimEnd={() => this.props.onShakeAnimEnd(i, id)}
        />)
    }

    render(){
        const {id, newDice, score, turn, rolled, slid, hasSlid, scoreShown, scoreShake, onSideScoreAnimEnd,
            profile, numTubs, name, rollRef, tubsRef, time, lives, maxLives, maxWidth} = this.props,
            dname = name ? name : profile.name,
            isTurn = turn === id,
            shakeClass = scoreShake && scoreShown ? 'shake' : '',
            timer = time === null || profile.skill !== undefined ? null :
                <Timer time={timeFormat(time)} color={time > 5 || time === -1? 'white' : 'red'}/>,
            hBar = maxLives ? <Bar progress={(lives + 1) / 3}
                fillImg={heartsImg}
                dim={{width: '8.14vmin', height : '3vmin'}}/>
                : null
        return (
            <div className="side" id={id ? "player" : "opponent"}>
            <div className="board">
                <div
                    className='roller' onAnimationEnd={()=>{if (isTurn && !rolled){
                        // console.log('test')
                        hasSlid()
                    }}}>
                    <div className={`rollbox ${isTurn && slid? "rollboxhover" : ""} ${profile.effects && !!profile.effects.length ? 'rollboxBoss' :''}`}
                        style={{backgroundImage: `url(${rollerImg})`}} ref={rollRef}>
                        {newDice ? <Die {...newDice} ref={newDice.fwdref}/> : null}
                    </div>
                </div>
                <div className="tubs" ref={tubsRef}>
                    <div className="tubbox" style={{maxWidth : maxWidth}}>
                        {Array(numTubs).fill().map((_,i)=>this.renderTub(i))}
                    </div>
                </div>
                <div className="info">
                    <div className={`pfp ${isTurn && slid? "" : "pfphover"}`}
                        style={{
                            backgroundImage: `url(${profile.img})`,
                            scale: (profile.skill === undefined && !id) ? '-1 1' : 'none'
                        }}
                    />
                    <h2 className="name"><Squiggle/>{dname}<Squiggle/></h2>
                    <div className={`scorebox ${shakeClass}`}
                        style={{opacity : scoreShown || time !== null || maxLives !== null ? 1 : 0}}
                        onAnimationEnd={onSideScoreAnimEnd}>{score}{timer}{hBar}</div>
                </div>
            </div>
        </div>
        )
    }
}