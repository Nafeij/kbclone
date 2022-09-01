import React from "react";
import Die from "./Die";
import Tub from "./Tub";
import {randomInRange, defLength} from '../util/utils';

const scale = .95
const numFaces = 6;

class Side extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            diceMatrix:[    [null, null, null],
                            [null, null, null],
                            [null, null, null]],
            tubProps: Array(3).fill().map(this.generateTub),
            tubsClickable: false,
            isPlayer: true,
            newDice: null,
            score: 0,
            highlight: false,
            turnIsPlayer: true,
            rolled: false
        }
/*         this.rollDice.bind(this)
        this.handleMoveAnim.bind(this)
        this.updateScore.bind(this) */
        this.heightOnResize.bind(this)
    }

/*     startGame(){
        if (this.state.turnIsPlayer === this.state.isPlayer){
            this.setState({highlight : true})
            this.rollDice()
        } else {
            this.setState({highlight : false})
        }
    } */

    generateDice(){
        // this.setState((state)=>({dkey : state.dkey + 1}))
        return {
            // key: this.state.dkey,
            height: this.boxHeight() * scale,
            transition: '.3s',
            transitionTimingFunction: 'ease-in-out',
            transform: 'none',
            shrink: false,
            num: randomInRange(numFaces) + 1,
            backgroundColor: '#f4ebce',
            borderColor: '#d7cbb3',
            zIndex: 1,
            onMovEnd: ()=>{},
            onShrinkEnd: ()=>{},
            fwdref: React.createRef()
        }
    }

    generateTub(){
        return {
            startShake: false,
            animClass: '',
            onScoreAnimEnd: ()=>{},
            score: null,
            boxRefs: Array(3).fill().map(React.createRef)
        }
    }

    boxHeight(){
        return this.state.tubProps[0].boxRefs[0].current.getBoundingClientRect().height
    }

    rollDice(){
        if (this.state.rolled) return
        this.setState({rolled : true})
        let newDice = this.generateDice()
        this.setState({newDice : newDice},()=>{
            const interval = setInterval(()=>{
                newDice = this.state.newDice
                newDice.num = (newDice.num + 1 + randomInRange(numFaces - 1)) % (numFaces - 1) + 1
                this.setState({newDice : newDice})
            },100);
            setTimeout(() => {
                clearInterval(interval)
                this.setState({tubsClickable : true})
                window.addEventListener("resize", ()=>{this.heightOnResize()})
            }, 800)
        })
    }

