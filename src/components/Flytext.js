/* eslint react/prop-types: 0 */

import React from "react";

function Flytext(props){
  // const active = props.cursor === props.cursorID
  // if (props.clicked() && active) {props.restart()}
  
  //console.log(props.style)
  return (
  <div id="flytext" className={props.show ? 'show' : ''} onTransitionEnd={() => {
    props.slideEnd()
    }}>
          <p id="result">{props.message}</p>
          {props.timeOut < 0 ? props.buttons.map((b,i)=>(
            <div key={i} className={`kbutton ${b.cursorID === props.cursor ? 'hovering' : ''}`} onClick={() => b.onClick()}>{b.text}</div>
          )) : null}
      </div>
	)
}

export default Flytext