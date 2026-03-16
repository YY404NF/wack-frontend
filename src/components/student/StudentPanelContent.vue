<script setup lang="ts">
import { sectionLabels, weekdayLabels, type AppTab, type StatusCode } from '../../constants'
import type { StudentGreeting, StudentWorkspaceProps } from './types'

defineProps<StudentWorkspaceProps & {
  greeting: StudentGreeting
  scheduleLabel: string
  sectionTimeText: (section: number) => string
}>()

const emit = defineEmits<{
  'update:activeTab': [value: AppTab]
  'update:selectedStudentId': [value: number]
  logout: []
  openCourse: [course: StudentWorkspaceProps['availableCourses'][number]]
  updateStudentStatus: [detailId: number, status: StatusCode]
  completeAttendance: []
  saveFreeTime: []
  editFreeTime: [item: StudentWorkspaceProps['freeTimes'][number]]
  removeFreeTime: [id: number]
  resetFreeTimeForm: []
  changePassword: []
}>()
</script>

<template>
  <section v-if="activeTab === 'home'" class="student-mobile-page student-home-page">
    <article class="student-hero-card">
      <p class="student-hero-brand eyebrow">WACK / 网安查课</p>
      <div class="student-hero-body">
        <div class="student-hero-icon" aria-hidden="true">{{ greeting.emoji }}</div>
        <h2>{{ greeting.label }}，</h2>
        <h2>{{ me.real_name }}同学～</h2>
      </div>
    </article>

    <article class="student-summary-card">
      <div class="section-heading student-mobile-section-heading">
        <h2>今日概览</h2>
      </div>
      <article class="student-stat-card student-stat-card-strong">
        <span>当前作息</span>
        <strong>{{ scheduleLabel }}</strong>
      </article>
      <button class="primary-button student-entry-button student-home-action" type="button" @click="emit('update:activeTab', 'student')">
        进入今日查课
      </button>
    </article>
  </section>

  <section v-if="activeTab === 'student'" class="student-mobile-page student-check-page">
    <div class="student-page-meta">
      <p class="student-brand eyebrow">WACK / 网安查课</p>
      <h2>今日查课</h2>
    </div>

    <div class="section-heading student-mobile-section-heading">
      <button
        v-if="activeCheck"
        class="primary-button student-complete-button"
        type="button"
        :disabled="completingAttendance"
        @click="emit('completeAttendance')"
      >
        <span v-if="completingAttendance" class="button-spinner" aria-hidden="true"></span>
        <span>{{ completingAttendance ? '提交中...' : '完成查课' }}</span>
      </button>
    </div>

    <div v-if="availableCourses.length > 0" class="student-course-list">
      <article v-for="course in availableCourses" :key="course.course_session_id" class="student-course-card">
        <div class="student-course-info">
          <strong>{{ course.course_name }}</strong>
          <p>{{ course.teacher_name }}</p>
          <p>{{ slotLabel(course.weekday, course.section) }}</p>
          <small>{{ course.building_name }}-{{ course.room_name }} · {{ sectionTimeText(course.section) }}</small>
        </div>
        <button class="primary-button student-course-action" type="button" @click="emit('openCourse', course)">查课</button>
      </article>
    </div>
    <p v-else class="empty-hint student-empty-hint">当前没有处于可查时间窗口内的课程。</p>

    <article v-if="activeCheck" class="student-section-card student-active-check-card">
      <h3>{{ activeCheck.course.course_name }}</h3>
      <p class="detail-line student-check-meta">
        {{ slotLabel(activeCheck.course_session.weekday, activeCheck.course_session.section) }} ·
        {{ activeCheck.course_session.building_name }}-{{ activeCheck.course_session.room_name }}
      </p>

      <div class="student-list student-check-student-list">
        <button
          v-for="student in activeCheck.students"
          :key="student.id"
          class="student-button student-check-student"
          :class="{ selected: selectedStudentId === student.id }"
          @click="emit('update:selectedStudentId', student.id)"
        >
          <div>
            <strong>{{ student.real_name }}</strong>
            <p>{{ student.student_id }}</p>
          </div>
          <span class="status-badge" :class="statusClass(student.status)">{{ statusName(student.status) }}</span>
        </button>
      </div>

      <div v-if="selectedStudent" class="quick-panel student-quick-panel">
        <div>
          <h3>{{ selectedStudent.real_name }}</h3>
          <p class="detail-line">{{ selectedStudent.student_id }}</p>
        </div>
        <div class="quick-actions student-quick-actions">
          <button class="quick-button good" type="button" @click="emit('updateStudentStatus', selectedStudent.id, 1)">签到</button>
          <button class="quick-button warn" type="button" @click="emit('updateStudentStatus', selectedStudent.id, 2)">迟到</button>
          <button class="quick-button bad" type="button" @click="emit('updateStudentStatus', selectedStudent.id, 3)">缺勤</button>
          <button class="quick-button calm" type="button" @click="emit('updateStudentStatus', selectedStudent.id, 4)">请假</button>
        </div>
      </div>
    </article>
  </section>

  <section v-if="activeTab === 'settings'" class="student-mobile-page student-settings-page">
    <div class="student-page-meta">
      <p class="student-brand eyebrow">WACK / 网安查课</p>
      <h2>设置</h2>
    </div>

    <article class="student-section-card">
      <div class="section-heading student-mobile-section-heading">
        <h3>账号信息</h3>
      </div>
      <div class="student-settings-summary">
        <div class="account-line">
          <span>账号 / 学号</span>
          <strong>{{ me.student_id }}</strong>
        </div>
        <div class="account-line">
          <span>姓名</span>
          <strong>{{ me.real_name }}</strong>
        </div>
      </div>
    </article>

    <article class="student-section-card">
      <div class="section-heading student-mobile-section-heading">
        <h3>修改密码</h3>
      </div>
      <form class="form-grid compact student-settings-form" @submit.prevent="emit('changePassword')">
        <label class="field">
          <span>旧密码</span>
          <input v-model="passwordForm.oldPassword" type="password" />
        </label>
        <label class="field">
          <span>新密码</span>
          <input v-model="passwordForm.newPassword" type="password" />
        </label>
        <label class="field">
          <span>确认新密码</span>
          <input v-model="passwordForm.confirmNewPassword" type="password" />
        </label>
        <button class="primary-button" type="submit" :disabled="changingPassword">
          <span v-if="changingPassword" class="button-spinner" aria-hidden="true"></span>
          <span>{{ changingPassword ? '提交中...' : '保存密码' }}</span>
        </button>
      </form>
    </article>

    <article class="student-section-card">
      <div class="section-heading student-mobile-section-heading">
        <h3>{{ editingFreeTimeId ? '编辑空闲时间' : '新增空闲时间' }}</h3>
        <button v-if="editingFreeTimeId" class="ghost-button" type="button" @click="emit('resetFreeTimeForm')">取消编辑</button>
      </div>
      <form class="form-grid compact student-settings-form" @submit.prevent="emit('saveFreeTime')">
        <label class="field">
          <span>学期</span>
          <input v-model="freeTimeForm.term" />
        </label>
        <label class="field">
          <span>星期</span>
          <select v-model.number="freeTimeForm.weekday">
            <option v-for="day in Object.entries(weekdayLabels)" :key="day[0]" :value="Number(day[0])">{{ day[1] }}</option>
          </select>
        </label>
        <label class="field">
          <span>时间片</span>
          <select v-model.number="freeTimeForm.section">
            <option v-for="slot in Object.entries(sectionLabels)" :key="slot[0]" :value="Number(slot[0])">{{ slot[1] }}</option>
          </select>
        </label>
        <label class="field wide">
          <span>空闲周次</span>
          <input v-model="freeTimeForm.freeWeeks" placeholder="例如 1-4,6,8-10" />
        </label>
        <button class="primary-button" type="submit" :disabled="savingFreeTime">
          <span v-if="savingFreeTime" class="button-spinner" aria-hidden="true"></span>
          <span>{{ savingFreeTime ? '保存中...' : editingFreeTimeId ? '保存修改' : '新增空闲时间' }}</span>
        </button>
      </form>
    </article>

    <article class="student-section-card">
      <div class="section-heading student-mobile-section-heading">
        <h3>已登记空闲列表</h3>
        <span class="pill">{{ freeTimes.length }} 条</span>
      </div>

      <div v-if="freeTimes.length > 0" class="list-grid">
        <article v-for="item in freeTimes" :key="item.id" class="record-card student-free-time-card">
          <div>
            <strong>{{ item.term }}</strong>
            <p>{{ slotLabel(item.weekday, item.section) }}</p>
            <small>空闲周 {{ item.free_weeks }}</small>
          </div>
          <div class="inline-actions">
            <button class="ghost-button compact-button" type="button" @click="emit('editFreeTime', item)">编辑</button>
            <button class="ghost-button compact-button danger-button" type="button" @click="emit('removeFreeTime', item.id)">删除</button>
          </div>
        </article>
      </div>
      <p v-else class="empty-hint student-empty-hint">还没有登记空闲时间。</p>
    </article>

    <button class="ghost-button danger-button student-logout-button" type="button" @click="emit('logout')">退出登录</button>
  </section>
</template>
