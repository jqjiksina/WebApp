<template>
    <div v-html="htmlContent" class="markdown-body" ref="markdownRef"></div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref, watch, defineProps} from 'vue';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { ElMessage } from 'element-plus';
import 'github-markdown-css/github-markdown-light.css';

const props = defineProps<{ value: string }>();

const htmlContent = ref('');

const markdownRef = ref<Element>()

let doCopy = (e: Event) => {
    const code = (e.currentTarget as HTMLElement).parentNode?.parentNode?.querySelector('code');
    if (code) {
        navigator
        .clipboard
        .writeText((code as HTMLElement).innerText)
        .then(() => {
            ElMessage.success('复制成功');
        })
        .catch(() => {
            ElMessage.error('复制失败');
        });
    }
};

const marked = new Marked(
    markedHighlight({
        async: false,
        langPrefix: 'language-',
        emptyLangClass: 'no-lang',
        highlight: (code, language) => {
            return hljs.highlightAuto(code, [language]).value;
        },
    })
);

const enhanceCodeBlock = (content: any) => {
    // 直接在<pre>内插入复制按钮，确保唯一性和样式优先级
    return content.replace(/<pre><code/g, `<pre><div class="enhance"><div class="copyCode">复制</div></div><code`);
};

const bindCopyFunction = (el: Element) => {
    const codeBlocks = el.querySelectorAll('pre');
    // console.log("codeBlocks = ", codeBlocks);
    codeBlocks.forEach((codeBlock) => {
        const enhance = codeBlock.querySelector('.enhance');
        // console.log("enhance = ", enhance);
        if (enhance) {
            const copyCode = enhance.querySelector('.copyCode');
            // console.log("copyCode = ", copyCode);
            if (copyCode) {
                copyCode.removeEventListener('click', doCopy);
                copyCode.addEventListener('click', doCopy);
            }
        }
    });
};
let globalMathIdx = 0;
// 替换数学公式的标识符，以防marked.js的渲染将数学公式改变，导致MathJax无法正常渲染数学公式
const processEscapes = (raw: string) => {
    const mathMap = new Map();
    // 获取时间戳
    const timestamp = new Date().getTime();
    // 匹配 $$...$$
    raw = raw.replace(/\$\$([\s\S]+?)\$\$/g, (m) => {
        const key = `MATH_BLOCK_${timestamp}_${globalMathIdx++}__TRANSTRATION`;
        mathMap.set(key, m);
        return key;
    });
    // 匹配 \[...\]
    raw = raw.replace(/\\\[([\s\S]+?)\\\]/g, (m) => {
        const key = `MATH_BLOCK_${timestamp}_${globalMathIdx++}__TRANSTRATION`;
        mathMap.set(key, m);
        return key;
    });
    // 匹配 $...$
    raw = raw.replace(/\$([^$]+?)\$/g, (m) => {
    const key = `MATH_INLINE_${timestamp}_${globalMathIdx++}__TRANSTRATION`;
    mathMap.set(key, m);
    return key;
});
    // 匹配 \\(...\\)
    raw = raw.replace(/\\\((.+?)\\\)/g, (m) => {
        const key = `MATH_INLINE_${timestamp}_${globalMathIdx++}__TRANSTRATION`;
        mathMap.set(key, m);
        return key;
    });
    return { raw, mathMap };
}
// 还原数学公式的标识符，在marked渲染后执行
// 将前面替换的数学公式标识符替换回来，然后再由MarkJax渲染数学公式
const restoreEscapes = (raw: string, mathMap: Map<string, string>) => {
    mathMap.forEach((val, key) => {
        const regex = new RegExp(escapeRegExp(key), 'g');
        const before = raw;
        raw = raw.replace(regex, val);
        // raw = raw.replace(key, val);
        if (before === raw) {
            console.warn(`⚠️ 警告: 键 '${key}' 未在字符串中找到！`); // 如果替换没有发生
        }
    });
    console.log("after restoreEscapes: ",raw)
    return raw;
}

// ... restoreEscapes 处理之后处理小于号大于号，防止识别为html元素 ...
const restoreHtmlElement = (html : string) =>{
    let finalHtml = html; // 假设 html 是 restoreEscapes 处理后的结果

    // 将 LaTeX 环境（$...$ 和 $$...$$）内的 < 和 > 进行转义
    // 使用一个更精确的正则来匹配数学公式环境
    finalHtml = finalHtml.replace(/\$(.*?)\$/g, (match, p1) => {
        // p1 是 $...$ 中间的内容
        let escapedContent = p1.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // 也可以考虑转义 & 符号：.replace(/&/g, '&amp;');
        return '$' + escapedContent + '$';
    });
    // 同样处理块级公式 $$...$$
    finalHtml = finalHtml.replace(/\$\$(.*?)\$\$/g, (match, p1) => {
        let escapedContent = p1.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return '$$' + escapedContent + '$$';
    });
    return finalHtml
}

// 辅助函数：转义正则表达式特殊字符
const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
const parseMarkdown = () => {
    // 数学公式占位符处理
    // 后面marked解析后再替换回来
    const { raw, mathMap } = processEscapes(props.value);
    htmlContent.value = raw;
    nextTick(() => {
        const item = markdownRef.value
        if (!item) return
        // marked 解析
        let html: any = marked.parse(raw) || '';

        console.log("Marked output:", html);

        // 还原数学公式
        html = restoreEscapes(html, mathMap);
        html = restoreHtmlElement(html);
        htmlContent.value = enhanceCodeBlock(html);
        nextTick(() => {
            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise([item]);
            }
            bindCopyFunction(item);
        });
    });
};

watch(
    () => props.value,
    () => {
        parseMarkdown();
    },
    { immediate: true }
);

onMounted(() => {
    if (props.value) {
        parseMarkdown();
    }
});
</script>
<style lang="less">
.markdown-body {
    padding: 0 10px;
    box-sizing: border-box;
}

.mjx-container {
  max-width: 100%;
  overflow-x: auto; /* 如果公式很长，显示横向滚动条 */
}

// svg:not(:root) {

// }

pre {
    position: relative;
    white-space: pre-wrap; /* 代码也可以换行 */
    word-wrap: break-word;
    max-width: 100%; /* 防止容器本身溢出 */
}

pre .enhance {
    display: flex;
    color: #247aaa;
    padding: 5px 5px 0 0;
    box-sizing: border-box;
    font-size: 12px;
    border-radius: 9px;
    justify-content: flex-end;
    align-items: flex-start;
    position: absolute;
    top: 0;
    right: 0;
    height: 36px;
    z-index: 2;
    background: transparent;
}

pre .enhance .copyCode {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: #fff;
    border-radius: 6px;
    padding: 2px 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    margin-top: 4px;
    margin-right: 4px;
    transition: color 0.2s;
    font-weight: bold;
    &:hover {
        color: rgba(2, 120, 255, 0.84);
        background: #f0f7ff;
    }
    i {
        font-size: 16px;
        margin-left: 5px;
    }
}

.markdown-body code,
.markdown-body tt {
    background-color: #ffe6e6;
    color: #df3b3b;
}
</style>
