<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import {
  api,
  clearToken,
  getToken,
  setToken,
  type AttendanceCheckDetail,
  type AttendanceResultItem,
  type AvailableCourseItem,
  type CourseCalendarItem,
  type CourseItem,
  type DashboardSummary,
  type FreeTimeItem,
  type SessionUser,
  type UserItem,
} from './api'

type StatusCode = 0 | 1 | 2 | 3 | 4

const roleLabels: Record<number, string> = {
  1: '管理员',
  2: '查课学生',
}

const statusLabels: Record<StatusCode, string> = {
  0: '未设置',
  1: '签到',
  2: '迟到',
  3: '缺勤',
  4: '请假',
}

const weekdayLabels: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
}

const sectionLabels: Record<number, string> = {
  1: '上午 1-2 节',
  2: '上午 3-4 节',
  3: '下午 5-6 节',
  4: '下午 7-8 节',
  5: '晚上 9-10 节',
}

const adminNavItems = [
  { key: 'overview', label: '总览', desc: '课程表、统计和空闲视图' },
  { key: 'manage', label: '用户与课程', desc: '创建用户与录入排课' },
  { key: 'attendance', label: '查课结果', desc: '修正考勤明细状态' },
  { key: 'settings', label: '设置', desc: '修改密码与账号设置' },
] as const

const loginForm = reactive({
  studentId: 'admin',
  password: 'admin123',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
})

const userForm = reactive({
  studentId: '',
  realName: '',
  password: '123456',
  role: 2,
  status: 1,
})

const courseForm = reactive({
  courseId: '',
  term: '2025-2026-2',
  courseName: '',
  teacherName: '',
  studentIds: '',
  sessionNo: 1,
  weekNo: 1,
  weekday: 1,
  section: 1,
  buildingName: '教4',
  roomName: '509',
})

const me = ref<SessionUser | null>(null)
const authLoading = ref(false)
const booting = ref(true)
const pageError = ref('')
const toast = ref('')

const users = ref<UserItem[]>([])
const courses = ref<CourseItem[]>([])
const courseCalendar = ref<CourseCalendarItem[]>([])
const dashboard = ref<DashboardSummary | null>(null)
const attendanceResults = ref<AttendanceResultItem[]>([])
const freeTimes = ref<FreeTimeItem[]>([])

const availableCourses = ref<AvailableCourseItem[]>([])
const activeCheck = ref<AttendanceCheckDetail | null>(null)
const selectedStudentId = ref<number | null>(null)
const activeTab = ref<'overview' | 'manage' | 'attendance' | 'student' | 'settings'>('overview')

const adminStats = computed(() => {
  if (!dashboard.value) {
    return []
  }
  return [
    { label: '签到', value: dashboard.value.present, tone: 'good' },
    { label: '迟到', value: dashboard.value.late, tone: 'warn' },
    { label: '缺勤', value: dashboard.value.absent, tone: 'bad' },
    { label: '请假', value: dashboard.value.leave, tone: 'calm' },
    { label: '未设置', value: dashboard.value.unset, tone: 'muted' },
  ]
})

const selectedStudent = computed(() => {
  if (!activeCheck.value || selectedStudentId.value === null) {
    return null
  }
  return activeCheck.value.students.find((student) => student.id === selectedStudentId.value) ?? null
})

const isAdmin = computed(() => me.value?.role === 1)
const isStudent = computed(() => me.value?.role === 2)
const adminActiveNav = computed(() => adminNavItems.find((item) => item.key === activeTab.value))

function showToast(message: string) {
  toast.value = message
  window.setTimeout(() => {
    if (toast.value === message) {
      toast.value = ''
    }
  }, 2200)
}

function roleName(role?: number) {
  return role ? roleLabels[role] ?? `角色 ${role}` : '-'
}

function statusName(status: number) {
  return statusLabels[status as StatusCode] ?? `状态 ${status}`
}

function slotLabel(weekday: number, section: number) {
  return `${weekdayLabels[weekday] ?? `周${weekday}`} · ${sectionLabels[section] ?? `第 ${section} 段`}`
}

function statusClass(status: number) {
  return {
    'tag-good': status === 1,
    'tag-warn': status === 2,
    'tag-bad': status === 3,
    'tag-calm': status === 4,
    'tag-muted': status === 0,
  }
}

