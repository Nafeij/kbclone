/* eslint react/prop-types: 0 */

import React from "react";
import { clamp, strictMod } from "../util/utils";

class SlidePane extends React.Component{
	constructor(props){
		super(props)
		this.state = {
			translateX: this.props.translateX,
      initTranslate: null,
      dragging: false,
      relX: null,
      wrapSwitch: false
		}
    this.selfRef = React.createRef();
    this.onMouseUp = this.onMouseUp.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
    document.addEventListener('mousedown', this.onMouseDown)
  }
  
  componentDidUpdate(props,state){
  	if (this.state.dragging && !state.dragging) {
      document.addEventListener('mousemove', this.onMouseMove)
      document.addEventListener('mouseup', this.onMouseUp)
      document.removeEventListener('mousedown', this.onMouseDown)
    } else if (!this.state.dragging && state.dragging) {
      document.removeEventListener('mousemove', this.onMouseMove)
      document.removeEventListener('mouseup', this.onMouseUp)
      document.addEventListener('mousedown', this.onMouseDown)
      // this.props.releaseCallback(this.state.translateX)
    } else if (this.props.hasWrapped && !props.hasWrapped){
      this.setState({wrapSwitch : !state.wrapSwitch})
    }
  }

  componentWillUnmount(){
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('mouseup', this.onMouseUp)
    document.removeEventListener('mousedown', this.onMouseDown)
  }
  
  onMouseDown(e){
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
  
  onMouseUp(e) {
	  this.setState({
      dragging: false,
      initTranslate: null
    })
	  e.stopPropagation()
	  e.preventDefault()
  }
  
  onMouseMove(e) {
    const {dragging, relX, initTranslate, translateX, wrapSwitch} = this.state,
    sepRatio = 0.5/this.props.numSep
    if (!dragging) return
    const width = this.selfRef.current.clientWidth,
      //delta = (e.pageX - relX) / width
      delta = (((e.pageX - relX) / width)+initTranslate-sepRatio)
    this.setState({
      // translateX: clamp(delta + initTranslate, -((this.props.numSep-1)/this.props.numSep),0)
      translateX: strictMod(delta,-1)+sepRatio
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
      toMod = isFake ^ !this.state.wrapSwitch,
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
      <div className="containerMask" style={{
          width: maskSize + '%',
          left: (50 - maskSize/2) + '%',
          paddingLeft: (maskSize/2 - 50) + '%'
        }}>
        {this.renderPane(false)}
        {this.renderPane(true)}
      </div>
    )
  }
}

export default SlidePane