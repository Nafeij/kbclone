/* eslint react/prop-types: 0 */

import React from "react";

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

class SlidePane extends React.Component{
	constructor(props){
		super(props)
		this.state = {
			translateX: this.props.translateX,
      initTranslate: null,
      dragging: false,
      relX: null
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
    }
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
    const {dragging, relX, initTranslate, translateX} = this.state
    if (!dragging) return
    const width = this.selfRef.current.clientWidth,
      delta = clamp((e.pageX - relX) / width, -initTranslate-((this.props.numSep-1)/this.props.numSep) ,-initTranslate)
    this.setState({
      translateX: delta + initTranslate,
    }, ()=>{
      // console.log(delta + ' ' + this.props.numSep)
      this.props.releaseCallback(translateX)
    })
    e.stopPropagation()
    e.preventDefault()
  }
  
  render(){
    return (
      <div className="slidePane"
        ref={this.selfRef} 
        style={{
          translate: (this.state.dragging ? this.state.translateX : this.props.translateX)*100 + '%',
          transition: this.state.dragging ? 'none' : '.3s'
        }}>
        {this.props.children}
      </div>
    )
  }
}

export default SlidePane