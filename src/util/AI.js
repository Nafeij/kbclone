import { randomInRange, randomSelect, scoreNumTub } from "./Utils"

export function evaluate(diceMatrix, num, profile, turn, settings, turnCount){
    const choices = possibleChoices(diceMatrix, turn, settings)
    if (Math.random() > profile.skill) {
        return randomSelect(choices.filter(c=>(c.side === turn)))
    }

    let maxWeight = -Infinity, bestChoices = []
    for (const choice of choices) {
        const {weight, diceMatNew} = weighDie(num, diceMatrix, turn, choice, settings)

        if (gameComplete(diceMatNew, turnCount, turn, settings)
            && winner(diceMatNew, settings) === turn){
            return choice
        }

        if (weight > maxWeight) {
            maxWeight = weight
            bestChoices = [choice]
        } else if (weight === maxWeight) {
            bestChoices.push(choice)
        }
    }
    return randomSelect(bestChoices)
}

export function scoreAll(num, diceMat, turn, choice, settings, getRaw = false){
    const {diceMatrix, changes} = executeMov(num, diceMat, choice, settings)
    return [scoreStatic(diceMatrix, settings, turn, getRaw), changes, diceMatrix]
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
                if (si !== choice.side && ti === choice.tub) keep = (keep && d !== num)
                if (!keep) changes.push({s:si,t:ti,d:di})
                return keep
            })
        ))
    ))
    if (num) diceMatrix[choice.side][choice.tub].push(num)
    return {diceMatrix,changes}
}

function gameComplete(diceMat, turnCount, turn, settings){
    const {turnLimit, ignoreFull, tubLen, numTubs} = settings

    const numDice = diceMat.map(s=>(s.flat().length)),
        max = tubLen * numTubs

    if (turnLimit && turnCount <= -.5){
        return true
    }

    if (ignoreFull) return numDice[turn] >= max
    return numDice[!turn+0] >= max || numDice[turn] >= max
}

function winner(diceMat, settings){
    let scoreList
    if (settings.caravan){
        scoreList = diceMat.map(s=>(
            s.map(t=>scoreNumTub(t)).filter(sc=>(
                sc >= settings.caravan[0] &&
                sc <= settings.caravan[1]
            ))
        ))
        if (scoreList[1].length !== scoreList[0].length){
            return (scoreList[1].length > scoreList[0].length) + 0
        } else {
            scoreList[0].sort().reverse()
            scoreList[1].sort().reverse()
            for (let i = 0; i < scoreList[0].length; i++) {
                if (scoreList[1][i] !== scoreList[0][i]){
                    return (scoreList[1][i] > scoreList[0][i]) + 0
                }
            }
        }
    } else {
        scoreList = diceMat.map(s=>(
            s.map(t=>scoreNumTub(t)).reduce((a,b)=>(a+b),0)
        ))
        if (scoreList[1] !== scoreList[0]) return (scoreList[1] > scoreList[0]) + 0
    }
    return -1
}

export function cheatDice(diceMatrix, turn, numFaces, settings, turnCount){
    const choices = possibleChoices(diceMatrix, turn, settings)
    let bestNum = 1 + randomInRange(numFaces), bestChoice = randomSelect(choices), maxWeight = -Infinity
    for (const choice of choices) {
        for (let num = 1; num <= numFaces; num++){

            const {weight, diceMatNew} = weighDie(num, diceMatrix, turn, choice, settings)

            if (gameComplete(diceMatNew, turnCount, turn, settings)
                && winner(diceMatNew, settings) === turn){
                return {num, side : choice.side, tub : choice.tub}
            }

            if (weight > maxWeight || (weight === maxWeight && num > bestNum)) {
                maxWeight = weight
                bestChoice = choice
                bestNum = num
            }
        }
    }
    return {num: bestNum, side : bestChoice.side, tub : bestChoice.tub}
}

function weighDie(num, diceMatrix, turn, choice, settings){
    const [scores,  , diceMatNew] = scoreAll(num, diceMatrix, turn, choice, settings)
    return {weight:scores.flat().reduce((a,b)=>(a+b)), diceMatNew}
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