/* eslint react/prop-types: 0 */

import Nav from 'react-navtree'

import React from "react"
import Die from "./Die"
import KButton from './KButton'

const mDieProps = {
  diceColor: "#ecd77a",
  diceBorder: "#cdbe61",
  num : 6,
  height : '46%'
}

const MatchGraphic = () => (
  <div className="graphicbox match">
    <Die {...mDieProps}/>
    <Die {...mDieProps}/>
  </div>
)

MatchGraphic.displayName = 'MatchGraphic'

const dDieProps = {
  diceColor: "#f4b19c",
  diceBorder: "#d39f8e",
  num : 6,
  height : '46%'
}

const DestroyGraphic = () => (
  <div className="graphicbox dest">
    <Die {...dDieProps} translate='-50% 0'/>
    <Die {...dDieProps} translate='-50% 0'/>
  </div>
)

const HowTo = (props) => (
  <div className='menu'>
    <div className='menubox'>
      <div className='subtitle'>~ HOW TO PLAY ∽</div>
      <div className='text'>Your score is calculated by adding all your dice together.</div>
      <div className="menubox across">
          <div className="menubox">
              <MatchGraphic />
              <div className='text red'>MATCH DICE</div>
              <div className='text'>When dice of the same number are placed in the same column, multiply their value.</div>
          </div>
          <div className='logo red'>✵</div>
          <div className="menubox">
              <DestroyGraphic />
              <div className='text red'>DESTROY OPPONENT</div>
              <div className='text'>Destory your opponent&rsquo;s dice by matching yours to theirs.</div>
          </div>
      </div>
      <KButton text="Got it" navId="howToReturn" onClick={props.onClick} hasSpacer defaultFocused/>
    </div>
  </div>
)

export default HowTo