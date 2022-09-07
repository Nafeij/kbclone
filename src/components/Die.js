/* eslint react/prop-types: 0 */

import React, { useState, useEffect } from "react";


const Die = React.forwardRef((props, ref) =>{
	const {height, transition, transform, shrink, num, onMovEnd, onShrinkEnd, transitionTimingFunction, backgroundColor, borderColor, zIndex} = props
    // const [rnum, setNum] = useState(num);
	const pips = Array(num).fill().map((_, i) => <span className="pip" key={i}/>)

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
			onAnimationEnd={onShrinkEnd}>
			{pips}
		</div>
	)
})

Die.displayName = 'Die'

/* Die.defaultProps = {
	height: '100px',
	transition: 'none',
	transform: 'none',
	roll: true,
	shrink: false,
	num: 1,
	onRollEnd: ()=>{},
	onMovEnd: ()=>{},
	onShrinkEnd: ()=>{}
} */

export default Die