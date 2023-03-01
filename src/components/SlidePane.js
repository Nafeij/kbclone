/* eslint react/prop-types: 0 */

import React from "react"
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
    // document.addEventListener('pointerdown', this.onPointerDown)
  }
/*
  componentDidUpdate(state){
  	if (this.state.dragging && !state.dragging) {
      document.addEventListener('pointermove', this.onPointerMove)
      document.addEventListener('pointerup', this.onPointerUp)
      document.removeEventListener('pointerdown', this.onPointerDown)
    } else if (!this.state.dragging && state.dragging) {
      document.removeEventListener('pointermove', this.onPointerMove)
      document.removeEventListener('pointerup', this.onPointerUp)
      document.addEventListener('pointerdown', this.onPointerDown)
      // this.props.releaseCallback(this.state.translateX)
    }
  }

  componentWillUnmount(){
    document.removeEventListener('pointermove', this.onPointerMove)
    document.removeEventListener('pointerup', this.onPointerUp)
    document.removeEventListener('pointerdown', this.onPointerDown)
  }
 */
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
      // translateX: clamp(delta + initTranslate, -((this.props.numSep-1)/this.props.numSep),0)
      translateX: strictMod(delta,-1) + sepRatio
    }, ()=>{
      // console.log(delta + ' ' + this.props.numSep)
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