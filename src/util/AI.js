import { randomSelect, numMatchingNum, randomInRange, score, bernou, scoreNumTub} from "./utils"

export function evaluate(diceMatrix, num, profile, turn, numFaces, settings){
    const choices = possibleChoices(diceMatrix, turn, settings)
    if (Math.random() > profile.skill) {
        // console.log('misplay')
        return randomSelect(choices.filter(c=>(c.side === turn)))
    }

    let maxWeight = -Infinity, bestChoices = []
    for (const choice of choices) {

        let currWeight = weighDie(num, diceMatrix, turn, choice, settings)

        if (currWeight > maxWeight) {
            maxWeight = currWeight
            bestChoices = [choice]
        } else if (currWeight === maxWeight) {
            bestChoices.push(choice)
        }
    }
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

export function scoreAll(num, diceMat, turn, choice, settings, getRaw = false){
    const {diceMatrix, changes} = executeMov(num, diceMat, choice, settings)
    return {scores : scoreStatic(diceMatrix, settings, turn, getRaw), changes}
}

function scoreStatic(diceMatrix, settings, playerSide, getRaw){
    const opp = (ti,si)=>(diceMatrix[!si+0][ti]);
    return diceMatrix.map((s,si)=>(
        s.map((t, ti)=>{
            let points = scoreNumTub(t)
            if (getRaw) return points
            if (settings.caravan) points = cHeuristic(points, settings, t.length)
            const relFullness = (opp(ti,si).length - t.length + settings.tubLen)/settings.tubLen
            points *= relFullness + 1
            if (si !== playerSide) points = ~points + 1
            return points
        })
    ))
}
    
function executeMov(num, diceMatrix, choice, settings){
    const onePos = diceMatrix[choice.side][choice.tub].length, changes = []
    let removeNum = null
    if (settings.caravan && num === 1 && onePos >= 1) {
        removeNum = diceMatrix[choice.side][choice.tub][onePos-1]
        if (removeNum === 1) num = null
    }
    diceMatrix = diceMatrix.map((s,si)=>(
        s.map((t,ti)=>(
            t.filter((d,di)=>{
                let keep = d !== removeNum
                if (si !== choice.side && ti === choice.tub) keep = keep && d !== num
                if (!keep) changes.push({s:si,t:ti,d:di})
                return keep
            })
        ))
    ))
    if (num) diceMatrix[choice.side][choice.tub].push(num)
    return {diceMatrix,changes}
}

/* function gameComplete(position, settings){
    const {diceMatrix, turn} = position
    if (settings.ignoreFull) return diceMatrix[turn].flat().length === (settings.tubLen * settings.numTubs)
    return diceMatrix[!turn + 0].flat().length === (settings.tubLen * settings.numTubs)
} */

export function cheatDice(diceMatrix, turn, numFaces, settings){
    // console.log('cheat')
    const choices = possibleChoices(diceMatrix, turn, settings)
    let num = 1 + randomInRange(numFaces), bestChoice = randomSelect(choices), weight = -Infinity
    for (const choice of choices) {
        for (let face = 1; face <= numFaces; face++){
            let currWeight = weighDie(face, diceMatrix, turn, choice, settings)

            if (currWeight > weight || (currWeight === weight && face > num)) {
                weight = currWeight
                bestChoice = choice
                num = face
            }
        }
    }
    return {num, side : bestChoice.side, tub : bestChoice.tub}
}

/* function oppCost(num, diceMatrix, choice, numFaces, settings){
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
} */


function weighDie(num, diceMatrix, turn, choice, settings){
    return scoreAll(num, diceMatrix, turn, choice, settings).scores.flat().reduce((a,b)=>(a+b))
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