async function login() {
  authLoading.value = true
  pageError.value = ''
  try {
    const data = await api.login(loginForm.studentId.trim(), loginForm.password)
    setToken(data.token)
    me.value = data.user
    await loadRoleData()
    activeTab.value = data.user.role === 1 ? 'overview' : 'student'
    showToast('登录成功')
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : '登录失败'
  } finally {
    authLoading.value = false
  }
}

async function restoreSession() {
  if (!getToken()) {
    booting.value = false
    return
  }
  try {
    me.value = await api.me()
    await loadRoleData()
    activeTab.value = me.value.role === 1 ? 'overview' : 'student'
  } catch {
    clearToken()
    me.value = null
  } finally {
    booting.value = false
  }
}

async function loadRoleData() {
  if (!me.value) {
    return
  }

  pageError.value = ''
  if (me.value.role === 1) {
    const [userPage, coursePage, calendar, summary, resultPage, freeTimeList] = await Promise.all([
      api.listUsers(),
      api.listCourses(),
      api.adminCourseCalendar(),
      api.adminAttendanceDashboard(),
      api.adminAttendanceResults(),
      api.adminFreeTimeCalendar(),
    ])
    users.value = userPage.items ?? []
    courses.value = coursePage.items ?? []
    courseCalendar.value = calendar ?? []
    dashboard.value = summary
    attendanceResults.value = resultPage.items ?? []
    freeTimes.value = freeTimeList ?? []
  } else {
    availableCourses.value = (await api.studentAvailableCourses()) ?? []
    if (availableCourses.value.length > 0 && availableCourses.value[0].attendance_check_id) {
      await openCourse(availableCourses.value[0])
    }
  }
}

function logout() {
  clearToken()
  me.value = null
  users.value = []
  courses.value = []
  courseCalendar.value = []
  dashboard.value = null
  attendanceResults.value = []
  freeTimes.value = []
  availableCourses.value = []
  activeCheck.value = null
  selectedStudentId.value = null
}

async function createUser() {
  pageError.value = ''
  try {
    await api.createUser({
      student_id: userForm.studentId.trim(),
      real_name: userForm.realName.trim(),
      password: userForm.password,
      role: userForm.role,
      status: userForm.status,
    })
    userForm.studentId = ''
    userForm.realName = ''
    await loadRoleData()
    showToast('用户已创建')
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : '创建用户失败'
  }
}

async function createCourse() {
  pageError.value = ''
  try {
    const courseId = Number(courseForm.courseId)
    const studentIds = courseForm.studentIds
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    await api.createCourse({
      id: courseId,
      term: courseForm.term.trim(),
      course_name: courseForm.courseName.trim(),
      teacher_name: courseForm.teacherName.trim(),
      attendance_student_count: 0,
    })
    await api.replaceCourseStudents(courseId, studentIds)
    await api.replaceCourseSessions(courseId, [
      {
        session_no: courseForm.sessionNo,
        week_no: courseForm.weekNo,
        weekday: courseForm.weekday,
        section: courseForm.section,
        building_name: courseForm.buildingName.trim(),
        room_name: courseForm.roomName.trim(),
      },
    ])
    courseForm.courseId = ''
    courseForm.courseName = ''
    courseForm.teacherName = ''
    courseForm.studentIds = ''
    await loadRoleData()
    showToast('课程已创建')
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : '创建课程失败'
  }
}

async function openCourse(course: AvailableCourseItem) {
  pageError.value = ''
  try {
    activeCheck.value = await api.enterAttendanceCheck(course.course_session_id)
    selectedStudentId.value = activeCheck.value.students[0]?.id ?? null
    availableCourses.value = (await api.studentAvailableCourses()) ?? []
    showToast(`已进入 ${course.course_name}`)
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : '进入查课失败'
  }
}

async function updateStudentStatus(detailId: number, status: StatusCode) {
  pageError.value = ''
  try {
    await api.updateAttendanceStatus(detailId, status)
    if (activeCheck.value) {
      const target = activeCheck.value.students.find((student) => student.id === detailId)
      if (target) {
        target.status = status
      }
    }
    const currentIndex = activeCheck.value?.students.findIndex((student) => student.id === detailId) ?? -1
    const nextStudent = currentIndex >= 0 ? activeCheck.value?.students[currentIndex + 1] : null
    selectedStudentId.value = nextStudent?.id ?? detailId
    showToast(`状态已更新为${statusName(status)}`)
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : '更新状态失败'
  }
}

