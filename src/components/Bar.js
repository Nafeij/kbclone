/* eslint react/prop-types: 0 */

import React from "react";

const Bar = (props) => (
    <div className="barContainer">
        <div className="bar" style={{width : props.progress * 100 + "%"}}>{props.text}</div>
    </div>
)

export default Bar