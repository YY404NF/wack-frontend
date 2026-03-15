<script setup lang="ts">
import type { AttendanceCheckDetail, AvailableCourseItem, FreeTimeItem, SessionUser } from '../api'
import { sectionLabels, weekdayLabels, type AppTab, type StatusCode } from '../constants'

defineProps<{
  me: SessionUser
  activeTab: AppTab
  pageError: string
  toast: string
  availableCourses: AvailableCourseItem[]
  activeCheck: AttendanceCheckDetail | null
  selectedStudent: AttendanceCheckDetail['students'][number] | null
  selectedStudentId: number | null
  freeTimes: FreeTimeItem[]
  freeTimeForm: { term: string; weekday: number; section: number; freeWeeks: string }
  editingFreeTimeId: number | null
  passwordForm: { oldPassword: string; newPassword: string }
  roleName: (role?: number) => string
  statusName: (status: number) => string
  statusClass: (status: number) => Record<string, boolean>
  slotLabel: (weekday: number, section: number) => string
}>()

const emit = defineEmits<{
  'update:activeTab': [value: AppTab]
  'update:selectedStudentId': [value: number]
  logout: []
  openCourse: [course: AvailableCourseItem]
  updateStudentStatus: [detailId: number, status: StatusCode]
  completeAttendance: []
  saveFreeTime: []
  editFreeTime: [item: FreeTimeItem]
  removeFreeTime: [id: number]
  resetFreeTimeForm: []
  changePassword: []
}>()
</script>

<template>
  <header class="topbar">
    <div>
      <p class="eyebrow">WACK / {{ roleName(me.role) }}</p>
      <h1>{{ me.real_name }}，欢迎回来</h1>
    </div>
    <div class="topbar-actions">
      <button class="ghost-button" :class="{ selected: activeTab === 'student' }" @click="emit('update:activeTab', 'student')">
        查课流程
      </button>
      <button class="ghost-button" :class="{ selected: activeTab === 'availability' }" @click="emit('update:activeTab', 'availability')">
        空闲时间
      </button>
      <button class="ghost-button" :class="{ selected: activeTab === 'settings' }" @click="emit('update:activeTab', 'settings')">
        设置
      </button>
      <button class="ghost-button" @click="emit('logout')">退出</button>
    </div>
  </header>

  <p v-if="pageError" class="error-banner">{{ pageError }}</p>
  <p v-if="toast" class="toast-banner">{{ toast }}</p>

  <main class="layout">
    <template v-if="activeTab === 'student'">
      <section class="dual-grid student-layout">
        <article class="workspace-card">
          <div class="section-heading">
            <div>
              <p class="section-kicker">查课学生端 · 今日课程</p>
              <h2>可查课程</h2>
            </div>
            <span class="pill">{{ availableCourses.length }} 门</span>
          </div>

          <div class="course-stack">
            <button
              v-for="course in availableCourses"
              :key="course.course_session_id"
              class="course-button"
              :class="{ disabled: !course.can_enter }"
              @click="emit('openCourse', course)"
            >
              <div>
                <strong>{{ course.course_name }}</strong>
                <p>{{ course.teacher_name }} · {{ slotLabel(course.weekday, course.section) }}</p>
                <small>{{ course.building_name }}-{{ course.room_name }}</small>
              </div>
              <span>{{ course.can_enter ? '进入' : '已关闭' }}</span>
            </button>
          </div>
        </article>

        <article class="workspace-card">
          <div class="section-heading">
            <div>
              <p class="section-kicker">查课学生端 · 进行中</p>
              <h2>{{ activeCheck?.course.course_name ?? '请选择课程' }}</h2>
            </div>
            <button v-if="activeCheck" class="primary-button" type="button" @click="emit('completeAttendance')">
              完成查课
            </button>
          </div>

          <template v-if="activeCheck">
            <p class="detail-line">
              {{ slotLabel(activeCheck.course_session.weekday, activeCheck.course_session.section) }} ·
              {{ activeCheck.course_session.building_name }}-{{ activeCheck.course_session.room_name }}
            </p>

            <div class="student-list">
              <button
                v-for="student in activeCheck.students"
                :key="student.id"
                class="student-button"
                :class="{ selected: selectedStudentId === student.id }"
                @click="emit('update:selectedStudentId', student.id)"
              >
                <div>
                  <strong>{{ student.student_id }}</strong>
                  <p>{{ statusName(student.status) }}</p>
                </div>
                <span class="status-badge" :class="statusClass(student.status)">{{ statusName(student.status) }}</span>
              </button>
            </div>

            <div v-if="selectedStudent" class="quick-panel">
              <div>
                <p class="section-kicker">当前学生</p>
                <h3>{{ selectedStudent.student_id }}</h3>
              </div>
              <div class="quick-actions">
                <button class="quick-button good" @click="emit('updateStudentStatus', selectedStudent.id, 1)">签到</button>
                <button class="quick-button warn" @click="emit('updateStudentStatus', selectedStudent.id, 2)">迟到</button>
                <button class="quick-button bad" @click="emit('updateStudentStatus', selectedStudent.id, 3)">缺勤</button>
                <button class="quick-button calm" @click="emit('updateStudentStatus', selectedStudent.id, 4)">请假</button>
              </div>
            </div>
          </template>

          <p v-else class="empty-hint">还没有打开任何课程。先从左侧“可查课程”进入。</p>
        </article>
      </section>
    </template>

    <section v-if="activeTab === 'availability'" class="dual-grid student-layout">
      <article class="workspace-card">
        <div class="section-heading">
          <div>
            <p class="section-kicker">查课学生端 · 空闲时间</p>
            <h2>{{ editingFreeTimeId ? '编辑空闲时段' : '新增空闲时段' }}</h2>
          </div>
          <button v-if="editingFreeTimeId" class="ghost-button" type="button" @click="emit('resetFreeTimeForm')">取消编辑</button>
        </div>
        <form class="form-grid compact" @submit.prevent="emit('saveFreeTime')">
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
          <button class="primary-button" type="submit">{{ editingFreeTimeId ? '保存修改' : '新增空闲时间' }}</button>
        </form>
      </article>

      <article class="workspace-card">
        <div class="section-heading">
          <div>
            <p class="section-kicker">查课学生端 · 空闲时间</p>
            <h2>已登记空闲列表</h2>
          </div>
          <span class="pill">{{ freeTimes.length }} 条</span>
        </div>

        <div class="list-grid">
          <article v-for="item in freeTimes" :key="item.id" class="record-card free-time-card">
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
      </article>
    </section>

    <section v-if="activeTab === 'settings'" class="workspace-card settings-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">通用设置</p>
          <h2>修改密码</h2>
        </div>
      </div>
      <form class="form-grid compact" @submit.prevent="emit('changePassword')">
        <label class="field">
          <span>旧密码</span>
          <input v-model="passwordForm.oldPassword" type="password" />
        </label>
        <label class="field">
          <span>新密码</span>
          <input v-model="passwordForm.newPassword" type="password" />
        </label>
        <button class="primary-button" type="submit">提交修改</button>
      </form>
    </section>
  </main>
</template>
