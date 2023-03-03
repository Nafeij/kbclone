import React from "react"
import PropTypes from "prop-types"

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

Bar.propTypes = {
    baseImg: PropTypes.string,
    dim: PropTypes.shape({
        width: PropTypes.string.isRequired,
        height: PropTypes.string.isRequired
    }).isRequired,
    progress: PropTypes.number.isRequired,
    fillImg: PropTypes.string.isRequired
}

export default Bar