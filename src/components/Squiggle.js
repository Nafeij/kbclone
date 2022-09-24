/* eslint react/prop-types: 0 */

import React from "react";
import sprites from "../img/sprites.png"

const Squiggle = ()=>(
    <div className='squiggle' style={{backgroundImage : `url(${sprites})`}}/>
)

export default Squiggle