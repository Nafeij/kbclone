/* eslint react/prop-types: 0 */

import React from "react";


const Die = React.forwardRef((props, ref) =>{
	const {height, transition, transform, shrink, shrinkPreview, num, onMovEnd, onShrinkEnd, transitionTimingFunction, diceColor, diceBorder, pipColor, zIndex, isCaravan, marginLeft, marginTop} = props
    // const [rnum, setNum] = useState(num);

	return (
		<div
			className={`${num === 2 ? "die2" : "die"} ${isCaravan && num === 1? "caravan" : ""} ${shrink ? "shrink-out" : ""} ${shrinkPreview ? "shrink-pre" : ""}`} ref={ref} style={{
				height,
				transition,
				transform,
				transitionTimingFunction,
				backgroundColor: diceColor,
				borderColor: diceBorder,
				zIndex,
				marginLeft,
				marginTop
			}}
			onTransitionEnd={onMovEnd}
			onAnimationEnd={onShrinkEnd}>
			{Array(num).fill().map((_, i) => <span className="pip" style={{backgroundColor: pipColor}} key={i}/>)}
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