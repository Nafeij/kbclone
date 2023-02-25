/* eslint react/prop-types: 0 */

import React from "react";


const Die = React.forwardRef((props, ref) =>{
	const {height, transition, translate, scale, shrink, shrinkPreview, cheat, match, num, onMovEnd, onShrinkEnd,
		transitionTimingFunction, diceColor, diceBorder, pipColor, zIndex, isCaravan, marginLeft, marginTop} = props
    // const [rnum, setNum] = useState(num);

	return (
		<div
			className={`die
				${num === 2 ? "num2" : ""}
				${isCaravan && num === 1? "caravan" : ""}
				${shrink ? "shrink-out" : ""}
				${shrinkPreview ? "shrink-pre" : ""}
				${cheat ? "cheated" : ""}
				${match}`
			} ref={ref} style={{
				height,
				transition,
				translate,
				scale,
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

export default Die