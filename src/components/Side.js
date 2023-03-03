import React from "react"
import PropTypes from "prop-types"
import Nav, { navHorizontal } from 'react-navtree'

import Bar from "./Bar"
import Die from "./Die"
import Tub from "./Tub"

import heartsImg from "../img/hearts.png"
import rollerImg from "../img/sprites.png"
import { timeFormat } from "../util/Utils"
import Squiggle from "./Squiggle"

const Timer = (props) => (
    <div className="timer" style={{color : props.color}}>{props.time}</div>
)

Timer.propTypes = {
    time: PropTypes.node.isRequired,
    color: PropTypes.string.isRequired
}

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
            flip={!!this.props.id}
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
            timer = time !== null && profile.skill === undefined ? <Timer time={timeFormat(time)} color={time > 5 || time === -1? 'white' : 'red'}/> : null,
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
                        <Nav className="tubbox" style={{maxWidth}} defaultFocused={isTurn} func={navHorizontal} navId={'' + id}>
                            {Array(numTubs).fill().map((_,i)=>this.renderTub(i))}
                        </Nav>
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

Side.propTypes = {
    id: PropTypes.number.isRequired,
    newDice: PropTypes.object,
    score: PropTypes.number.isRequired,
    turn: PropTypes.number.isRequired,
    rolled: PropTypes.bool.isRequired,
    slid: PropTypes.bool.isRequired,
    hasSlid: PropTypes.func.isRequired,
    scoreShown: PropTypes.bool.isRequired,
    scoreShake: PropTypes.bool.isRequired,
    onSideScoreAnimEnd: PropTypes.func.isRequired,
    profile: PropTypes.shape({
        name: PropTypes.string.isRequired,
        img: PropTypes.string.isRequired,
        skill: PropTypes.number,
        effects: PropTypes.arrayOf(PropTypes.string)
    }).isRequired,
    numTubs: PropTypes.number.isRequired,
    name: PropTypes.string,
    rollRef: PropTypes.object.isRequired,
    tubsRef: PropTypes.object.isRequired,
    time: PropTypes.number,
    lives: PropTypes.number,
    maxLives: PropTypes.number,
    maxWidth: PropTypes.string,
    boxAspectRatio: PropTypes.number.isRequired,
    tubLen: PropTypes.number.isRequired,
    tubsClickable: PropTypes.bool.isRequired,
    proccessClick: PropTypes.func.isRequired,
    onShakeAnimEnd: PropTypes.func.isRequired,
    diceMatrix: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
    tubProps: PropTypes.arrayOf(PropTypes.object).isRequired
}