<template>
    <div v-highlight class="helpDoc-container markdown-body"  v-html="htmlContent"/>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import { onMounted, ref } from 'vue';
import 'github-markdown-css';

const md = new MarkdownIt()

const htmlContent = ref("")

onMounted(async () => {
  try {
    // 加载public目录下的文件资源
    const docPath = '/docs/DevelopManual/DevelopManual.md'
    const response = await fetch(docPath);
    const index = docPath.lastIndexOf('/')
    const imgPathPrefix = docPath.substring(0,index)
    
    let markdownText = await response.text();
    markdownText = markdownText.replace(/!\[(.*?)\]\((.*?)\)/g,(_match, altText, imgPath)=>{
        return `![${altText}](${imgPathPrefix}/${imgPath})`
    })
    htmlContent.value = md.render(markdownText);
  } catch (error) {
    console.error('加载文档失败:', error);
    htmlContent.value = '<p>⚠️ 文档加载失败</p>';
  }
});

</script>

<style scoped>
.helpDoc-container{
    background-color: var(--color-background-soft);
    color: var(--color-text)
}
</style>