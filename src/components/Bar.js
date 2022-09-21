/* eslint react/prop-types: 0 */

import React from "react";

const Bar = (props) => (
    <div className="barContainer">
        {props.text ? <p>{props.text}</p> : null}
        <div className="bar" style={{width : props.progress * 100 + "%", backgroundColor: props.cheat ? '#01d5a2' : 'red'}}/>
    </div>
)

export default Bar