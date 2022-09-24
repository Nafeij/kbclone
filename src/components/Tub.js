/* eslint react/prop-types: 0 */

import React, { forwardRef } from "react"
import {defLength, isFull, timeFormat} from '../util/utils';
import Die from "./Die";

const RefBox = forwardRef((props, ref) => {
    return (
        <div className="box" ref={ref}>
            {props.children}
        </div>
    )
})

{/* <div className="stretchbox">
            <div className="box" ref={ref}>
                {props.children}
            </div>
        </div> */} //TODO

RefBox.displayName = 'RefBox'

class Tub extends React.Component {

    renderBox(i){
        return <RefBox key={i} ref={this.props.boxRefs[i]}>
            {this.props.diceList[i] ? (<Die {...this.props.diceList[i]} ref={this.props.diceList[i].fwdref}/>) : null}
        </RefBox>
    }

    render(){
        const {
            tubLen, diceList, clickable, startShake, 
            animClass, flip, proccessClick,
            onShakeAnimEnd, onScoreAnimEnd, score, scoreTransform, cursor, cursorID, caravan, scoreHover} = this.props
        const active = cursor === cursorID 
        const fillClass = (
                caravan && 
                score >= caravan[0] && 
                score <= caravan[1]) ? 
            'tubC' : (
                isFull(diceList) ? 
            'tubB' : 'tub'
        );
        const hoverClass = clickable ? 'hover' : ''
        const keyHoverClass = active ? 'hovering' : ''
        const shakeClass = startShake ? 'shake' : ''
        const ordering = Array(tubLen).fill().map((_,i)=>i)
        if (!flip) ordering.reverse()
        // if (clicked) console.log('pressed' + cursorID + cursor)
        // if (clicked() && active) {proccessClick()}
        return (
        <div
            className={`${fillClass} ${hoverClass} ${keyHoverClass} ${shakeClass}`}
            onMouseEnter={()=>{if (clickable) scoreHover(true)}}
            onMouseLeave={()=>{if (clickable) scoreHover(false)}}
            onClick={()=>{if (clickable) proccessClick()}}
            onAnimationEnd={onShakeAnimEnd}>
            {ordering.map((i)=>this.renderBox(i))}
            <h1 className={`scorer ${animClass}`}
                onAnimationEnd={onScoreAnimEnd} style={{transform : scoreTransform}}>
                    {score}
            </h1>
        </div>
    )}
}

export default Tub