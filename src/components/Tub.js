import React, { forwardRef } from "react"
import PropTypes from "prop-types"
import Nav from "react-navtree"

import { isFull } from '../util/Utils'
import Die from "./Die"

const RefBox = forwardRef((props, ref) => {
    return (
        <div className="box" ref={ref} style={{aspectRatio : props.aspectRatio}}>
            {props.children}
        </div>
    )
})

RefBox.displayName = 'RefBox'

RefBox.propTypes = {
    aspectRatio: PropTypes.number.isRequired,
    children: PropTypes.node
}

export default class Tub extends React.Component {

    renderBox(i){
        return <RefBox key={i} aspectRatio={this.props.boxAspectRatio} ref={this.props.boxRefs[i]}>
            {this.props.diceList[i] ? (<Die {...this.props.diceList[i]} ref={this.props.diceList[i].fwdref}/>) : null}
        </RefBox>
    }

    render(){
        const { tubLen, diceList, clickable, startShake, animClass, flip, proccessClick,
            onShakeAnimEnd, onScoreAnimEnd, score, scoreScale, caravan, scoreHover} = this.props
        const fillClass = (
                caravan &&
                score >= caravan[0] &&
                score <= caravan[1]) ?
            'tubC' : (
                isFull(diceList) ?
            'tubB' : ''
        );
        const hoverClass = clickable ? 'hover' : ''
        const shakeClass = startShake ? 'shake' : ''
        const ordering = Array(tubLen).fill().map((_,i)=>i)
        if (!flip) ordering.reverse()
        return (
            <Nav className='tubOuter'
                onNav={(path) => {clickable && scoreHover(!!path)}}
                func={(key) => {
                    key === 'enter' && proccessClick()
                }}
            >
                <div
                className={`tub ${fillClass} ${hoverClass} ${shakeClass}`}
                onPointerEnter={()=>{if (clickable) scoreHover(true)}}
                onPointerLeave={()=>{if (clickable) scoreHover(false)}}
                onPointerUp={proccessClick}
                onAnimationEnd={onShakeAnimEnd}>
                    {ordering.map((i)=>this.renderBox(i))}
                </div>
                <h1 className={`scorer ${animClass}`}
                    onAnimationEnd={onScoreAnimEnd} style={{scale : scoreScale}}>
                        {score ? score : '\u00A0'}
                </h1>
            </Nav>
        )
    }
}

Tub.propTypes = {
    tubLen: PropTypes.number.isRequired,
    boxAspectRatio: PropTypes.number.isRequired,
    diceList: PropTypes.array.isRequired,
    clickable: PropTypes.bool.isRequired,
    startShake: PropTypes.bool.isRequired,
    animClass: PropTypes.string.isRequired,
    flip: PropTypes.bool.isRequired,
    proccessClick: PropTypes.func.isRequired,
    onShakeAnimEnd: PropTypes.func.isRequired,
    onScoreAnimEnd: PropTypes.func.isRequired,
    score: PropTypes.number,
    scoreScale: PropTypes.string.isRequired,
    caravan: PropTypes.array,
    scoreHover: PropTypes.func.isRequired,
    boxRefs: PropTypes.array.isRequired
}