import React from "react"
import PropTypes from "prop-types"

import { strictMod } from "../util/Utils"

const SLIDE_FACTOR = 2.0

export default class SlidePane extends React.Component{
	constructor(props){
		super(props)
		this.state = {
			translateX: this.props.translateX,
      initTranslate: null,
      dragging: false,
      relX: null
		}
    this.selfRef = React.createRef();
    this.onPointerUp = this.onPointerUp.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerDown = this.onPointerDown.bind(this)
  }

  onPointerDown(e){
	  // only left mouse button
    if (this.state.dragging || e.button !== 0) return
    const rect = this.selfRef.current.getBoundingClientRect()
    if (e.pageY < rect.top || e.pageY > rect.bottom) return
    this.setState({
      dragging: true,
      initTranslate: this.props.translateX,
      translateX: this.props.translateX,
      relX: e.pageX
    })
	  e.stopPropagation()
	  e.preventDefault()
  }

  onPointerUp(e) {
    if (!this.state.dragging) return
	  this.setState({
      dragging: false,
      initTranslate: null
    })
	  e.stopPropagation()
	  e.preventDefault()
  }

  onPointerMove(e) {
    const {dragging, relX, initTranslate, translateX} = this.state
    if (!dragging) return
    const sepRatio = 0.5/this.props.numSep,
      width = this.selfRef.current.clientWidth,
      delta = (((e.pageX - relX) * SLIDE_FACTOR) / width) + initTranslate - sepRatio
    this.setState({
      translateX: strictMod(delta,-1) + sepRatio
    }, ()=>{
      this.props.releaseCallback(translateX)
    })
    e.stopPropagation()
    e.preventDefault()
  }

  renderPane(isFake){
    const translateX = this.state.dragging ? this.state.translateX : this.props.translateX,
      margin  = 1/this.props.numSep,
      toMod = isFake ^ this.props.hasWrapped,
      toModTL = toMod ? (translateX < -.5+margin ? 100:-100) : 0,
      toModTR = toMod ? (translateX >= -.5 && translateX <= -.5+margin) : false
    return (
      <div className="slidePane"
          ref={toMod ? null : this.selfRef}
          style={{
            translate: translateX*100 + toModTL + '%',
            transition: this.state.dragging || toModTR ? 'none' : '.3s',
          }}>
          {this.props.children}
      </div>
    )
  }
  render(){
    const maskSize = 50*Math.ceil(this.props.numSep)
    return (
      <div
        className="containerMask"
        style={{
          width: maskSize + '%',
          left: (50 - maskSize/2) + '%',
          paddingLeft: (maskSize/2 - 50) + '%'
        }}
        onPointerDown={this.onPointerDown}
        onPointerUp={this.onPointerUp}
        onPointerMove={this.onPointerMove}
        onPointerLeave={this.onPointerUp}
      >
        {this.renderPane(false)}
        {this.renderPane(true)}
      </div>
    )
  }
}

SlidePane.propTypes = {
  translateX: PropTypes.number.isRequired,
  numSep: PropTypes.number.isRequired,
  hasWrapped: PropTypes.number.isRequired,
  releaseCallback: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired
}