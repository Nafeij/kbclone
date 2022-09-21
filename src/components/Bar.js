/* eslint react/prop-types: 0 */

import React from "react";

const Bar = (props) => (
    <div className="barContainer">
        <div className="bar" style={{width : props.progress * 100 + "%"}}/>
    </div>
)

export default Bar