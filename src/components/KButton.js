/* eslint-disable react/prop-types */

import React from "react";
import Nav from 'react-navtree'

const KButton = (props) => {
    const {defaultFocused = false, text = "placeholder", navId, onClick, hasSpacer = false} = props
    return (
        <Nav
            className='nav-block'
            defaultFocused={defaultFocused}
            navId={navId}
            func={ key => {key === 'enter' && onClick()} }>
            <button
                className={ `kbutton ${hasSpacer ? 'space' : ''}` }
                onPointerUp={onClick}
                onClick={onClick}
                onTransitionEnd={e => e.stopPropagation()}
            >
                {text}
            </button>
        </Nav>
    )
}

export default KButton