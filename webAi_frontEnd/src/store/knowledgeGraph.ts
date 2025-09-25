import { defineStore } from 'pinia'
import {ref} from 'vue'
import data from '@/assets/data/knowledge_graph.json'
import problem from "@/assets/data/knowledge_problem.json"

export interface KnowledgeNode {
    id: string
    name: string
    type: 'elec' | 'calculus' | 'pde'
    definition: string
    parents: string[]
    children: string[]
    problem ?: string
    answer ?: string
}
export interface KnowledgeProblem{  // 另外一个专门表示知识点对应习题的表
    id : string
    problem : string
    answer : string
    type : boolean
}

// 第一个参数是应用程序中 store 的唯一 id
export const useKnowledgeGraphStore = defineStore('knowledgeGraph', ()=>{
    const knowledgeMap = ref(new Map<String,KnowledgeNode>())
    const knowledgeGraph = ref<KnowledgeNode[]>(data as KnowledgeNode[])
    const knowledgeProblem = ref<KnowledgeProblem[]>(problem as KnowledgeProblem[])
    const pdeKnowledgeGraph = ref()
    const calculusKnowledgeGraph = ref()
    const elecKnowledgeGraph = ref()
    
    knowledgeGraph.value.forEach( (item : KnowledgeNode)=>{
        knowledgeMap.value.set(item.id,item)  // 创建knowledgeMap
        let problem = knowledgeProblem.value.find((item_)=>item_.id===item.id)
        if (!problem) return
        item.problem = problem?.problem
        item.answer = problem?.answer
    })
    
    function printKnowledgeGraph(courseName : 'elec' | 'calculus' | 'pde' | 'all' = 'all'){
        let graph : KnowledgeNode[]
        switch(courseName){
            case 'elec':
                graph = elecKnowledgeGraph.value
                break;
            case 'calculus' :
                graph = calculusKnowledgeGraph.value
                break;
            case 'pde' : 
                graph = pdeKnowledgeGraph.value
                break;
            default:
                graph = knowledgeGraph.value
        }
        console.log("知识图谱完整结构:")
        console.log(JSON.stringify(graph, null, 2))
        
        console.log("\n节点摘要信息:")
        graph.forEach(node => {
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
    function getKnowledgeGraph(courseName: 'elec' | 'calculus' | 'pde' | 'all' = 'all'): KnowledgeNode[] {
        if (courseName === 'all') return knowledgeGraph.value
        if (courseName === 'elec' && elecKnowledgeGraph.value) return elecKnowledgeGraph.value
        if (courseName === 'calculus' && calculusKnowledgeGraph.value) return calculusKnowledgeGraph.value
        if (courseName === 'pde' && pdeKnowledgeGraph.value) return pdeKnowledgeGraph.value
    
        console.log('map:', knowledgeMap)
        
        let result: KnowledgeNode[] = JSON.parse(JSON.stringify(
            knowledgeGraph.value.filter(node => node.type === courseName)
        )) as KnowledgeNode[]
        
        // 对于需要树状结构的课程
        if (courseName === 'calculus' || courseName === 'pde') {
            const coursePrefix = courseName === 'calculus' ? "微积分" : "数理方程";
            console.log(`为${coursePrefix}课程构建虚拟目录结构...`)
            
            // 1. 提取所有节点的层级结构
            const nodeMap = new Map<string, KnowledgeNode>();
            result.forEach(node => nodeMap.set(node.id, node));
            
            const levelMap = new Map<string, Set<KnowledgeNode>>();
            
            // 2. 按层级分组节点
            result.forEach(node => {
                const parts = node.id.split('-');
                for (let i = 1; i <= parts.length; i++) {
                    const levelKey = parts.slice(0, i).join('-');
                    
                    if (!levelMap.has(levelKey)) {
                        levelMap.set(levelKey, new Set());
                    }
                    
                    levelMap.get(levelKey)?.add(node);
                }
            });
            
            // 3. 创建虚拟目录节点
            const directoryNodes: KnowledgeNode[] = [];
            
            levelMap.forEach((nodes, levelId) => {
                // 跳过叶子节点（实际知识点）
                if (nodeMap.has(levelId)) return;
                
                // 获取该层级节点的名称（取首个节点的名称前缀）
                let levelName = coursePrefix;
                const firstNode = nodes.values().next().value;
                if (firstNode?.name) {
                    // 从节点名称中提取有意义的描述
                    const nameParts = firstNode.name.split(' ');
                    if (nameParts.length > 1) {
                        // 对于数理方程课程，使用更智能的名称提取
                        if (courseName === 'pde') {
                            // 尝试提取更通用的章节名称
                            const chapterName = extractChapterName(levelId, firstNode.name);
                            levelName = chapterName || nameParts.slice(1).join(' ');
                        } else {
                            levelName = nameParts.slice(1).join(' ');
                        }
                    } else {
                        levelName = firstNode.name.replace(firstNode.id, '');
                    }
                    
                    // 清理多余的空格和特殊字符
                    levelName = levelName.replace(/^[\s-]+/, '').replace(/[\s-]+$/, '');
                }
                
                const directoryNode: KnowledgeNode = {
                    id: levelId,
                    name: `${levelId} ${levelName}`, // 示例: "2-1 波动方程"
                    type: courseName,
                    definition: "虚拟目录节点",
                    parents: [],
                    children: []
                };
                
                directoryNodes.push(directoryNode);
                nodeMap.set(levelId, directoryNode);
            });
            
            // 4. 添加虚拟节点到结果集
            result = [...result, ...directoryNodes];
            
            // 5. 建立树状关系
            result.forEach(node => {
                // 重置关系（只保留虚拟目录结构）
                node.parents = [];
                node.children = [];
                
                // 分析当前节点的层级
                const parts = node.id.split('-');
                if (parts.length === 1) return; // 跳过根节点
                
                // 父节点ID（上一级）
                const parentId = parts.slice(0, parts.length - 1).join('-');
                
                // 如果父节点存在
                if (nodeMap.has(parentId)) {
                    node.parents = [parentId];
                    nodeMap.get(parentId)!.children.push(node.id);
                }
            });
            
            // 9. 对数理方程课程的特殊处理
            if (courseName === 'pde') {
                // 确保所有节点都有定义
                result.forEach(node => {
                    if (!node.definition) {
                        node.definition = "数理方程知识点";
                    }
                });
            }
        } 
        // 对于电磁场课程或其他课程，使用原有过滤逻辑
        else {
            result.forEach((node: KnowledgeNode) => {
                node.children = node.children.filter((id: String) => {
                    return knowledgeMap.value.get(id)?.type === courseName
                })
                console.log(`filtered children on node${node.id}:`, node.children)
                
                node.parents = node.parents.filter((id: String) => {
                    return knowledgeMap.value.get(id)?.type === courseName
                })
                console.log(`filtered parents on node${node.id}:`, node.parents)
            })
        }
        
        // 更新缓存
        switch (courseName) {
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
    
    /**
     * 针对数理方程课程提取更合适的章节名称
     * @param levelId 层级ID (如 "2-1")
     * @param exampleName 示例节点名称 (如 "2-1-1 弦振动方程（一维波动方程）")
     */
    function extractChapterName(levelId: string, exampleName: string): string {
        const parts = levelId.split('-');
        const levelDepth = parts.length;
        
        // 根据层级深度决定提取策略
        if (levelDepth === 2) {
            // 顶级章节 (如 "2-1")
            // 尝试提取通用名称
            const match = exampleName.match(/([^\d-]+)/);
            return match ? match[0].trim() : "章节";
        } else if (levelDepth === 3) {
            // 子章节 (如 "2-1-1")
            // 提取更具体的名称
            const nameParts = exampleName.split(' ');
            if (nameParts.length > 1) {
                return nameParts.slice(1).join(' ');
            }
        }
        
        return exampleName.replace(/\d+-\d+/g, '').trim();
    }

    // function filterKnowledgeGraph(ids : string[]):KnowledgeNode[]{
    //     let result : KnowledgeNode[] = []
    //     for (let i = 0; i < knowledgeGraph.value.length; i++){
    //         if (knowledgeGraph.value[i].id === ids)
    //     }
    // }

    return {getKnowledgeGraph,printKnowledgeGraph}
},{
  persist: true
})