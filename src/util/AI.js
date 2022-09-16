import { randomSelect, isFull, numMatchingDice, randomInRange, defLength, score, emptySpaces, bernou} from "./utils"

export function evaluate(diceMatrix, num, skill, turn, numFaces, settings){
    const choices = possibleChoices(diceMatrix, turn, settings.pickable)
    if (Math.random() > skill) {
        console.log('misplay')
        return randomSelect(choices)
    }

    let maxWeight = -Infinity, bestChoices = []
    for (const choice of choices) {

        let currWeight = weighDie(num, diceMatrix, choice, settings.caravan)
        let lost = oppCost(num, diceMatrix, choice, numFaces, settings.caravan)
        currWeight -= lost
        if (settings.pickable && choice.side !== turn) currWeight = ~currWeight + 1

        console.log(`choice: ${choice.side ? 'player' : 'opp'} ${choice.tub} weight : ${currWeight}`)

        if (currWeight > maxWeight) {
            maxWeight = currWeight
            bestChoices = [choice]
        } else if (currWeight === maxWeight) {
            bestChoices.push(choice)
        }
    }
    console.log(maxWeight)
    return randomSelect(bestChoices)
}

export function cheatDice(diceMatrix, turn, numFaces, settings){
    console.log('cheat')
    const choices = possibleChoices(diceMatrix, turn, settings.pickable)
    let num = 1 + randomInRange(numFaces), bestChoice = randomSelect(choices), weight = -Infinity
    for (const choice of choices) {
        for (let face = 1; face <= numFaces; face++){
            let currWeight = weighDie(face, diceMatrix, choice, settings.caravan)
            let lost = oppCost(face, diceMatrix, choice, numFaces, settings.caravan)
            currWeight -= lost
            if (settings.pickable && choice.side !== turn) currWeight = ~currWeight + 1

            if (currWeight > weight) {
                weight = currWeight
                bestChoice = choice
                num = face
            }
        }
    }
    return {num, side : bestChoice.side, tub : bestChoice.tub}
}

function oppCost(num, diceMatrix, choice, numFaces, caravan = null){
    /* let negWeight = 0
    for (let face = 1; face <= numFaces; face++){
        if (face != num){
            let currNegWeight = weighDie(face, diceMatrix, choice, caravan)
            negWeight += currNegWeight
        }
    }
    return negWeight / numFaces */
    const tub = diceMatrix[choice.side][choice.tub]
    const empty = emptySpaces(tub), emptyTotal = emptySpaces(diceMatrix[choice.side].flat())
    const likelihood = 1 - Array(empty).fill()
        .map((_,i)=>(bernou(emptyTotal, i, 1/numFaces)))
        .reduce((a,b) => (a+b))
    let maxVal = 0
    if (defLength(tub) === 0) return 0
    for (let face = 1; face <= numFaces; face++){
        if (face != num){
            const baseCount = numMatchingDice(tub,face)
            const currVal = face * (empty + baseCount - 1) * 2
            maxVal = Math.max(currVal, maxVal)
        }
    }
    return maxVal * likelihood
}


function weighDie(num, diceMatrix, choice, caravan = null){ // TODO tubscore
    const oppSide = !choice.side + 0
    const tub = diceMatrix[choice.side][choice.tub]
    const oppTub = diceMatrix[oppSide][choice.tub]
    const matches = numMatchingDice(tub, num),
        oppMatches = numMatchingDice(oppTub, num)
    let points = num + matches * num * 2 + score(num, oppMatches)
    if (caravan) {
        let baseScore = scoreTub(diceMatrix[choice.side][choice.tub]) + points
        points = Math.min(0, baseScore - caravan[0]) + Math.min(0, caravan[1] - baseScore)
        if (num === 1 && defLength(tub) >= 1) {
            const removeNum = tub[defLength(tub) - 1].num
            points += diceMatrix.map((side,i)=>(
                i === choice.side ? 
                    side.map(t=>(~score(removeNum, numMatchingDice(t, removeNum))+1)) : 
                    side.map(t=>(score(removeNum, numMatchingDice(t, removeNum)))) // consider caravan ranges
            )).flat().reduce((t,c)=>(t+c),0)
        }
    }
    return points  // (n+1)^2 - n^2 - 1
}

function scoreTub(tub) {
    let points = 0
    for (const dice of tub){
        if (dice) points += dice.num * numMatchingDice(tub, dice.num);
    }
    return points
}

function possibleChoices(diceMatrix, side, pickable = false){
    const choices = [], oppSide = !side + 0
    for (let tub = 0; tub < diceMatrix[side].length; tub++) {
        if (!isFull(diceMatrix[side][tub])){
            choices.push({side, tub})
        }
        if (pickable && !isFull(diceMatrix[oppSide][tub])){
            choices.push({side : oppSide, tub})
        }
    }
    return choices
}

/* export function cheatDice(diceMatrix, turn){
    const randinit = randomInRange(6) + 1
    // const arr = diceMatrix.flat().flat().filter(n=>n)
    const arr = diceMatrix.map((e,i)=>{
        if (i === turn) return e.filter(t=>!isFull(t)).flat().filter(v=>v).map(v=>v.num)
        else return e.flat().filter(v=>v).map(v=>v.num)
    }).flat().filter(e=>e)
    if (!arr.length) return randinit
    return mostCommon(arr)[0]
} */