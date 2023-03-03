import React from "react"
import PropTypes from "prop-types"
import { useNavigate, useParams, useLocation } from 'react-router-dom';

export function withNavigate(Component) {
  return function WrappedComponent(props) {
    return <Component {...props} navigate={useNavigate()} />;
  }
}

withNavigate.propTypes = {
  Component: PropTypes.elementType.isRequired
}

export function withParams(Component) {
  return function WrappedComponent(props) {
    return <Component {...props} params={useParams()} />;
  }
}

withParams.propTypes = {
  Component: PropTypes.elementType.isRequired
}

export function withLocation(Component) {
  return function WrappedComponent(props) {
    return <Component {...props} location={useLocation()} />;
  }
}

withLocation.propTypes = {
  Component: PropTypes.elementType.isRequired
}