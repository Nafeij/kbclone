/* eslint react/prop-types: 0 */

import React from "react"
import { useNavigate, useParams, useLocation } from 'react-router-dom';

export function withNavigate(Component) {
  return function WrappedComponent(props) {
    return <Component {...props} navigate={useNavigate()} />;
  }
}

export function withParams(Component) {
  return function WrappedComponent(props) {
    return <Component {...props} params={useParams()} />;
  }
}

export function withLocation(Component) {
  return function WrappedComponent(props) {
    return <Component {...props} location={useLocation()} />;
  }
}