/*     sendTo(die, t, i){
        diceMatrix = this.state.diceMatrix.slice()
        diceMatrix[t][i] = die
        this.setState({diceMatrix: diceMatrix})
    } */

    handleMoveAnim(i, destPos = null, srcPos = null){
        const {tubProps, diceMatrix} = this.state
        if (destPos === null) destPos = defLength(this.state.diceMatrix[i])
        const newDice = srcPos === null ? this.state.newDice : diceMatrix[i][srcPos]
        // console.log(this.state.diceMatrix[i])
        const srcRect = newDice.fwdref.current.getBoundingClientRect()
        const destRect = tubProps[i].boxRefs[destPos].current.getBoundingClientRect()

        const transX = destRect.x - srcRect.x + (destRect.width - srcRect.width) / 2
        const transY = destRect.y - srcRect.y + (destRect.height - srcRect.height) / 2

        newDice.transform = `translate(${Math.round(transX)}px, ${Math.round(transY)}px)`
        newDice.zIndex = 2
        return new Promise((resolve) =>{
            newDice.onMovEnd = ()=>{
                newDice.transform = ''
                newDice.zIndex = 0
                newDice.height = (scale * 100) + '%'
                const num = newDice.num
                const diceMat = diceMatrix.slice()
                if (srcPos !== null) diceMat[i][srcPos] = null
                diceMat[i][destPos] = newDice
                newDice.onMovEnd = ()=>{}
                window.removeEventListener("resize", this.heightOnResize)
                this.setState({newDice: null, diceMatrix: diceMat}, resolve(num))
            }
        })
        
    }

    async proccessTurn(i){
        const die = await this.handleMoveAnim(i)
        await this.updateScore(i);
        let total = 0;
        for (const tub of this.state.tubProps) {
            total += tub.score
        }
        this.setState({score : total})
        // await this.props.checkDice(die);
        
        this.setState({rolled : false}, this.rollDice)
    }

    updateScore(i){
        let newScore = 0;
        const diceMatrix = this.state.diceMatrix.slice()
        for (const dice of diceMatrix[i]){
            if (!dice) continue
            const numMatch = this.numMatchingDice(i, dice.num);
            newScore += dice.num * numMatch;
            switch (numMatch) {
                case 3:
                    dice.backgroundColor = "#ecd77a"; 
                    dice.borderColor = "#cdbe61"; 
                    break;
                case 2:
                    dice.backgroundColor = "#72adcf"; 
                    dice.borderColor = "#6297b6"; 
                    break;
                default:
                    dice.backgroundColor = "#f4ebce"; 
                    dice.borderColor = "#d7cbb3";  
                    break;
            }
        }
        this.setState({diceMatrix : diceMatrix})
        const tubProps = this.state.tubProps
        const isZero = newScore === 0
        if (newScore === tubProps[i].score || (isZero && tubProps[i].score === null)) return
        if (!isZero) tubProps[i].score = newScore
        tubProps[i].animClass = isZero ? "shrink-out" : "shake"
        return new Promise((resolve)=>{
            tubProps[i].onScoreAnimEnd = ()=>{
                tubProps[i].animClass = '';
                tubProps[i].onScoreAnimEnd = ()=>{}
                if (isZero) tubProps[i].score = null;
                this.setState({tubProps : tubProps})
                resolve()
        }})
    }

    numMatchingDice(i, num){
        return this.state.diceMatrix[i].filter((die)=>die !== null && die.num === num).length
    }

    renderTub(i){
        return (<Tub
            {...this.state.tubProps[i]}
            diceList={this.state.diceMatrix[i]}
            clickable={this.state.tubsClickable}
            flip={this.state.isPlayer}
            proccessClick={this.proccessClick(i)}
            onShakeAnimEnd={this.onShakeAnimEnd(i)}
        />)
    }

    onShakeAnimEnd(key){
        return () => {
            const tubProps = this.state.tubProps.slice()
            tubProps[key].startShake = false
            this.setState({tubProps : tubProps})
        }
    }

    proccessClick(i){
        return () => {
            if (this.isFull(i)) {
                let tubProps = this.state.tubProps.slice()
                tubProps[i].startShake = true
                this.setState({tubProps : tubProps})
            } else {
                this.setState({tubsClickable : false})
                this.proccessTurn(i)
            }
        }
    }

    isFull(i){
        return defLength(this.state.diceMatrix[i]) > 2
    }

    heightOnResize(){
        if (this.state && this.state.newDice && this.state.tubProps[0].boxRefs[0].current) {
            const newDice = this.state.newDice
            newDice.height = this.boxHeight() * scale
            this.setState({newDice : newDice}) 
        }
    }

    render(){
        const {isPlayer, newDice, score} = this.state
        const name = isPlayer ? '~ Player ~' : '~ Opponent' 
        return (
            <div className="side" id="opponent">
            <div className="board">
                <div 
                    className='roller' onAnimationEnd={() => {this.rollDice()}}>
                    <div className={`rollbox ${(this.state.turnIsPlayer === this.state.isPlayer) ? "hover" : ""}`}>
                        {newDice ? <Die {...newDice} ref={newDice.fwdref}/> : null}
                    </div>
                </div>
                <div className="tubs">
                    <div className="tubbox">
                        {this.renderTub(0)}
                        {this.renderTub(1)}
                        {this.renderTub(2)}
                    </div>
                </div>
                <div className="info">
                    <h2 className="name">{name}</h2>
                    <div className="scorebox">{score}</div>
                </div>
            </div>
        </div>
        )
    }
}

export default Side