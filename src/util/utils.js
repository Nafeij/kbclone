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