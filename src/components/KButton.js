import React, { useRef } from "react";
import PropTypes from "prop-types";
import Nav from 'react-navtree';

const KButton = (props) => {

    let el = useRef(null)

    const {defaultFocused, text, onClick, hasSpacer, scrollOnFocus, ...rest} = props

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
        <Nav className={ `kbutton ${hasSpacer ? 'space' : ''}` }
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

KButton.propTypes = {
    defaultFocused: PropTypes.bool,
    text: PropTypes.string,
    onClick: PropTypes.func,
    hasSpacer: PropTypes.bool,
    scrollOnFocus: PropTypes.bool
}

KButton.defaultProps = {
    defaultFocused: false,
    text: "placeholder",
    onClick: () => {},
    hasSpacer: false,
    scrollOnFocus: false
}

export default KButton