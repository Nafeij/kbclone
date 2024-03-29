import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import Nav, { navDynamic } from 'react-navtree'

import Profile from '../util/Profile'

const PicSelect = (props) => {

    const scrollRefs = useRef(Array(Profile.cosm.length))

    const scrollTo = (index, behavior = "smooth") => {
        scrollRefs.current[index].scrollIntoView({ behavior, block: "center"})
    }

    const setRef = (nav, i) => {
        scrollRefs.current[i] = nav && nav.tree.el
    }

    const inputFunc = (i) => (key) => {
        if (key === 'enter') {
            props.onClick(i); return
        }
        if (key === 'up' || key === 'down') {
            scrollTo(i)
        }
    }

    useEffect(() => {
        scrollTo(props.playProfileInd, "auto")
    }, [])

    return (
        <Nav navId="formGrid" className="formGrid" func={navDynamic}>
            {Profile.cosm.map((p,i)=>(
                <Nav
                    key={i}
                    defaultFocused={i === props.playProfileInd}
                    className={`nav-block pfp ${i === props.playProfileInd ? 'active':''}`}
                    loading='lazy' style={{backgroundImage: `url(${p.img})`}}
                    onPointerUp={() => props.onClick(i)}
                    ref={ (nav) => setRef(nav, i) }
                    func={inputFunc(i)}
                />
            ))}
        </Nav>
    )
}

PicSelect.propTypes = {
    playProfileInd: PropTypes.number.isRequired,
    onClick: PropTypes.func.isRequired
}

export default PicSelect