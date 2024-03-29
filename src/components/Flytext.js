import React from "react"
import PropTypes from "prop-types"
import KButton from "./KButton"

export default function Flytext(props){
  return props.display ? (
    <div id="flytext"
      className={props.show ? 'show' : ''}
      onTransitionEnd={props.slideEnd}
    >
        <p id="result">{props.message}</p>
        {props.timeOut < 0 &&
          <div className="menubox across">
            {props.buttons.map((b,i)=>(
              <KButton key={i} defaultFocused={i === 0} className={`kbutton ${(props.hover && i === 0)? 'hovering' : ''}`} onClick={b.onClick} text={b.text}/>
            ))}
          </div>
        }
    </div>
	) : null
}

Flytext.propTypes = {
  display: PropTypes.bool.isRequired,
  show: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  slideEnd: PropTypes.func,
  timeOut: PropTypes.number.isRequired,
  buttons: PropTypes.arrayOf(PropTypes.shape({
    text: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
  })),
  hover: PropTypes.bool
}