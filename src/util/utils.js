export function randomSelect(array){
	return array[randomInRange(array.length)]
}
export function randomSplice(array){
    return array.splice(randomInRange(array.length),1)
}
export function randomInRange(max){ // 0 to exclusive
	return Math.floor(Math.random() * max)
}
export function shallowUpdate(array, ind, ele){
    const newArray = array.slice()
    newArray[ind] = ele
    return newArray
}

export function defLength(array){
    return array.filter((e)=>(e !== null)).length
}

export function clamp(num, min, max){
    return Math.min(Math.max(num, min), max)
}

export function strictMod(a,n){
  return ((a % n) + n) % n;
}

export function firstSpace(array){
    for (let index = 0; index < array.length; index++) {
        if (!array[index]) return index
    }
    return -1;
}

export function emptySpaces(array){
    return array.length - defLength(array)
}

export function isFull(arr){
    return !emptySpaces(arr)
}

export function numMatchingDice(arr, num){
    return arr.filter((die)=>die !== null && die.num === num).length
}

export function numMatchingNum(arr, num){
    return arr.filter((die)=> die !== null && die === num).length
}

export function convertToNumMat(diceMatrix){
    return diceMatrix.map(s=>(s.map(t=>(t.filter(d=>d).map(d=>(d.num))))))
}

export function score(num, count){
    return num * (count ** 2)
}

export function scoreTub(tub) {
    let points = 0
    for (const dice of tub){
        if (dice) points += dice.num * numMatchingDice(tub, dice.num);
    }
    return points
}

export function scoreNumTub(tub) {
    let points = 0
    for (const dice of tub){
        if (dice) points += dice * numMatchingNum(tub, dice);
    }
    return points
}

function combinations(n, k) {
    var result = 1;
    for(var i=1; i <= k; i++){
        result *= (n+1-i)/i;
    }
    return result;
}

export function bernou(trials, successes, p){
    const q = 1-p
    return combinations(trials, successes) * (p**successes) * (q**(trials - successes))
}

export function mostCommon(arr){
    const hashmap = arr.reduce( (acc, val) => {
        acc[val] = (acc[val] || 0 ) + 1
        return acc
    },{})
    if (hashmap.length === 1) return Number(Object.keys(hashmap)[0])
    const res = Number(Object.keys(hashmap).reduce((a, b) => hashmap[a] > hashmap[b] ? a : b))
    //console.log(Number(res))
    return {num : res, count : hashmap[res]}
}

export function timeFormatLong(sec){
    if (sec <= 0) return 'None'
    const seconds = Math.floor(sec % 60)
    const minutes = Math.floor((sec / 60) % 60)
    const hours = Math.floor((sec / 3600) % 24)
    const days = Math.floor((sec / 86400))
    return (days ? days + 'd ' : '') +
        (hours ? hours + 'h ' : '') + 
        (minutes ? minutes + 'm ' : '') + 
        seconds + 's'
}

export function eleDimensions(element){
    if (!element) return {height: 0, width: 0}
    const style = getComputedStyle(element)
    return {height: element.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
        width: element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)};
}

export function timeFormat(seconds){
    if (seconds < 0) return '--'
    // const hours = Math.floor((total / 1000 / 60 / 60) % 24);
    return seconds > 9 ? seconds : '0' + seconds
}

export function caravanBounds(tubLen){
    const mid = (tubLen/2)**2
    return [Math.floor(mid*3.5*.91),Math.ceil(mid*6*1.1)]
}