/* eslint react/prop-types: 0 */

import React from "react";

const Bar = (props) => (
    <div className="barContainer" style={{
            backgroundImage: props.baseImg ? `url(${props.baseImg})` : "none",
            width: props.dim.width,
            height: props.dim.height
        }}>
        <div className="bar" style={{
            width : props.progress * 100 + "%", 
            backgroundImage: `url(${props.fillImg})`,
            margin: props.baseImg ? 0 : 'auto'
        }}/>
    </div>
)

export default Bar