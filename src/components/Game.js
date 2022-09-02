import React from "react";
import {Die, Tub, Side} from "./"
import {randomInRange, defLength} from '../util/utils';

const scale = .95
const numFaces = 6;

class Game extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            diceMatrix: Array.from({length:2}, ()=>(
                Array.from({length:3},()=>(Array(3).fill(null)))
                )
            ),
            tubProps: Array.from({length:2},()=>(
                Array.from({length:3}, () => ({
                    startShake: false,
                    animClass: '',
                    onScoreAnimEnd: ()=>{},
                    score: null,
                    boxRefs: Array(3).fill().map(React.createRef)}))
                )
            ),
            sideProps: Array.from({length:2},(_,i)=>({
                    tubsClickable: false,
                    id: i,
                    newDice: null,
                    score: null,
                    highlight: false,
                    rolled: false
                }
            )),
            turn: 0
        }
    }

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

    boxHeight(){
        return this.state.tubProps[turn][0].boxRefs[0].current.getBoundingClientRect().height
    }

    updateCurrSide(props, other={}, callback = ()=>{}){
        this.setState(prevState => ({
            sideProps: prevState.sideProps.map(side => (
                side.id === prevState.turn ?
                    { ...side, ...props } : side)),
            ...other
        }), callback)
    }

    rollDice(){
        //if (this.state.sideProps[turn].rolled) return

        // this.setState({rolled : true})

        let newDice = this.generateDice()
        const props = {rolled : true, newDice}
        this.updateCurrSide(props, callback = ()=>{
            const interval = setInterval(()=>{
                newDice = this.state.sideProps[turn].newDice
                newDice.num = (newDice.num + 1 + randomInRange(numFaces - 1)) % (numFaces - 1) + 1
                this.updateCurrSide({newDice})
            },100);
            setTimeout(() => {
                clearInterval(interval)
                this.updateCurrSide({tubsClickable : true})
                window.addEventListener("resize", ()=>{this.heightOnResize()})
            }, 800)
        })
    }

    handleMoveAnim(tubId, destPos = null, srcPos = null){
        const tubProps = this.state.tubProps[turn][tubId]
        const turnDiceMatrix = this.state.diceMatrix[turn]
        if (destPos === null) destPos = defLength(turnDiceMatrix[tubId])
        const newDice = srcPos === null ? this.state.sideProps[turn].newDice : turnDiceMatrix[tubId][srcPos]

        const srcRect = newDice.fwdref.current.getBoundingClientRect()
        const destRect = tubProps.boxRefs[destPos].current.getBoundingClientRect()

        const transX = destRect.x - srcRect.x + (destRect.width - srcRect.width) / 2
        const transY = destRect.y - srcRect.y + (destRect.height - srcRect.height) / 2

        newDice.transform = `translate(${Math.round(transX)}px, ${Math.round(transY)}px)`
        newDice.zIndex = 2
        return new Promise((resolve) =>{
            newDice.onMovEnd = ()=>{
                newDice.transform = ''
                newDice.zIndex = 0
                newDice.height = (scale * 100) + '%'
                newDice.onMovEnd = ()=>{}
                const num = newDice.num
                const diceMatrix = this.state.diceMatrix.slice()
                if (srcPos !== null) diceMatrix[turn][tubId][srcPos] = null
                diceMatrix[turn][tubId][destPos] = newDice
                window.removeEventListener("resize", this.heightOnResize)
                this.updateCurrSide({newDice:null}, {diceMatrix}, ()=>(resolve(num)))
            }
        })
        
    }

    async proccessTurn(i){
        this.updateCurrSide({tubsClickable : false})
        const die = await this.handleMoveAnim(i)
        await this.updateScore(i);
        let total = 0;
        for (const tub of this.state.tubProps[turn]) {
            total += tub.score
        }
        // this.updateCurrSide({score : total, rolled : false}, this.rollDice)
        this.updateCurrSide({score : total}, {turn : !prevState.turn}, this.rollDice)
        // await this.props.checkDice(die);
    }

    updateScore(i){
        let newScore = 0;
        const diceMatrix = this.state.diceMatrix.slice()
        for (const dice of diceMatrix[turn][i]){
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
        const tubsProps = this.state.tubProps
        const tubProps = tubsProps[turn][i]
        const isZero = newScore === 0
        if (newScore === tubProps.score || (isZero && tubProps.score === null)) {
            return new Promise.resolve()
        }
        if (!isZero) tubProps.score = newScore
        tubProps.animClass = isZero ? "shrink-out" : "shake"
        return new Promise((resolve)=>{
            tubProps.onScoreAnimEnd = ()=>{
                tubProps.animClass = '';
                tubProps.onScoreAnimEnd = ()=>{}
                if (isZero) tubProps.score = null;
                this.setState({tubProps : tubsProps})
                resolve()
        }})
    }

    renderSide(side){
        return (<Side
            {...this.state.sideProps[side]}
            tubProps={this.state.tubProps[side]}
            diceMatrix={this.state.diceMatrix[side]}
            turn={this.state.turn}
        />)
    }

    // TODO

    numMatchingDice(i, num){
        return this.state.diceMatrix[turn][i].filter((die)=>die !== null && die.num === num).length
    }

    componentDidMount(){
        this.setState({turn : randomInRange(2)})
    }

    render()
}