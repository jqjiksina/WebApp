import { defineStore } from 'pinia'
import {ref} from 'vue'
import data from '@/assets/data/problem100.json'

export interface Practice{
    id : string
    relative : string[]
    problem : string
    answer : string
}

interface InterPractice{
    题目id : string
    知识点1 : string
    知识点2 : string
    知识点3 : string
    题目 : string
    答案 : string
}

export const usePracticeStore = defineStore('practice',()=>{
    const interPractice : InterPractice[] = (data as InterPractice[])

    const practice = ref<Practice[]>([])
    
    interPractice.forEach((item : InterPractice) => {
        let relative_ = []
        if (item.知识点1) relative_.push(item.知识点1)
        if (item.知识点2) relative_.push(item.知识点2)
        if (item.知识点3) relative_.push(item.知识点3)
        
        practice.value.push({
            id : item.题目id,
            relative : relative_,
            problem : item.题目,
            answer : item.答案,
        })
    })

    function printPractice(){
        console.log(JSON.stringify(practice.value,null,2))
    }

    return {practice,printPractice}
},{
    persist : true
})