import { randomInRange, randomSelect, scoreNumTub } from "./Utils"

export function evaluate(diceMatrix, num, profile, turn, settings, turnCount){
  const choices = possibleChoices(diceMatrix, turn, settings)
  if (Math.random() > profile.skill) {
    return randomSelect(choices.filter(c=>(c.side === turn))) // only choose own side
  }
  // console.log(choices)
  let maxWeight = -Infinity, bestChoices = [choices[0]]
  for (const choice of choices) {
    const {weight, diceMatNew} = weighDie(num, diceMatrix, turn, choice, settings)

    if (gameComplete(diceMatNew, turnCount, turn, settings)){
      if (winner(diceMatNew, settings) === turn) {
        return choice
      }
      continue
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
  const {diceMatrix, removedAt} = executeMov(num, diceMat, choice, settings)
  return [scoreStatic(diceMatrix, settings, turn, getRaw), removedAt, diceMatrix]
}

function scoreStatic(diceMatrix, settings, playerSide, getRaw){
  const oppTub = (ti,si)=>(diceMatrix[!si+0][ti]);
  return diceMatrix.map((s,si)=>(
    s.map((t, ti)=>{
      let points = scoreNumTub(t)
      if (getRaw) return points
      if (settings.caravan) {
        points = cHeuristic(points, settings, t.length)
      }
      const relFullness = (oppTub(ti,si).length - t.length + settings.tubLen)/settings.tubLen
      points *= relFullness + 1
      if (si !== playerSide) {
        points = -points
      }
      return points
    })
  ))
}

function executeMov(removeNum, diceMatrix, choice, settings){
  const onePos = diceMatrix[choice.side][choice.tub].length, removedAt = []
  if (settings.caravan && removeNum === 1 && onePos > 0) {
    removeNum = diceMatrix[choice.side][choice.tub][onePos-1]
    diceMatrix = diceMatrix.map((s,si)=>(
      s.map((t,ti)=>(
        t.filter((d,di)=>{
          let doPop = d === removeNum
          if (si !== choice.side && ti === choice.tub) {
            doPop ||= d === 1
          }
          if (doPop) {
            removedAt.push({s:si,t:ti,d:di})
          }
          return !doPop
        })
      ))
    ))
    if (removeNum !== 1) {
      diceMatrix[choice.side][choice.tub].push(1)
    } // do not add joker to board if it is removed
  } else {
    let oppSide = !choice.side+0
    diceMatrix[oppSide][choice.tub] = diceMatrix[oppSide][choice.tub].filter((d,di)=>{
      let doPop = d === removeNum
      if (doPop) {
        removedAt.push({s:oppSide,t:choice.tub,d:di})
      }
      return !doPop
    })
    diceMatrix[choice.side][choice.tub].push(removeNum)
  }
  return {diceMatrix, removedAt}
}

function gameComplete(diceMat, turnCount, turn, settings){
  const {turnLimit, ignoreFull, tubLen, numTubs} = settings
  const numDice = diceMat.map(s=>(s.flat().length)),
    max = tubLen * numTubs

  if (turnLimit && turnCount <= -.5){
    return true
  }
  if (ignoreFull){
    return numDice[turn] >= max
  }
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
  let bestNum = 1 + randomInRange(numFaces),
    bestChoice = randomSelect(choices),
    maxWeight = -Infinity
  for (const choice of choices) {
    for (let num = 1; num <= numFaces; num++){

      const {weight, diceMatNew} = weighDie(num, diceMatrix, turn, choice, settings)

      if (gameComplete(diceMatNew, turnCount, turn, settings)){
        if (winner(diceMatNew, settings) === turn) {
          return {num, side : choice.side, tub : choice.tub}
        }
        continue
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
  return {weight:scores.flat().reduce((a,b)=>(a+b),0), diceMatNew}
}

function cHeuristic(points, settings, tLen){
  const caravan = settings.caravan
  if (points < caravan[0]) {
    if (tLen < settings.tubLen) return points - caravan[0]
    return points - 2*caravan[0]
  }
  if (points > caravan[1]) {
    return caravan[1] - points - caravan[0]
  }
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