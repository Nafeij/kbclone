import { randomSelect, isFull, numMatchingNum, randomInRange, defLength, score, emptySpaces, bernou, scoreTub, scoreNumTub} from "./utils"

export function evaluate(diceMatrix, num, profile, turn, numFaces, settings){
    // diceMatrix = diceMatrix.map(s=>(s.map(t=>(t.map(d=>(d ? d.num : d))))))
    const choices = possibleChoices(diceMatrix, turn, settings)
    if (Math.random() > profile.skill) {
        // console.log('misplay')
        return randomSelect(choices)
    }

    let maxWeight = -Infinity, bestChoices = []
    for (const choice of choices) {

        let currWeight = weighDie(num, diceMatrix, choice, settings)
        if (!settings.caravan){
            let lost = oppCost(num, diceMatrix, choice, numFaces, settings)
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

/* function minMax(position, depth=4 use turn limit, isMaximize=true, settings){ player is max
    if (depth === 0 || gameComplete(position, settings)){
        return scoreStatic(diceMatrix, settings, 1, false).flat().reduce((a,b)=>a+b)
    }
    if (isMaximize){
        let maxEval = -Infinity
        for (const choice of possibleChoices2(position.diceMatrix, isMaximize+0, settings, position.num)) {
            const diceMatrix = executeMov(position.num, position.diceMatrix, choice, settings)
            let evl = 0
            for (let num = 1; num <= numFaces; num++){
                evl += minMax({num, diceMatrix}, depth-1, false, settings)
            }
            maxEval = Math.max(maxEval, evl)
        }
        return maxEval
    } else {
        let minEval = Infinity
        for (const choice of possibleChoices2(position.diceMatrix, isMaximize+0, settings, position.num)) {
            const diceMatrix = executeMov(position.num, position.diceMatrix, choice, settings)
            let evl = 0
            for (let num = 1; num <= numFaces; num++){
                evl += minMax({num, diceMatrix}, depth-1, true, settings)
            }
            minEval = Math.min(minEval, evl)
        }
        return minEval
    }
} */

export function scoreAll(num, diceMatrix, choice, settings, getRaw = false){
    diceMatrix = executeMov(num, diceMatrix, choice, settings)
    return scoreStatic(diceMatrix, settings, choice.side, getRaw)
}

function scoreStatic(diceMatrix, settings, playerSide, getRaw){
    return diceMatrix.map((s,si)=>(
        s.map((t)=>{
            let points = scoreNumTub(t)
            if (getRaw) return points
            if (settings.caravan) points = cHeuristic(points, settings, t.length)
            if (si !== playerSide) points = ~points + 1
            return points
        })
    ))
}

function gameComplete(position, settings){
    const {diceMatrix, turn} = position
    if (settings.ignoreFull) return diceMatrix[turn].flat().length === (settings.tubLen * settings.numTubs)
    return diceMatrix[!turn + 0].flat().length === (settings.tubLen * settings.numTubs)
}

export function cheatDice(diceMatrix, turn, numFaces, settings){
    // console.log('cheat')
    const choices = possibleChoices(diceMatrix, turn, settings)
    let num = 1 + randomInRange(numFaces), bestChoice = randomSelect(choices), weight = -Infinity
    for (const choice of choices) {
        for (let face = 1; face <= numFaces; face++){
            let currWeight = weighDie(face, diceMatrix, choice, settings)
            if (!settings.caravan) {
                let lost = oppCost(face, diceMatrix, choice, numFaces, settings)
                currWeight -= lost
            }
            if (settings.pickable && choice.side !== turn) currWeight = ~currWeight + 1
            //console.log(`choice: ${choice.side ? 'player' : 'oppnnt'} ${choice.tub} weight : ${currWeight}`)

            if (currWeight > weight || (currWeight === weight && face > num)) {
                weight = currWeight
                bestChoice = choice
                num = face
            }
        }
    }
    return {num, side : bestChoice.side, tub : bestChoice.tub}
}

function oppCost(num, diceMatrix, choice, numFaces, settings){
    if (settings.caravan){
        let negWeight = 0
        for (let face = 1; face <= numFaces; face++){
            if (face != num){
                let currNegWeight = weighDie(face, diceMatrix, choice, caravan)
                negWeight += currNegWeight
            }
        }
        return negWeight
    }
    const tub = diceMatrix[choice.side][choice.tub], oppTub = diceMatrix[!choice.side+0][choice.tub]
    // if (defLength(tub) === 0) return 0
    const empty = settings.tubLen - tub.length,
        emptyTotal =  (settings.tubLen * settings.numTubs) - diceMatrix[choice.side].flat().length,
        oppEmpty = settings.tubLen - oppTub.length,
        oppEmptyTotal = (settings.tubLen * settings.numTubs) - diceMatrix[!choice.side+0].flat().length
    const likelihood = (1 - Array(empty).fill()
        .map((_,i)=>(bernou(emptyTotal, i, 1/numFaces)))
        .reduce((a,b) => (a+b))) * (
            oppEmpty ? ((numFaces - 1) / numFaces) ** oppEmptyTotal : 1
        )
    let maxVal = 0
    for (let face = 1; face <= numFaces; face++){
        if (face != num){
            const baseCount = numMatchingNum(tub,face)
            const currVal = face * (empty + baseCount - 1) * 2
            maxVal = Math.max(currVal, maxVal)
        }
    }
    return maxVal * likelihood
}


function weighDie(num, diceMatrix, choice, settings){

    if (settings.caravan) return scoreAll(num, diceMatrix, choice, settings).flat().reduce((a,b)=>(a+b))

    const oppSide = !choice.side + 0
    const tub = diceMatrix[choice.side][choice.tub]
    const oppTub = diceMatrix[oppSide][choice.tub]
    const matches = numMatchingNum(tub, num),
        oppMatches = numMatchingNum(oppTub, num)
    return num + matches * num * 2 + score(num, oppMatches)
}

function executeMov(num, diceMatrix, choice, settings){
    const onePos = diceMatrix[choice.side][choice.tub].length
    let removeNum = null
    if (settings.caravan && num === 1 && onePos >= 1) {
        removeNum = diceMatrix[choice.side][choice.tub][onePos-1]
        if (removeNum === 1) num = null
    }
    diceMatrix = diceMatrix.map((s,si)=>(
        si === choice.side ? s.map((t)=>(
            t.filter(d=>(d !== removeNum))
        )) :
        s.map((t,ti)=>(
            ti === choice.tub ? 
            t.filter(d=>(d !== num && d !== removeNum)) :
            t.filter(d=>(d !== removeNum))
        ))
    ))
    if (num) diceMatrix[choice.side][choice.tub].push(num)
    return diceMatrix
}

function cHeuristic(points, settings, tLen){
    const caravan = settings.caravan
    if (points < caravan[0]) {
        if (tLen < settings.tubLen) return points - caravan[0]
        return points - 2*caravan[0]
    }
    if (points > caravan[1]) return caravan[1] - points - caravan[0]
    return (points - caravan[0]) / 2
}

function possibleChoices(diceMatrix, side, settings){
    const choices = [], oppSide = !side + 0
    for (let tub = 0; tub < settings.numTubs; tub++) {
        if (diceMatrix[side][tub].length < settings.tubLen){
            choices.push({side, tub})
        }
        if (settings.pickable && diceMatrix[oppSide][tub].length < settings.tubLen){
            choices.push({side : oppSide, tub})
        }
    }
    return choices
}

/* function possibleChoices2(diceMatrix, side, settings, num){
    const choices = new PriorityQueue({ comparator: function(a, b) { return b.w - a.w; }})
    , oppSide = !side + 0
    for (let tub = 0; tub < settings.numTubs; tub++) {
        if (diceMatrix[side][tub].length < settings.tubLen){
            choices.push({side, tub, w : weighDie(num, diceMatrix,{side, tub},settings)})
        }
        if (settings.pickable && diceMatrix[oppSide][tub].length < settings.tubLen){
            choices.push({side : oppSide, tub, w : weighDie(num, diceMatrix,{side : oppSide, tub},settings)})
        }
    }
    return choices
} */

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