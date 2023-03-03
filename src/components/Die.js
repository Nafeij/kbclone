import React from "react";
import PropTypes from "prop-types";

const Die = React.forwardRef((props, ref) =>{
	const {height, translate, scale, shrink, shrinkPreview, cheat, match, num, onMovEnd, onShrinkEnd,
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

Die.propTypes = {
	height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	translate: PropTypes.string,
	scale: PropTypes.string,
	shrink: PropTypes.bool,
	shrinkPreview: PropTypes.bool,
	cheat: PropTypes.bool,
	match: PropTypes.string,
	num: PropTypes.number.isRequired,
	onMovEnd: PropTypes.func,
	onShrinkEnd: PropTypes.func,
	transitionTimingFunction: PropTypes.string,
	diceColor: PropTypes.string,
	diceBorder: PropTypes.string,
	pipColor: PropTypes.string,
	zIndex: PropTypes.number,
	isCaravan: PropTypes.bool,
	marginLeft: PropTypes.string,
	marginTop: PropTypes.string
}

export default Die