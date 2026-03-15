<script setup lang="ts">
import type { CourseItem } from '../../api'
import { sectionLabels, weekdayLabels } from '../../constants'

defineProps<{
  courses: CourseItem[]
  creatingCourse: boolean
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
}>()

const emit = defineEmits<{
  createCourse: []
}>()
</script>

<template>
  <section class="workspace-card">
    <div class="section-heading">
      <h2>课程管理</h2>
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
      <button class="primary-button" type="submit" :disabled="creatingCourse">
        <span v-if="creatingCourse" class="button-spinner" aria-hidden="true"></span>
        <span>{{ creatingCourse ? '创建中...' : '创建课程' }}</span>
      </button>
    </form>

    <div class="list-grid dense-grid">
      <article v-for="course in courses" :key="course.id" class="record-card">
        <strong>{{ course.course_name }}</strong>
        <p>{{ course.teacher_name }}</p>
        <small>{{ course.term }} · 应到 {{ course.attendance_student_count }}</small>
      </article>
    </div>
  </section>
</template>