async function updateAdminStatus(detailId: number, status: StatusCode) {
  pageError.value = ''
  try {
    await api.adminUpdateAttendanceStatus(detailId, status)
    await loadRoleData()
    showToast('管理员修改已提交')
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : '修改查课结果失败'
  }
}

async function completeAttendance() {
  if (!activeCheck.value) {
    return
  }
  pageError.value = ''
  try {
    await api.completeAttendanceCheck(activeCheck.value.attendance_check.id)
    await loadRoleData()
    activeCheck.value = null
    selectedStudentId.value = null
    showToast('本次查课已结束')
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : '完成查课失败'
  }
}

async function changePassword() {
  pageError.value = ''
  try {
    await api.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    showToast('密码已修改')
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : '修改密码失败'
  }
}

onMounted(() => {
  void restoreSession()
})
</script>

<template>
  <div class="page-shell">
    <div v-if="booting" class="splash-card">
      <p class="eyebrow">WACK</p>
      <h1>正在恢复登录状态</h1>
    </div>

    <template v-else-if="!me">
      <section class="login-layout">
        <article class="login-panel">
          <p class="eyebrow">WACK / 登录</p>
          <h1>查课系统工作台</h1>
          <p class="hero-text">管理员和查课学生共用同一登录入口，前端会按角色切换工作区。</p>

          <form class="form-grid" @submit.prevent="login">
            <label class="field">
              <span>学号 / 账号</span>
              <input v-model="loginForm.studentId" autocomplete="username" />
            </label>
            <label class="field">
              <span>密码</span>
              <input v-model="loginForm.password" type="password" autocomplete="current-password" />
            </label>
            <button class="primary-button" type="submit" :disabled="authLoading">
              {{ authLoading ? '登录中...' : '登录系统' }}
            </button>
          </form>

          <p class="hint">默认管理员账号：`admin` / `admin123`</p>
          <p v-if="pageError" class="error-text">{{ pageError }}</p>
        </article>

        <article class="feature-panel">
          <div class="feature-card">
            <strong>管理员端</strong>
            <p>查看课程表、录入课程、创建查课学生、修正查课结果。</p>
          </div>
          <div class="feature-card">
            <strong>查课学生端</strong>
            <p>查看当天可查课程，进入查课流程，逐人修改状态并结束本次查课。</p>
          </div>
        </article>
      </section>
    </template>

    <template v-else>
      <template v-if="isAdmin">
        <div class="admin-shell">
          <aside class="admin-sidebar">
            <div class="sidebar-brand">
              <p class="eyebrow">WACK / 管理员端</p>
              <h2>{{ me.real_name }}</h2>
              <p class="sidebar-text">PC 工作台采用左侧导航，右侧集中处理课程、查课结果和账号管理。</p>
            </div>

            <nav class="sidebar-nav">
              <button
                v-for="item in adminNavItems"
                :key="item.key"
                class="sidebar-link"
                :class="{ active: activeTab === item.key }"
                @click="activeTab = item.key"
              >
                <strong>{{ item.label }}</strong>
                <span>{{ item.desc }}</span>
              </button>
            </nav>

            <div class="sidebar-footer">
              <div class="sidebar-meta">
                <span>当前角色</span>
                <strong>{{ roleName(me.role) }}</strong>
              </div>
              <button class="ghost-button sidebar-logout" @click="logout">退出登录</button>
            </div>
          </aside>

          <div class="admin-content">
            <header class="topbar topbar-admin">
              <div>
                <p class="eyebrow">WACK / {{ adminActiveNav?.label ?? '工作台' }}</p>
                <h1>{{ adminActiveNav?.label ?? '管理员工作台' }}</h1>
                <p class="hero-text">{{ adminActiveNav?.desc }}</p>
              </div>
            </header>

            <p v-if="pageError" class="error-banner">{{ pageError }}</p>
            <p v-if="toast" class="toast-banner">{{ toast }}</p>

            <main class="layout">
              <template v-if="activeTab === 'overview'">
                <section class="workspace-card stats-grid">
                  <article v-for="item in adminStats" :key="item.label" class="stat-card" :class="`tone-${item.tone}`">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                  </article>
                </section>

                <section class="workspace-card">
                  <div class="section-heading">
                    <div>
                      <p class="section-kicker">管理员端 · 全院课程表</p>
                      <h2>课程日历</h2>
                    </div>
                    <span class="pill">{{ courseCalendar.length }} 条排课</span>
                  </div>
                  <div class="list-grid dense-grid">
                    <article v-for="item in courseCalendar" :key="item.id" class="record-card">
                      <strong>{{ item.course_name }}</strong>
                      <p>{{ item.teacher_name }}</p>
                      <small>{{ slotLabel(item.weekday, item.section) }} · {{ item.building_name }}-{{ item.room_name }}</small>
                    </article>
                  </div>
                </section>

                <section class="workspace-card">
                  <div class="section-heading">
                    <div>
                      <p class="section-kicker">管理员端 · 空余时间</p>
                      <h2>查课学生空闲视图</h2>
                    </div>
                    <span class="pill">{{ freeTimes.length }} 条空闲记录</span>
                  </div>
                  <div class="list-grid dense-grid">
                    <article v-for="item in freeTimes" :key="item.id" class="record-card">
                      <strong>{{ item.student_id }}</strong>
                      <p>{{ slotLabel(item.weekday, item.section) }}</p>
                      <small>{{ item.term }} · 空闲周 {{ item.free_weeks }}</small>
                    </article>
                  </div>
                </section>
              </template>

              <template v-if="activeTab === 'manage'">
                <section class="dual-grid admin-manage-grid">
                  <article class="workspace-card">
                    <div class="section-heading">
                      <div>
                        <p class="section-kicker">管理员端 · 用户管理</p>
                        <h2>创建查课学生</h2>
                      </div>
                    </div>
                    <form class="form-grid compact" @submit.prevent="createUser">
                      <label class="field">
                        <span>学号</span>
                        <input v-model="userForm.studentId" />
                      </label>
                      <label class="field">
                        <span>姓名</span>
                        <input v-model="userForm.realName" />
                      </label>
                      <label class="field">
                        <span>初始密码</span>
                        <input v-model="userForm.password" type="password" />
                      </label>
                      <label class="field">
                        <span>角色</span>
                        <select v-model.number="userForm.role">
                          <option :value="2">查课学生</option>
                          <option :value="1">管理员</option>
                        </select>
                      </label>
                      <button class="primary-button" type="submit">创建用户</button>
                    </form>

                    <div class="table-wrap">
                      <table class="data-table">
                        <thead>
                          <tr>
                            <th>学号</th>
                            <th>姓名</th>
                            <th>角色</th>
                            <th>状态</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="user in users" :key="user.student_id">
                            <td>{{ user.student_id }}</td>
                            <td>{{ user.real_name }}</td>
                            <td>{{ roleName(user.role) }}</td>
                            <td>{{ user.status === 1 ? '正常' : '冻结' }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </article>

                  <article class="workspace-card">
                    <div class="section-heading">
                      <div>
                        <p class="section-kicker">管理员端 · 课程管理</p>
                        <h2>录入课程与单次排课</h2>
                      </div>
                    </div>
                    <form class="form-grid compact" @submit.prevent="createCourse">
                      <label class="field">
                        <span>课程 ID</span>
                        <input v-model="courseForm.courseId" inputmode="numeric" />
                      </label>
                      <label class="field">
                        <span>学期</span>
                        <input v-model="courseForm.term" />
                      </label>
                      <label class="field wide">
                        <span>课程名称</span>
                        <input v-model="courseForm.courseName" />
                      </label>
                      <label class="field">
                        <span>教师</span>
                        <input v-model="courseForm.teacherName" />
                      </label>
                      <label class="field wide">
                        <span>上课学生学号</span>
                        <input v-model="courseForm.studentIds" placeholder="用英文逗号分隔" />
                      </label>
                      <label class="field">
                        <span>第几次课</span>
                        <input v-model.number="courseForm.sessionNo" type="number" min="1" />
                      </label>
                      <label class="field">
                        <span>第几周</span>
                        <input v-model.number="courseForm.weekNo" type="number" min="1" />
                      </label>
                      <label class="field">
                        <span>星期</span>
                        <select v-model.number="courseForm.weekday">
                          <option v-for="day in Object.entries(weekdayLabels)" :key="day[0]" :value="Number(day[0])">
                            {{ day[1] }}
                          </option>
                        </select>
                      </label>
                      <label class="field">
                        <span>时间片</span>
                        <select v-model.number="courseForm.section">
                          <option v-for="slot in Object.entries(sectionLabels)" :key="slot[0]" :value="Number(slot[0])">
                            {{ slot[1] }}
                          </option>
                        </select>
                      </label>
                      <label class="field">
                        <span>教学楼</span>
                        <input v-model="courseForm.buildingName" />
                      </label>
                      <label class="field">
                        <span>教室</span>
                        <input v-model="courseForm.roomName" />
                      </label>
                      <button class="primary-button" type="submit">创建课程</button>
                    </form>

                    <div class="list-grid dense-grid">
                      <article v-for="course in courses" :key="course.id" class="record-card">
                        <strong>{{ course.course_name }}</strong>
                        <p>{{ course.teacher_name }}</p>
                        <small>{{ course.term }} · 应到 {{ course.attendance_student_count }}</small>
                      </article>
                    </div>
                  </article>
                </section>
              </template>

              <template v-if="activeTab === 'attendance'">
                <section class="workspace-card">
                  <div class="section-heading">
                    <div>
                      <p class="section-kicker">管理员端 · 查课结果</p>
                      <h2>明细修正</h2>
                    </div>
                    <span class="pill">{{ attendanceResults.length }} 条结果</span>
                  </div>
                  <div class="table-wrap">
                    <table class="data-table">
                      <thead>
                        <tr>
                          <th>课程</th>
                          <th>教师</th>
                          <th>学生</th>
                          <th>周次</th>
                          <th>状态</th>
                          <th>修改</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="row in attendanceResults" :key="row.attendance_detail_id">
                          <td>{{ row.course_name }}</td>
                          <td>{{ row.teacher_name }}</td>
                          <td>{{ row.student_id }}</td>
                          <td>第 {{ row.week_no }} 周 / 第 {{ row.session_no }} 次</td>
                          <td><span class="status-badge" :class="statusClass(row.status)">{{ statusName(row.status) }}</span></td>
                          <td>
                            <select
                              class="mini-select"
                              :value="row.status"
                              @change="updateAdminStatus(row.attendance_detail_id, Number(($event.target as HTMLSelectElement).value) as StatusCode)"
                            >
                              <option :value="0">未设置</option>
                              <option :value="1">签到</option>
                              <option :value="2">迟到</option>
                              <option :value="3">缺勤</option>
                              <option :value="4">请假</option>
                            </select>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </template>

              <section v-if="activeTab === 'settings'" class="workspace-card settings-card admin-settings-card">
                <div class="section-heading">
                  <div>
                    <p class="section-kicker">通用设置</p>
                    <h2>修改密码</h2>
                  </div>
                </div>
                <form class="form-grid compact" @submit.prevent="changePassword">
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
          </div>
        </div>
      </template>

      <template v-else>
        <header class="topbar">
          <div>
            <p class="eyebrow">WACK / {{ roleName(me.role) }}</p>
            <h1>{{ me.real_name }}，欢迎回来</h1>
          </div>
          <div class="topbar-actions">
            <button
              v-if="isStudent"
              class="ghost-button"
              :class="{ selected: activeTab === 'student' }"
              @click="activeTab = 'student'"
            >
              查课流程
            </button>
            <button
              class="ghost-button"
              :class="{ selected: activeTab === 'settings' }"
              @click="activeTab = 'settings'"
            >
              设置
            </button>
            <button class="ghost-button" @click="logout">退出</button>
          </div>
        </header>

        <p v-if="pageError" class="error-banner">{{ pageError }}</p>
        <p v-if="toast" class="toast-banner">{{ toast }}</p>

        <main class="layout">
          <template v-if="isStudent && activeTab === 'student'">
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
                    @click="openCourse(course)"
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
                  <button v-if="activeCheck" class="primary-button" type="button" @click="completeAttendance">
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
                      @click="selectedStudentId = student.id"
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
                      <button class="quick-button good" @click="updateStudentStatus(selectedStudent.id, 1)">签到</button>
                      <button class="quick-button warn" @click="updateStudentStatus(selectedStudent.id, 2)">迟到</button>
                      <button class="quick-button bad" @click="updateStudentStatus(selectedStudent.id, 3)">缺勤</button>
                      <button class="quick-button calm" @click="updateStudentStatus(selectedStudent.id, 4)">请假</button>
                    </div>
                  </div>
                </template>

                <p v-else class="empty-hint">还没有打开任何课程。先从左侧“可查课程”进入。</p>
              </article>
            </section>
          </template>

          <section v-if="activeTab === 'settings'" class="workspace-card settings-card">
          <div class="section-heading">
            <div>
              <p class="section-kicker">通用设置</p>
              <h2>修改密码</h2>
            </div>
          </div>
          <form class="form-grid compact" @submit.prevent="changePassword">
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
    </template>
  </div>
</template>
