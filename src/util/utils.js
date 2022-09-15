export function randomSelect(array){
	return array[randomInRange(array.length)]
}
export function randomInRange(max){
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

export function firstSpace(array){
    for (let index = 0; index < array.length; index++) {
        if (!array[index]) return index
    }
    return -1;
}

export function isFull(arr){
    const limit = arr.length - 1
    return defLength(arr) > limit
}

export function numMatchingDice(arr, num){
    return arr.filter((die)=>die !== null && die.num === num).length
}

export function score(num, count){
    return num * (count ** 2)
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

/* export function timeFormat(sec){
    if (sec < 0) return '--:--'
    const seconds = Math.floor(sec % 60);
    const minutes = Math.floor((sec / 60) % 60);
    // const hours = Math.floor((total / 1000 / 60 / 60) % 24);
    return (minutes > 9 ? minutes : '0' + minutes) + ':'
    + (seconds > 9 ? seconds : '0' + seconds)
} */

export function timeFormat(seconds){
    if (seconds < 0) return '--'
    // const hours = Math.floor((total / 1000 / 60 / 60) % 24);
    return seconds > 9 ? seconds : '0' + seconds
}