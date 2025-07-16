import { defineStore } from 'pinia'
import {ref} from 'vue'
import data from '@/assets/data/knowledge_graph.json'

export interface KnowledgeNode {
    id: string
    name: string
    type: 'elec' | 'calculus' | 'pde'
    definition: string
    parents: string[]
    children: string[]
}

// 第一个参数是应用程序中 store 的唯一 id
export const useKnowledgeGraphStore = defineStore('knowledgeGraph', ()=>{
    const knowledgeGraph = ref<KnowledgeNode[]>(data as KnowledgeNode[])
    const pdeKnowledgeGraph = ref()
    const calculusKnowledgeGraph = ref()
    const elecKnowledgeGraph = ref()
    
    function printKnowledgeGraph(){
        console.log("知识图谱完整结构:")
        console.log(JSON.stringify(knowledgeGraph.value, null, 2))
        
        console.log("\n节点摘要信息:")
        knowledgeGraph.value.forEach(node => {
            console.log(`ID: ${node.id} | 名称: ${node.name} | 类型: ${node.type}`)
            console.log(`定义: ${node.definition}`)
            console.log(`父节点: [${node.parents.join(', ')}]`)
            console.log(`子节点: [${node.children.join(', ')}]`)
            console.log('----------------------------------')
        })
    }
    /**
     * 从知识图谱中过滤不同课程的结点，并返回过滤后的知识图谱
     * @param courseName 
     */
    function getKnowledgeGraph(courseName : 'elec' | 'calculus' | 'pde' | 'all' = 'all'):KnowledgeNode[]{
        if (courseName === 'all') return knowledgeGraph.value
        if (courseName === 'elec' && elecKnowledgeGraph.value) return elecKnowledgeGraph.value
        if (courseName === 'calculus' && calculusKnowledgeGraph.value) return calculusKnowledgeGraph.value
        if (courseName === 'pde' && pdeKnowledgeGraph.value) return pdeKnowledgeGraph.value

        let result : KnowledgeNode[] =  knowledgeGraph.value.filter(node=>node.type===courseName)
        switch(courseName){ // update cache
            case 'elec':
                elecKnowledgeGraph.value = result
                break
            case 'pde':
                pdeKnowledgeGraph.value = result
                break
            case 'calculus':
                calculusKnowledgeGraph.value = result
                break
        }
        return result
    }

    return {getKnowledgeGraph,printKnowledgeGraph}
},{
  persist: true
})