/* eslint react/prop-types: 0 */

import React from "react"
import Die from "./Die"
import Tub from "./Tub"
import { timeFormat } from "../util/utils"

const Timer = (props) => (
    <div className="timer" style={{color : props.color}}>{props.time}</div>
)

class Side extends React.Component {
    renderTub(i){
        const id = this.props.id
        return (<Tub
            {...this.props.tubProps[i]}
            key = {i}
            diceList={this.props.diceMatrix[i]}
            clickable={this.props.tubsClickable}
            flip={this.props.id}
            proccessClick={() => {if (this.props.tubsClickable) this.props.proccessClick(i, id)}}
            onShakeAnimEnd={() => this.props.onShakeAnimEnd(i, id)}
            cursor={this.props.cursor}
        />)
    }

    render(){
        const {id, newDice, score, turn, rolled, slid, hasSlid, scoreShown, scoreShake, onSideScoreAnimEnd, profile, numTubs, name, rollRef, time} = this.props
        const dname = name ? name : profile.name
        const isTurn = turn === id
        const shakeClass = scoreShake && scoreShown ? 'shake' : ''
        const timer = time === null ? time : <Timer time={timeFormat(time)} color={time > 5 || time === -1? 'white' : 'red'}/>
        return (
            <div className="side" id={id ? "player" : "opponent"}>
            <div className="board">
                <div 
                    className='roller' onAnimationEnd={()=>{if (isTurn && !rolled){
                        // console.log('test')
                        hasSlid()
                    }}}> 
                    <div className={`rollbox ${isTurn && slid? "rollboxhover" : ""}`} ref={rollRef}>
                        {newDice ? <Die {...newDice} ref={newDice.fwdref}/> : null}
                    </div>
                </div>
                <div className="tubs">
                    <div className="tubbox" style={{gridTemplateColumns: `repeat(${numTubs},minmax(0,1fr))`}}>
                        {Array(numTubs).fill().map((_,i)=>this.renderTub(i))}
                    </div>
                </div>
                <div className="info">
                    <div className={`pfp ${isTurn && slid? "" : "pfphover"}`} style={{backgroundImage: `url(${profile.img})`, transform: (profile.skill === undefined && !id) ? 'scaleX(-1)' : 'none'}}/>
                    <h2 className="name">{`~ ${dname} ~`}</h2>
                    <div className={`scorebox ${shakeClass}`} style={{opacity : scoreShown || time !== null ? 1 : 0}} onAnimationEnd={onSideScoreAnimEnd}>{score}{timer}</div>
                </div>
            </div>
        </div>
        )
    }
}

export default Side