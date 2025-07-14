interface GraphNode{                //知识图谱的结点
    id : string
    description: string             //知识点描述
    relativeNode: string[]       //相关的5个知识点id
    x : number
    y : number
    radius : number
    showDescription : boolean
}

interface GraphEdge{
    id : string
    head : string | null             //弧头结点编号
    tail : string | null            //弧尾结点编号
    description: string
}

// class GraphNode{
//     id : string | undefined;
//     description: string = "";                       //知识点描述
//     relativeNode : string[]=['','','','',''];        //相关的5个知识点id

//     x : number = 0;
//     y : number = 0;
//     radius : number = 20;
//     showDescription : boolean = false;

//      // 使用 Partial 接收部分字段
//      constructor(init: Partial<GraphNode>) {
//         if (!init.id || !init.description){
//             throw new Error("missing value!")
//         }
//         Object.assign(this, {
//             relativeNodes: ['','','','',''],
//             x: 0,
//             y: 0,
//             radius: 20,
//             showDescription: false,
//             ...init,
//             // 数组特殊处理
//             relativeNode: [
//                 ...Array(5).fill(''),
//                 ...(init.relativeNode || [])
//             ].slice(0, 5)
//         });
//     }
// }