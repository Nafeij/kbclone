/* eslint react/prop-types: 0 */

import React from "react"

const Loading = (props) => (
    <div className="lds-ring" style={{display : props.show ? 'inline-block' : 'none'}}>
        <div/><div/><div/><div/>
    </div>
)

export default Loading