/* eslint-disable react/prop-types */

import React, { useRef } from "react";
import Nav from 'react-navtree';

const KButton = (props) => {

    let el = useRef(null)

    const {defaultFocused = false, text = "placeholder", onClick, hasSpacer = false, scrollOnFocus = false, ...rest} = props

    const setRef = (nav) => {
        el = scrollOnFocus && nav && nav.tree.el
    }

    const onInputClick = (key, ...rest) => {
        if (key === 'enter') {
            onClick(key, ...rest)
        }
    }

    const scrollTo = (behavior="smooth") => {
        el.scrollIntoView({ behavior, block: "center"})
    }

    const onInputNav = (path) => {
        if (scrollOnFocus && path) {
            scrollTo()
        }
    }


    return (
        <Nav
            className={ `kbutton ${hasSpacer ? 'space' : ''}` }
            component="button"
            defaultFocused={defaultFocused}
            ref={setRef}
            func={onInputClick}
            onNav={onInputNav}
            onPointerUp={onClick}
            onTransitionEnd={e => e.stopPropagation()}
            {...rest}
        >
            {text}
        </Nav>
    )
}

export default KButton