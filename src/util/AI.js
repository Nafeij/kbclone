import { randomSelect, isFull, numMatchingDice, randomInRange, defLength, score, emptySpaces, bernou, scoreTub} from "./utils"

export function evaluate(diceMatrix, num, skill, turn, numFaces, settings){
    const choices = possibleChoices(diceMatrix, turn, settings.pickable)
    if (Math.random() > skill) {
        console.log('misplay')
        return randomSelect(choices)
    }

    let maxWeight = -Infinity, bestChoices = []
    for (const choice of choices) {

        let currWeight = weighDie(num, diceMatrix, choice, settings.caravan)
        if (!settings.caravan){
            let lost = oppCost(num, diceMatrix, choice, numFaces, settings.caravan)
            //console.log(`choice: ${choice.side ? 'player' : 'opp'} ${choice.tub} gain : ${currWeight} loss : ${lost}`)
            currWeight -= lost
        }
        if (settings.pickable && choice.side !== turn) currWeight = ~currWeight + 1
        // console.log(`choice: ${choice.side ? 'player' : 'oppnnt'} ${choice.tub} weight : ${currWeight}`)

        if (currWeight > maxWeight) {
            maxWeight = currWeight
            bestChoices = [choice]
        } else if (currWeight === maxWeight) {
            bestChoices.push(choice)
        }
    }
    // console.log(maxWeight)
    return randomSelect(bestChoices)
}

export function cheatDice(diceMatrix, turn, numFaces, settings){
    // console.log('cheat')
    const choices = possibleChoices(diceMatrix, turn, settings.pickable)
    let num = 1 + randomInRange(numFaces), bestChoice = randomSelect(choices), weight = -Infinity
    for (const choice of choices) {
        for (let face = 1; face <= numFaces; face++){
            let currWeight = weighDie(face, diceMatrix, choice, settings.caravan)
            if (!settings.caravan) {
                let lost = oppCost(face, diceMatrix, choice, numFaces, settings.caravan)
                currWeight -= lost
            }
            if (settings.pickable && choice.side !== turn) currWeight = ~currWeight + 1

            if (currWeight > weight || (currWeight === weight && face > num)) {
                weight = currWeight
                bestChoice = choice
                num = face
            }
        }
    }
    return {num, side : bestChoice.side, tub : bestChoice.tub}
}

function oppCost(num, diceMatrix, choice, numFaces, caravan = null){
    if (caravan){
        let negWeight = 0
        for (let face = 1; face <= numFaces; face++){
            if (face != num){
                let currNegWeight = weighDie(face, diceMatrix, choice, caravan)
                negWeight += currNegWeight
            }
        }
        return negWeight
    }
    const tub = diceMatrix[choice.side][choice.tub]
    if (defLength(tub) === 0) return 0
    const empty = emptySpaces(tub), emptyTotal = emptySpaces(diceMatrix[choice.side].flat())
    const likelihood = (1 - Array(empty).fill()
        .map((_,i)=>(bernou(emptyTotal, i, 1/numFaces)))
        .reduce((a,b) => (a+b))) * (
            emptySpaces(diceMatrix[!choice.side+0][choice.tub]) ?
            ((numFaces - 1) / numFaces) ** 
            emptySpaces(diceMatrix[!choice.side+0].flat()) : 1
        )
    let maxVal = 0
    for (let face = 1; face <= numFaces; face++){
        if (face != num){
            const baseCount = numMatchingDice(tub,face)
            const currVal = face * (empty + baseCount - 1) * 2
            maxVal = Math.max(currVal, maxVal)
        }
    }
    // console.log(maxVal + ' - ' + likelihood)
    return maxVal * likelihood
}


function weighDie(num, diceMatrix, choice, caravan = null){

    if (caravan) return scoreCarav(num, diceMatrix, choice, caravan)

    const oppSide = !choice.side + 0
    const tub = diceMatrix[choice.side][choice.tub]
    const oppTub = diceMatrix[oppSide][choice.tub]
    const matches = numMatchingDice(tub, num),
        oppMatches = numMatchingDice(oppTub, num)
    return num + matches * num * 2 + score(num, oppMatches)
}

function scoreCarav(num, diceMatrix, choice, caravan){
    const onePos = defLength(diceMatrix[choice.side][choice.tub])
    let removeNum = null
    if (num === 1 && onePos >= 1) {
        removeNum = diceMatrix[choice.side][choice.tub][onePos-1].num
        diceMatrix = diceMatrix.map(s=>(
            s.map(t=>(
                t.filter(d=>(!d || d.num !== removeNum))
            ))
        ))
    }
    diceMatrix = diceMatrix.map((s,si)=>(
        si === choice.side ? s :
        s.map((t,ti)=>(
            ti !== choice.tub ? t :
            t.filter(d=>(!d || d.num !== num))
        ))
    ))
/*     console.log(diceMatrix.map(s=>(
        s.map(t=>(
            t.map(d=>(d?d.num:d))
        ))
    ))) */
    let d = diceMatrix.map((s,si)=>(
        s.map((t,ti)=>{
            let points = 0
            if (si !== choice.side || ti !== choice.tub || removeNum === 1){
                points = scoreTub(t)
            } else {
                points = num * (numMatchingDice(t, num) + 1)
                for (const dice of t){
                    if (dice) {
                        if (dice.num !== num) points += dice.num * numMatchingDice(t, dice.num)
                        else points += num * (numMatchingDice(t, num) + 1)
                    }
                }
            }
            let ch = cHeuristic(points, caravan)
            if (si !== choice.side) ch = ~ch + 1
            return ch
        })
    ))
    // console.log(d)
    return d.flat().reduce((a,b)=>(a+b))
}

function cHeuristic(points, caravan){
    if (points < caravan[0]) return points - caravan[0]
    if (points > caravan[1]) return caravan[1] - points - caravan[0]
    return (points - caravan[0]) / 2
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