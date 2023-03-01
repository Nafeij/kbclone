/* eslint react/prop-types: 0 */

import React from "react"
import Nav, { navHorizontal } from "react-navtree"
import KButton from "./KButton"

export default function Flytext(props){
  return (
    <Nav id="flytext"
      className={props.show ? 'show' : ''}
      onTransitionEnd={props.slideEnd}
      func={(key, navTree, focusedNode) => (props.show ? navHorizontal(key, navTree, focusedNode) : false)}
    >
        <p id="result">{props.message}</p>
        {props.timeOut < 0 &&
          <div className="menubox across">
            {props.buttons.map((b,i)=>(
              <KButton key={i} defaultFocused={i === 0} className={`kbutton ${(props.hover && i === 0)? 'hovering' : ''}`} onClick={b.onClick} text={b.text}/>
            ))}
          </div>
        }
    </Nav>
	)
}