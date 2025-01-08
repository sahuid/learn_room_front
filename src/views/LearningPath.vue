<template>
  <div class="page-container">
    <!-- 路线概览卡片 -->
    <div class="content-card">
      <h2 class="section-title">刷题路线图</h2>
      <div class="path-overview">
        <div ref="chartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 详细说明卡片 -->
    <div class="content-card">
      <h2 class="section-title">阶段详解</h2>
      <div class="path-details">
        <a-collapse v-model:activeKey="activeKeys" :bordered="false">
          <a-collapse-panel 
            v-for="(step, index) in learningPath" 
            :key="index"
            :header="step.title"
          >
            <div class="step-content">
              <div class="step-description">{{ step.description }}</div>
              <div class="step-topics">
                <h4>重点题型：</h4>
                <div class="topic-tags">
                  <a-tag 
                    v-for="topic in step.topics" 
                    :key="topic"
                    color="blue"
                  >
                    {{ topic }}
                  </a-tag>
                </div>
              </div>
              <div class="step-questions" v-if="step.recommendQuestions?.length">
                <h4>推荐题目：</h4>
                <a-list :data-source="step.recommendQuestions" size="small">
                  <template #renderItem="{ item }">
                    <a-list-item>
                      <a @click="goToQuestion(item.id)" class="question-link">
                        {{ item.title }}
                      </a>
                    </a-list-item>
                  </template>
                </a-list>
              </div>
            </div>
          </a-collapse-panel>
        </a-collapse>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { learningPathApi } from '@/api/learningPath'
import { message } from 'ant-design-vue'

const router = useRouter()
const activeKeys = ref(['0'])
const chartRef = ref(null)
let chart = null
const learningPath = ref([])

// 获取学习路线数据
const fetchLearningPaths = async () => {
  try {
    const res = await learningPathApi.getLearningPaths()
    if (res.code === 200) {
      learningPath.value = res.value
      initChart()
    } else {
      message.error(res.msg || '获取学习路线失败')
    }
  } catch (error) {
    console.error('获取学习路线失败:', error)
    message.error('获取学习路线失败')
  }
}

// 初始化图表
const initChart = () => {
  if (chart) {
    chart.dispose()
  }

  const chartDom = chartRef.value
  chart = echarts.init(chartDom)

  const nodes = learningPath.value.map((step, index) => ({
    id: index,
    name: step.title,
    symbolSize: 60,
    value: step.shortDesc,
    category: index,
    itemStyle: {
      color: '#1890ff'
    }
  }))

  const links = learningPath.value.slice(0, -1).map((_, index) => ({
    source: index,
    target: index + 1,
    lineStyle: {
      color: '#1890ff',
      width: 2
    }
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.dataType === 'node') {
          return `
            <div style="font-weight: bold; margin-bottom: 4px;">
              ${params.data.name}
            </div>
            <div>
              ${params.data.value}
            </div>
          `
        }
        return ''
      }
    },
    series: [{
      type: 'graph',
      layout: 'circular',
      symbolSize: 50,
      roam: true,
      label: {
        show: true,
        position: 'inside',
        color: '#fff',
        fontSize: 12
      },
      edgeSymbol: ['circle', 'arrow'],
      edgeSymbolSize: [4, 10],
      edgeLabel: {
        fontSize: 12
      },
      data: nodes,
      links: links,
      lineStyle: {
        opacity: 0.9,
        width: 2,
        curveness: 0
      }
    }]
  }

  chart.setOption(option)
}

// 处理窗口大小变化
const handleResize = () => {
  chart && chart.resize()
}

onMounted(() => {
  fetchLearningPaths()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chart) {
    chart.dispose()
    chart = null
  }
  window.removeEventListener('resize', handleResize)
})

// 跳转到题目详情
const goToQuestion = (id) => {
  router.push(`/home/question-bank/question/${id}`)
}
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.content-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 24px;
}

.path-overview {
  padding: 24px;
}

.custom-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.45);
}

.custom-icon.active {
  background: #1890ff;
  color: #fff;
}

.step-content {
  padding: 0 16px;
}

.step-description {
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 16px;
  line-height: 1.6;
}

.step-topics {
  margin-bottom: 16px;
}

.step-topics h4,
.step-questions h4 {
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.85);
}

.topic-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.question-link {
  color: rgba(0, 0, 0, 0.85);
  transition: color 0.3s;
}

.question-link:hover {
  color: #1890ff;
}

:deep(.ant-collapse) {
  background: transparent;
}

:deep(.ant-collapse-header) {
  font-weight: 500;
}

:deep(.ant-steps-item-description) {
  margin-top: 4px;
}

:deep(.ant-list-item) {
  padding: 8px 0;
}

.chart-container {
  width: 100%;
  height: 400px;
}
</style> 