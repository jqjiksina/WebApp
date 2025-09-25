<template>
  <div class="em-exercise-container">
    <!-- 顶部导航 -->
    <div class="navigation">
      <el-button 
        type="primary" 
        plain 
        :disabled="currentIndex === 0"
        @click="prevQuestion"
      >
        <el-icon><ArrowLeft /></el-icon> 上一题
      </el-button>
      
      <div class="progress-info">
        <span>题目 {{ currentIndex + 1 }} / {{ practice.length }}</span>
        <el-progress :percentage="progressPercentage" :stroke-width="10" />
      </div>
      
      <el-button 
        type="primary" 
        plain 
        :disabled="currentIndex === practice.length - 1"
        @click="nextQuestion"
      >
        下一题 <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>
    
    <!-- 题目卡片 -->
    <el-card class="question-card">
      <div class="question-header">
        <h3 class="question-id">题目 ID: {{ currentQuestion.id }}</h3>
        <el-button 
          type="primary" 
          plain 
          :icon="Star" 
          @click="toggleBookmark(currentQuestion.id)"
          :class="{ 'bookmarked': isBookmarked(currentQuestion.id) }"
        >
          {{ isBookmarked(currentQuestion.id) ? '已收藏' : '收藏' }}
        </el-button>
      </div>
      
      <div class="question-content">
        <!-- <div v-html="renderMathFormula(currentQuestion.problem)" class="latex-content" /> -->
         <Markdown :value="currentQuestion.problem"></Markdown>
      </div>
      
      <!-- 答题区域 -->
      <div class="answer-area">
        <el-input 
          v-model="userAnswer" 
          placeholder="请输入您的答案..." 
          @keyup.enter="submitAnswer"
          :disabled = problemStates[currentIndex].answered
          clearable
          class="answer-input"
        />
        
        <div class="action-buttons">
          <el-button type="primary" @click="submitAnswer">提交答案</el-button>
          <el-button @click="resetAnswer">重新作答</el-button>
        </div>
      </div>
      
      <!-- 答案反馈 -->
      <div v-if="answerSubmitted" class="answer-feedback">
        <div class="feedback-header" :class="isAnswerCorrect ? 'correct' : 'incorrect'">
          <el-icon class="feedback-icon" v-if="isAnswerCorrect"><CircleCheckFilled  /></el-icon>
          <el-icon class="feedback-icon" v-else><CircleCloseFilled  /></el-icon>
          <span>{{ isAnswerCorrect ? '回答正确！' : '回答错误！' }}</span>
        </div>
        
        <div class="correct-answer">
          <h4>正确答案：</h4>
          <!-- <div v-html="renderMathFormula(currentQuestion.answer)" class="latex-content" /> -->
          <Markdown :value="currentQuestion.answer"></Markdown>
        </div>
      </div>
    </el-card>
    
    <!-- 题目索引 -->
    <div class="question-index-container">
      <div 
        v-for="(q, index) in practice" 
        :key="q.id"
        class="question-index"
        :class="{
          'current': index === currentIndex,
          'answered': answeredStatus[index],
          'correct': answeredStatus[index] && isAnswerCorrectAtIndex(index)
        }"
        @click="goToQuestion(index)"
      >
        {{ index + 1 }}
      </div>
    </div>
  </div>
</template>
  
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { CircleCheckFilled, CircleCloseFilled, Star, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { usePracticeStore } from '@/store/practice'
// import type { Practice } from '@/stores/practice'
import Markdown from '@/components/Markdown.vue'

const problemStates = Array.from({ length: 100 }, () => ({
  answered: false,
  isTrue: false
}));

interface ProblemState{
  answered : boolean
  isTrue : boolean
}
const updateTimes = ref(0)  // 触发更新学生信息阈值，从而重新生成学生相关路径推荐，在每次ProblemState更新后变化
const UPDATE_THRESHOLD = 5

// 习题数据（从外部传入）
const practice = usePracticeStore().practice

// 当前题目索引
const currentIndex = ref(0)

// 用户答案
const userAnswer = ref('')

// 答案提交状态
const answerSubmitted = ref(false)

// 答案是否正确
const isAnswerCorrect = ref(false)

// 题目回答状态
const answeredStatus = ref<boolean[]>([])

// 收藏题目
const bookmarkedQuestions = ref<string[]>([])

// 当前题目
const currentQuestion = computed(() => {
  return practice[currentIndex.value]
})

// 进度百分比
const progressPercentage = computed(() => {
  const answeredCount = answeredStatus.value.filter(status => status).length
  return Math.round((answeredCount / practice.length) * 100)
})

// 提交答案并上传。。
function submitAnswer() {
  if (!userAnswer.value.trim()) {
    ElMessage.warning('请输入答案')
    return
  }
  
  answerSubmitted.value = true
  answeredStatus.value[currentIndex.value] = true
  
  // 答案对比逻辑
  const correctAnswer = currentQuestion.value.answer.replace(/\\\(/g,'').replace(/\\\)/g,'').replace(/ /g,'').replace(/\\\,/g,"")
  .replace(/\\text\{([^}]*)\}/g, '$1')
  const userInput = userAnswer.value.trim().toLowerCase()
  
  // 实际应用中可能需要更复杂的数学表达式等价性判断
  const isEqual = correctAnswer === userInput
  
  isAnswerCorrect.value = isEqual
  
  if (isEqual) {
    ElMessage.success('回答正确！')
  } else {
    ElMessage.error('回答错误，请查看正确答案')
  }
}

