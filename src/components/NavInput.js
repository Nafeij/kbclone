/* eslint-disable react/prop-types */

import React, { Component } from 'react'
import Nav from 'react-navtree'

import { keyConvert } from '../util/Utils'

export default class NavInput extends Component {
  constructor (props) {
    super(props)

    this.state = {
      navFocused: false,
      inputFocused: false
    }

    this.cursorPos = -1;

    ['onInputKeyUp', 'onInputFocus', 'onInputBlur', 'onNav', 'navFunc', 'setRef'].forEach(func => {
      this[func] = this[func].bind(this)
    })
  }

  onInputKeyUp (e) {
    if (this.props.type && this.props.type !== 'text') return

    e.stopPropagation()

    let key = keyConvert(e.key)

    if (key === 'enter' && !this.state.inputFocused){
      this.inputEl.focus()
    } else if (!!key) {
      if (this.cursorPos === e.target.selectionStart) {
        this.inputEl.blur()
      } else {
        this.cursorPos = e.target.selectionStart
      }
    }
  }

  onInputFocus () {
    this.setState({ inputFocused: true })

    if (!this.state.navFocused) {
      this.nav.tree.focus()
    }
  }

  onInputBlur () {
    this.setState({ inputFocused: false })
  }

  onNav (path) {
    this.setState({ navFocused: path !== false })

    if (this.props.onNav) this.props.onNav(path)
  }

  navFunc (key) {
    if (key === 'enter') {
      if (this.props.type && this.props.type !== 'text') {
        this.inputEl.click()
      } else {
        this.inputEl.focus()
        this.inputEl.select()
      }
    }
  }

  setRef (nav) {
    this.nav = nav
    this.inputEl = nav && nav.tree.el
  }


  render () {
    let { component = 'input', type = 'text', onNav,  ...rest } = this.props

    return (
      <Nav
        className='nav-input'
        component={component} type={type}
        func={this.navFunc}
        ref={this.setRef}
        onNav={this.onNav}
        onKeyUp={this.onInputKeyUp}
        onFocus={this.onInputFocus}
        onBlur={this.onInputBlur}
        {...rest}
      />
    )
  }
}
