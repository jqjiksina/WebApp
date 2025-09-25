<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="doc-container">
    <template v-if="$route.path != '/helpDoc'">
      <RouterView/>
    </template>

    <template v-else>
      <div class="doc-module">
        <el-button 
        style="height: 100%; width: 100%; font-size: 3rem;"
        @click="router.push({name:'DevelopDoc'})">
          <el-icon><Cpu /></el-icon>
          <span>开发文档</span>
        </el-button>
      </div>

      <div class="doc-module">
        <el-button 
        style="height: 100%; width: 100%; font-size: 3rem;"
        @click="router.push({name:'UserDoc'})">
          <el-icon><User /></el-icon>
          <span>用户文档</span>
        </el-button>
      </div>

      <div class="doc-module">
        <a :href="'/docSite'">
          <el-button 
          style="height: 100%; width: 100%; font-size: 3rem;">
            <el-icon><User /></el-icon>
            <span>文档汇总</span>
          </el-button>
        </a>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import { onMounted, ref } from 'vue';
import {useRouter} from 'vue-router'
import {RouterView} from 'vue-router'
import {User,Cpu} from '@element-plus/icons-vue'
import 'github-markdown-css';

const router = useRouter()

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

.doc-container {
  width:100%;height: 100%;
  /* padding: 20px; */
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.doc-module{
  font-size: 3rem;
  margin: 5px;
  /* width: 300px;
  height: 100px; */
  height: 100px;
  border: 2px solid rgb(149, 149, 153);
}
</style>