/* eslint react/prop-types: 0 */

import React, { useState } from "react";
import { useEffect } from "react";
import {randomInRange} from '../util/utils';

/* const Pip = () => <span className="pip" />;

const Face = ({ children }) => <div className="face">{children}</div>;

const Die = ({ value }) => {
	let pips = Number.isInteger(value)
		? Array(value)
				.fill(0)
				.map((_, i) => <Pip key={i} />)
		: null;
	return <Face>{pips}</Face>;
};

export default Die; */

const Die = React.forwardRef((props, ref) =>{
/* 	constructor(props) {
		super(props)
		this.state = {
			num: Math.floor(Math.random() * 6) + 1,
		}
		this.roll = this.roll.bind(this)
	} */
	const {height, transition, transform, shrink, num, onMovEnd, onShrinkEnd, transitionTimingFunction, backgroundColor, borderColor, zIndex} = props
	const [rnum, setNum] = useState(num);

 	useEffect(() => {
		setNum(num)
	}, [num])
	

	return (
		<div
			className={`die ${shrink ? "shrink-out" : ""}`} ref={ref} style={{
				height: height,
				transition: transition,
				transform: transform,
				transitionTimingFunction: transitionTimingFunction,
				backgroundColor: backgroundColor,
				borderColor: borderColor,
				zIndex: zIndex
			}}
			onTransitionEnd={onMovEnd}
			onAnimationEnd={onShrinkEnd}
		>
			{Array(rnum).fill(0).map((_, i) => <span className="pip" key={i}/>)}
		</div>
	)
})

Die.displayName = 'Die'

Die.defaultProps = {
	height: '100px',
	transition: 'none',
	transform: 'none',
	roll: true,
	shrink: false,
	num: 1,
	onRollEnd: ()=>{},
	onMovEnd: ()=>{},
	onShrinkEnd: ()=>{}
}

export default Die