import React from "react"
import PropTypes from "prop-types"

const Loading = (props) => (
    <div className="lds-ring" style={{display : props.show ? 'inline-block' : 'none'}}>
        <div/><div/><div/><div/>
    </div>
)

Loading.propTypes = {
    show: PropTypes.bool.isRequired
}
export default Loading