// 重置答案
function resetAnswer() {
  userAnswer.value = ''
  answerSubmitted.value = false
  isAnswerCorrect.value = false
}

// 上一题
function prevQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    resetAnswer()
  }
}

// 下一题
function nextQuestion() {
  if (currentIndex.value < practice.length - 1) {
    currentIndex.value++
    resetAnswer()
  }
}

// 跳转到指定题目
function goToQuestion(index: number) {
  currentIndex.value = index
  resetAnswer()
}

// 收藏功能
function isBookmarked(questionId: string): boolean {
  return bookmarkedQuestions.value.includes(questionId)
}

function toggleBookmark(questionId: string) {
  const index = bookmarkedQuestions.value.indexOf(questionId)
  if (index > -1) {
    bookmarkedQuestions.value.splice(index, 1)
    ElMessage.success('已移除收藏')
  } else {
    bookmarkedQuestions.value.push(questionId)
    ElMessage.success('已添加到收藏')
  }
  saveBookmarks()
}

function saveBookmarks() {
  localStorage.setItem('em-bookmarks', JSON.stringify(bookmarkedQuestions.value))
}

// 检查指定题目的答案是否正确
function isAnswerCorrectAtIndex(index: number): boolean {
  // 在实际应用中，这里应该根据用户答案和正确答案进行对比
  // 这里简化为随机返回正确/错误
  return Math.random() > 0.5
}

// 初始化回答状态
watch(practice, (newPractice) => {
  if (newPractice.length > 0) {
    answeredStatus.value = new Array(newPractice.length).fill(false)
  }
}, { immediate: true })

// 加载收藏
onMounted(() => {
  const savedBookmarks = localStorage.getItem('em-bookmarks')
  if (savedBookmarks) {
    try {
      bookmarkedQuestions.value = JSON.parse(savedBookmarks)
    } catch (e) {
      console.error('Error parsing bookmarks', e)
    }
  }
})
</script>
  
<style scoped>
.em-exercise-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  margin-bottom: 20px;
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.progress-info span {
  font-size: 16px;
  font-weight: 500;
  color: #409eff;
}

.question-card {
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  margin-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.question-id {
  font-size: 18px;
  color: #303133;
  margin: 0;
}

.bookmarked {
  background-color: #fff8e6;
  border-color: #ffd666;
}

.question-content {
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f9fbfd;
  border-radius: 6px;
  border-left: 4px solid #3498db;
}

.answer-area {
  padding: 20px;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  background: #fafcff;
}

.answer-input {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.answer-feedback {
  margin-top: 25px;
  padding: 20px;
  border-radius: 8px;
  background-color: #f8fafc;
  border: 1px solid #e1e8ed;
}

.feedback-header {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 500;
  padding-bottom: 15px;
  margin-bottom: 15px;
  border-bottom: 1px dashed #e1e8ed;
}

.feedback-header.correct {
  color: #16a34a;
}

.feedback-header.incorrect {
  color: #dc2626;
}

.feedback-icon {
  margin-right: 10px;
  font-size: 24px;
}

.correct-answer {
  margin-bottom: 20px;
  padding: 15px;
  background-color: white;
  border-radius: 6px;
}

.correct-answer h4 {
  margin-bottom: 10px;
  color: #2d3748;
}

.question-index-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
  justify-content: center;
}

.question-index {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s;
}

.question-index:hover {
  border-color: #409eff;
  color: #409eff;
}

.question-index.current {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.question-index.answered {
  background-color: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.question-index.correct {
  background-color: #f0f9eb;
  border-color: #67c23a;
  color: #67c23a;
}

/* LaTeX相关样式 */
.latex-inline {
  display: inline-block;
  margin: 0 2px;
  color: #d13b40;
  font-weight: bold;
}

.latex-display {
  margin: 12px 0;
  text-align: center;
  font-weight: bold;
  color: #d13b40;
}
</style>