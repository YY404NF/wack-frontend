<script setup lang="ts">
import type { AttendanceResultItem, CourseCalendarItem, CourseItem, FreeTimeItem, SessionUser, UserItem } from '../api'
import { adminNavItems, type AppTab, type StatusCode, weekdayLabels, sectionLabels } from '../constants'

defineProps<{
  me: SessionUser
  activeTab: AppTab
  pageError: string
  toast: string
  adminActiveNav?: { label: string; desc: string }
  adminStats: Array<{ label: string; value: number; tone: string }>
  courseCalendar: CourseCalendarItem[]
  freeTimes: FreeTimeItem[]
  users: UserItem[]
  courses: CourseItem[]
  attendanceResults: AttendanceResultItem[]
  userForm: { studentId: string; realName: string; password: string; role: number; status: number }
  courseForm: {
    courseId: string
    term: string
    courseName: string
    teacherName: string
    studentIds: string
    sessionNo: number
    weekNo: number
    weekday: number
    section: number
    buildingName: string
    roomName: string
  }
  passwordForm: { oldPassword: string; newPassword: string }
  roleName: (role?: number) => string
  statusName: (status: number) => string
  statusClass: (status: number) => Record<string, boolean>
  slotLabel: (weekday: number, section: number) => string
}>()

const emit = defineEmits<{
  'update:activeTab': [value: AppTab]
  logout: []
  createUser: []
  createCourse: []
  updateAdminStatus: [detailId: number, status: StatusCode]
  changePassword: []
}>()

function onStatusChange(event: Event, detailId: number) {
  const target = event.target as HTMLSelectElement
  emit('updateAdminStatus', detailId, Number(target.value) as StatusCode)
}
</script>

<template>
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
          @click="emit('update:activeTab', item.key)"
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
        <button class="ghost-button sidebar-logout" @click="emit('logout')">退出登录</button>
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
              <form class="form-grid compact" @submit.prevent="emit('createUser')">
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
              <form class="form-grid compact" @submit.prevent="emit('createCourse')">
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
                        @change="onStatusChange($event, row.attendance_detail_id)"
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
    </div>
  </div>
</template>
