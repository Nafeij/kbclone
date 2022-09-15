import { randomSelect, isFull, numMatchingDice, randomInRange, defLength, score} from "./utils"

export function evaluate(diceMatrix, num, skill, turn, numFaces, settings){
    const choices = possibleChoices(diceMatrix, turn, settings.pickable)
    if (Math.random() > skill) {
        console.log('misplay')
        return randomSelect(choices)
    }

    let maxWeight = -Infinity, bestChoices = []
    for (const choice of choices) {
        let oppSide = !choice.side + 0

        let currWeight = weighDie(num, diceMatrix[choice.side][choice.tub], diceMatrix[oppSide][choice.tub])
        let lost = oppCost(num, diceMatrix, choice, numFaces)
        if (settings.pickable && choice.side !== turn) {
            currWeight = ~currWeight + 1
            if (diceMatrix[choice.side][choice.tub].length - defLength(diceMatrix[choice.side][choice.tub]) === 1){
                currWeight += lost
            } 
        } else {
            currWeight -= lost
        }

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
    let num = 1 + randomInRange(numFaces), choice = randomSelect(choices), weight = -Infinity
    for (const pchoice of choices) {
        for (let face = 1; face <= numFaces; face++){
            const oppSide = !choice.side + 0
            let currWeight = weighDie(face, diceMatrix[pchoice.side][pchoice.tub], diceMatrix[oppSide][pchoice.tub])
            let lost = oppCost(face, diceMatrix, pchoice, numFaces)
            if (settings.pickable && pchoice.side !== turn) {
                currWeight = ~currWeight + 1
                if (diceMatrix[pchoice.side][pchoice.tub].length - defLength(diceMatrix[pchoice.side][pchoice.tub]) === 1){
                    currWeight += lost
                }
            } else {
                currWeight -= lost
            }

            if (currWeight > weight) {
                weight = currWeight
                choice = pchoice
                num = face
            }
        }
    }
    return {num, side : choice.side, tub : choice.tub}
}

function oppCost(num, diceMatrix, choice, numFaces){
    let negWeight = 0
    const oppSide = !choice.side + 0
    for (let face = 1; face <= numFaces; face++){
        if (face != num){
            let currNegWeight = weighDie(face, diceMatrix[choice.side][choice.tub], diceMatrix[oppSide][choice.tub])
            negWeight += currNegWeight
        }
    }
    return negWeight / numFaces
}


function weighDie(num, tub, oppTub){
    const matches = numMatchingDice(tub, num),
        oppMatches = numMatchingDice(oppTub, num)
    return num + matches * num * 2 + score(num, oppMatches) // (n+1)^2 - n^2 - 1
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