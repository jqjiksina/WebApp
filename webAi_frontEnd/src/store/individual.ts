import { defineStore } from "pinia";
import data from '@/assets/data/individual.json'
import { ref } from "vue";

interface InterIndividual{
    学号 : string
    微积分成绩 : number
    数理方程成绩 : number
    出勤率1 : boolean
    出2 : boolean
    出3 : boolean
    出4 : boolean
    出5 : boolean
    出6 : boolean
    出7 : boolean
    出8 : boolean
    出9 : boolean
    出10 : boolean
    出11 : boolean
    正确率1 : number
    正确率2 : number
    正确率3 : number
    正确率4 : number
    正确率5 : number
    正确率6 : number
    正确率7 : number
    正确率8 : number
    正确率9 : number
    正确率10 : number
    正确率11 : number
    推荐路径1 : string
    推荐路径2 : string
    推荐路径3 : string
    推荐路径4 : string
    推荐路径5 : string
    习题掌握度 : string
    整体掌握度 : number
    整体评价 : number
}

export interface Individual{
    sid : string        // 学号
    degree : number   // 习题/知识点掌握度
    route : string[]    // 推荐路径，长度5
}

export const useIndividualStore = defineStore('individual',()=>{
    const interIndividual : InterIndividual[] = (data as InterIndividual[])
    const individual = ref<Individual[]>([])
    interIndividual.forEach((item : InterIndividual)=>{
        individual.value.push({
            sid : item.学号,
            degree : item.整体掌握度,
            route : [item.推荐路径1,item.推荐路径2,item.推荐路径3,item.推荐路径4,item.推荐路径5]
        })
    })

    function printIndividual(){
        console.log("Individual:\n",JSON.stringify(individual.value,null,2))
    }

    return {individual, printIndividual}
},{
    persist : true
})