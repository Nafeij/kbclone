/* eslint react/prop-types: 0 */

import React, { forwardRef } from "react"
import {defLength} from '../util/utils';
import Die from "./Die";

const RefBox = forwardRef((props, ref) => {
    return (
        <div className="box" ref={ref}>
            {props.children}
        </div>
    )
})

RefBox.displayName = 'RefBox'

class Tub extends React.Component {

    renderBox(i){
        return <RefBox ref={this.props.boxRefs[i]}>
            {this.props.diceList[i] ? (<Die {...this.props.diceList[i]} ref={this.props.diceList[i].fwdref}/>) : null}
        </RefBox>
    }

    render(){
        const {
            diceList, clickable, startShake, 
            animClass, flip, proccessClick,
            onShakeAnimEnd, onScoreAnimEnd, score
        } = this.props
        const fillClass =  defLength(diceList) > 2 ? 'tubB' : 'tub';
        const hoverClass = clickable ? 'hover' : ''
        const shakeClass = startShake ? 'shake' : ''
        const ordering = flip ? [2, 1, 0] : [0, 1, 2]
        return (
        <div
            className={`${fillClass} ${hoverClass} ${shakeClass}`}
            onClick={() => {
                if (clickable) proccessClick()
            }}
            onAnimationEnd={onShakeAnimEnd}>
            {this.renderBox(ordering[0])}
            {this.renderBox(ordering[1])}
            {this.renderBox(ordering[2])}
            <h1 className={`scorer ${animClass}`}
                onAnimationEnd={onScoreAnimEnd}>
                    {score}
            </h1>
        </div>
    )}
}

/*     componentDidMount(){
        this.setState({transition:'.3s'});

        setTimeout(()=>{this.setState({transform:'translateY(100px)'})},1000);

        setTimeout(()=>{this.setState({shrink:true})},1000);
    } */

export default Tub