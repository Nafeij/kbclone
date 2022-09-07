/* eslint react/prop-types: 0 */

import React, { forwardRef } from "react"
import Die from "./Die"

const mDieProps = {
  backgroundColor: "#ecd77a",
  borderColor: "#cdbe61",
  num : 6,
  height : '46%'
}

const MatchGraphic = forwardRef((props, ref) => (
  <div className="graphicbox" ref={ref}>
    <Die {...mDieProps}/>
    <Die {...mDieProps}/>
    <div style={{
      color: '#130a03',
      fontSize: props.graphicwidth * 0.42,
      position: 'absolute',
      transform: 'rotate(-45deg)',
      left: '15%',
      top: '41%',
    }}>☇</div>
    <div style={{
      color: '#130a03',
      fontSize: props.graphicwidth * 0.42,
      position: 'absolute',
      transform: 'rotate(135deg)',
      right: '15%',
      bottom: '41%',
    }}>☇</div>
  </div>
  )
)

MatchGraphic.displayName = 'MatchGraphic'

const dDieProps = {
  backgroundColor: "#f4b19c",
  borderColor: "#d39f8e",
  num : 6,
  height : '46%'
}

const DestroyGraphic = (props) => (
  <div className="graphicbox dest">
    <Die {...dDieProps} transform='translateX(-50%)'/>
    <Die {...dDieProps} transform='translateX(-50%)'/>
    <div style={{
      color: 'red',
      fontSize: props.graphicwidth * 0.5,
      position: 'absolute',
      left: '50%',
      top: '-13%',
      zIndex: 2,
      transform: 'scaleY(0.88) translateX(-50%)'
      }}>𐌗</div>
    <div style={{
      color: 'red',
      fontSize: props.graphicwidth * 0.5,
      position: 'absolute',
      left: '50%',
      top: '41%',
      zIndex: 2,
      transform: 'scaleY(0.88) translateX(-50%)'
      }}>𐌗</div>
  </div>
)

function HowTo (props) {
  
    const button = (msg)=>(
      <div className={`kbutton space ${props.cursorID === props.cursor ? 'hovering' : ''}`} onClick={() => props.onClick()}>{msg}</div>
    )

    // console.log(props.cursorID + ' : ' + props.cursor)
    // console.log(props.graphicwidth)
  
    return (<div className='menu'>
      <div className='menubox'>
        <div className='subtitle'>~ HOW TO PLAY ∽</div>
        <div className='text'>Your score is calculated by adding all your dice together.</div>
        <div className="menubox across">
            <div className="menubox">
                <MatchGraphic ref={props.fwdref} graphicwidth={props.graphicwidth}/>
                <div className='text red'>MATCH DICE</div>
                <div className='text'>When dice of the same number are placed in the same column, multiply their value.</div>
            </div>
            <div className='logo red'>✵</div>
            <div className="menubox">
                <DestroyGraphic graphicwidth={props.graphicwidth}/>
                <div className='text red'>DESTROY OPPONENT</div>
                <div className='text'>Destory your opponent&lsquo;s dice by matching yours to theirs.</div>
            </div>
        </div>
        {button("Got it")}
      </div>
    </div>)
}

export default HowTo