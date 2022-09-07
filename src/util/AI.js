import { randomSelect, isFull, numMatchingDice, randomInRange, defLength, mostCommon} from "./utils"

export function evaluate(diceMatrix, num, skill, turn){
    const choices = []
    for (let i = 0; i < diceMatrix[turn].length; i++) {
        if (!isFull(diceMatrix[turn][i])){
            choices.push(i)
        }
    }
    let best = randomSelect(choices)
    if (Math.random() > skill) return best

    const oppTurn = !turn + 0
    let maxWeight = 0
    for (let j = 0; j < choices.length; j++) {
        let currWeight = 0,  i = choices[j]
        switch (numMatchingDice(diceMatrix[turn][i], num)) {
            case 2: currWeight += 4; break;
            case 1: currWeight += 2; break;
            default: break;
        }
        switch (numMatchingDice(diceMatrix[oppTurn][i], num)) {
            case 3: currWeight += 9; break;
            case 2: currWeight += 4; break;
            case 1: currWeight++; break;
            default: break;
        }
        if (defLength(diceMatrix[turn][i]) > 1) currWeight--
        if (currWeight > maxWeight) {
            maxWeight = currWeight
            best = choices[j]
        }
    }
    return best
}

export function cheatDice(diceMatrix, turn){
    const randinit = randomInRange(6) + 1
    // const arr = diceMatrix.flat().flat().filter(n=>n)
    const arr = diceMatrix.map((e,i)=>{
        if (i === turn) return e.filter(t=>!isFull(t)).flat().filter(v=>v).map(v=>v.num)
        else return e.flat().filter(v=>v).map(v=>v.num)
    }).flat().filter(e=>e)
    if (!arr.length) return randinit
    return mostCommon(arr)
}