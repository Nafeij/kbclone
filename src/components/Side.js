/* eslint react/prop-types: 0 */

import React from "react"
import Die from "./Die"
import Tub from "./Tub"
import Profile from "../util/profile"

class Side extends React.Component {
    renderTub(i){
        return (<Tub
            {...this.props.tubProps[i]}
            key = {i}
            diceList={this.props.diceMatrix[i]}
            clickable={this.props.tubsClickable}
            flip={this.props.id}
            proccessClick={() => {if (this.props.tubsClickable) this.props.proccessClick(i)}}
            onShakeAnimEnd={() => this.props.onShakeAnimEnd(i)}
            cursor={this.props.cursor}
        />)
    }

    render(){
        const {id, newDice, score, turn, rolled, slid, hasSlid, scoreShown, scoreShake, onSideScoreAnimEnd, pfp, numTubs, name} = this.props
        const dname = name ? name : Profile.names[pfp]
        const isTurn = turn === id
        const shakeClass = scoreShake && scoreShown ? 'shake' : ''
        return (
            <div className="side" id={id ? "player" : "opponent"}>
            <div className="board">
                <div 
                    className='roller' onAnimationEnd={()=>{if (isTurn && !rolled){
                        // console.log('test')
                        hasSlid()
                    }}}> 
                    <div className={`rollbox ${isTurn && slid? "rollboxhover" : ""}`}>
                        {newDice ? <Die {...newDice} ref={newDice.fwdref}/> : null}
                    </div>
                </div>
                <div className="tubs">
                    <div className="tubbox" /* style={{gridTemplateColumns: `repeat(${numTubs},minmax(0,1fr))`}} */>
                        {Array(numTubs).fill().map((_,i)=>this.renderTub(i))}
                    </div>
                </div>
                <div className="info">
                    <div className={`pfp ${isTurn && slid? "" : "pfphover"}`} style={{backgroundImage: `url(${Profile.imgs[pfp]})`, transform: (!pfp && !id) ? 'scaleX(-1)' : ''}}/>
                    <h2 className="name">{`~ ${dname} ~`}</h2>
                    <div className={`scorebox ${shakeClass}`} style={{opacity : scoreShown ? 1 : 0}} onAnimationEnd={onSideScoreAnimEnd}>{score}</div>
                </div>
            </div>
        </div>
        )
    }
}

export default Side