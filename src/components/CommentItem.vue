<!-- eslint-disable -->
<template>
  <div class="comment-wrapper">
    <AComment class="comment-item">
      <template #avatar>
        <AAvatar :size="level === 0 ? 'default' : 'small'">
          {{ comment.userName?.charAt(0) || 'U' }}
        </AAvatar>
      </template>
      <template #author>
        <span class="comment-author">{{ comment.userName }}</span>
      </template>
      <template #content>
        <div class="comment-content">{{ comment.content }}</div>
      </template>
      <template #datetime>
        <span class="comment-time">{{ formatDateTime(comment.createTime) }}</span>
      </template>
      <template #actions>
        <span class="comment-actions-wrapper">
          <span class="comment-action" @click="handleReply(comment)">回复</span>
          <span 
            v-if="comment.replyCount > 0" 
            class="comment-action"
            @click="handleViewReplies(comment)"
          >
            {{ comment.subComment ? '收起回复' : '查看回复' }}
            <span class="reply-count-badge">({{ comment.replyCount }})</span>
          </span>
          <span 
            v-if="isCommentAuthor" 
            class="comment-action delete-action"
            @click="handleDelete(comment)"
          >
            删除
          </span>
        </span>
      </template>
    </AComment>

    <!-- 嵌套的回复列表 -->
    <div v-if="comment.subComment?.length" :class="getNestedClass">
      <AList
        :data-source="comment.subComment"
        size="small"
      >
        <template #renderItem="{ item: reply }">
          <AListItem>
            <RecursiveComment
              :comment="reply"
              :level="level + 1"
              @reply="handleChildReply"
              @view-replies="handleChildViewReplies"
              @delete="handleChildDelete"
            />
          </AListItem>
        </template>
      </AList>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits, defineAsyncComponent } from 'vue'
import dayjs from 'dayjs'
import { 
  Comment as AComment, 
  Avatar as AAvatar, 
  List as AList,
  Modal
} from 'ant-design-vue'
import 'ant-design-vue/es/comment/style'
import 'ant-design-vue/es/avatar/style'
import 'ant-design-vue/es/list/style'
import 'ant-design-vue/es/modal/style'

const AListItem = AList.Item

// 使用不同的名字来避免命名冲突
const RecursiveComment = defineAsyncComponent(() => import('./CommentItem.vue'))

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  }
})

const emits = defineEmits(['reply', 'view-replies', 'delete'])

// 判断当前用户是否是评论作者
const isCommentAuthor = computed(() => {
  const userInfo = localStorage.getItem('userInfo')
  if (!userInfo) return false
  const userId = JSON.parse(userInfo).id
  return userId === props.comment.userId
})

// 处理子评论的回复
const handleChildReply = (comment) => {
  emits('reply', comment)
}

// 处理子评论的查看回复
const handleChildViewReplies = (comment) => {
  emits('view-replies', comment)
}

const handleReply = (comment) => {
  emits('reply', comment)
}

const handleViewReplies = (comment) => {
  emits('view-replies', comment)
}

const handleDelete = (comment) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条评论吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: () => {
      emits('delete', comment)
    }
  })
}

const formatDateTime = (date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const getNestedClass = computed(() => {
  if (props.level === 0) return 'sub-comments'
  if (props.level === 1) return 'nested-replies'
  return 'deep-nested-replies'
})

// 处理子评论的删除
const handleChildDelete = (comment) => {
  emits('delete', comment)
}
</script>

<style scoped>
/* 添加更多具体的样式 */
.comment-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.comment-item {
  width: 100%;
}

.comment-author {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.comment-content {
  margin: 8px 0;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.5;
}

.comment-time {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}

.comment-actions-wrapper {
  display: flex;
  gap: 16px;
  align-items: center;
}

.comment-action {
  color: #1890ff;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.3s;
}

.comment-action:hover {
  color: #40a9ff;
}

.reply-count-badge {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-left: 4px;
}

.sub-comments {
  margin-top: 12px;
  margin-left: 32px;
  padding: 12px 16px;
  background-color: #fafafa;
  border-radius: 4px;
  border-left: 2px solid #f0f0f0;
}

.nested-replies {
  margin-top: 8px;
  margin-left: 24px;
  padding: 8px 12px;
  background-color: #f7f7f7;
  border-radius: 4px;
  border-left: 2px solid #e8e8e8;
}

:deep(.ant-list-item) {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.ant-list-item:last-child) {
  border-bottom: none;
}

:deep(.ant-avatar) {
  background-color: #1890ff;
  color: #fff;
}

/* 添加深层嵌套的样式 */
.deep-nested-replies {
  margin-top: 8px;
  margin-left: 20px;
  padding: 8px 12px;
  background-color: #ffffff;
  border-radius: 4px;
  border-left: 2px solid #e8e8e8;
}

/* 根据层级调整头像大小 */
:deep(.ant-avatar) {
  background-color: #1890ff;
  color: #fff;
}

.deep-nested-replies :deep(.ant-avatar) {
  width: 24px;
  height: 24px;
  line-height: 24px;
  font-size: 12px;
}

/* 调整深层嵌套的间距和边框 */
.deep-nested-replies :deep(.ant-list-item) {
  padding: 4px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.deep-nested-replies :deep(.ant-comment-content) {
  padding-left: 4px;
}

/* 优化深层嵌套的字体大小 */
.deep-nested-replies .comment-content {
  font-size: 13px;
}

.deep-nested-replies .comment-time {
  font-size: 11px;
}

.delete-action {
  color: #ff4d4f !important;
}

.delete-action:hover {
  color: #ff7875 !important;
}

.like-action {
  display: flex;
  align-items: center;
  gap: 4px;
}

.like-action.active {
  color: #1890ff;
}

.like-action :deep(.anticon) {
  font-size: 14px;
}
</style> 