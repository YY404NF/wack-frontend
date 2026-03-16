type ImportedCourseJson = {
  学期?: unknown
  课程名称?: unknown
  授课教师?: unknown
  上课时间?: Array<Record<string, unknown>>
}

type ImportedClassJson = {
  年级?: unknown
  专业?: unknown
  专业名称?: unknown
  班级名称?: unknown
  学生列表?: Array<Record<string, unknown>>
}

export async function parseImportedCourseFile(file: File) {
  const weekdayMap: Record<string, number> = {
    周一: 1,
    周二: 2,
    周三: 3,
    周四: 4,
    周五: 5,
    周六: 6,
    周日: 7,
    周天: 7,
  }
  const sectionMap: Record<string, number> = {
    上午12节: 1,
    上午34节: 2,
    下午56节: 3,
    下午78节: 4,
    晚上910节: 5,
  }

  const normalizeSectionLabel = (value: string) => value.replace(/\s+/g, '').replace(/-/g, '').replace(/第/g, '')
  const textValue = (value: unknown) => String(value ?? '').trim()
  const text = await file.text()
  const payload = JSON.parse(text) as ImportedCourseJson
  const term = textValue(payload.学期)
  const courseName = textValue(payload.课程名称)
  const teacherName = textValue(payload.授课教师)
  const rawSessions = Array.isArray(payload.上课时间) ? payload.上课时间 : []

  if (!term || !courseName || !teacherName) {
    throw new Error('缺少课程基础信息')
  }
  if (rawSessions.length === 0) {
    throw new Error('没有可导入的上课时间')
  }

  const sessions = Array.from(
    new Map(
      rawSessions.map((item, index) => {
        const weekdayLabel = textValue(item['星期'])
        const sectionLabel = normalizeSectionLabel(textValue(item['时间']))
        const weekNo = Number(item['周数'])
        const buildingName = textValue(item['教学楼'] ?? item['地点'] ?? item['楼栋'])
        const roomName = textValue(item['教室'] ?? item['教室号'] ?? item['房间'])
        const weekday = weekdayMap[weekdayLabel]
        const section = sectionMap[sectionLabel]

        if (!weekday) {
          throw new Error(`第 ${index + 1} 条上课时间的星期无效`)
        }
        if (!section) {
          throw new Error(`第 ${index + 1} 条上课时间的时间无效`)
        }
        if (!Number.isInteger(weekNo) || weekNo < 1) {
          throw new Error(`第 ${index + 1} 条上课时间的周数无效`)
        }
        if (!buildingName) {
          throw new Error(`第 ${index + 1} 条上课时间缺少教学楼`)
        }
        if (!roomName) {
          throw new Error(`第 ${index + 1} 条上课时间缺少教室`)
        }

        const session = {
          session_no: 0,
          week_no: weekNo,
          weekday,
          section,
          building_name: buildingName,
          room_name: roomName,
        }
        return [`${weekNo}-${weekday}-${section}-${buildingName}-${roomName}`, session] as const
      }),
    ).values(),
  )
    .sort((left, right) => {
      if (left.week_no !== right.week_no) {
        return left.week_no - right.week_no
      }
      if (left.weekday !== right.weekday) {
        return left.weekday - right.weekday
      }
      if (left.section !== right.section) {
        return left.section - right.section
      }
      return left.room_name.localeCompare(right.room_name, 'zh-Hans-CN')
    })
    .map((item, index) => ({
      ...item,
      session_no: index + 1,
    }))

  return {
    term,
    course_name: courseName,
    teacher_name: teacherName,
    attendance_student_count: 0,
    sessions,
  }
}

export async function parseImportedClassFile(file: File) {
  const textValue = (value: unknown) => String(value ?? '').trim()
  const text = await file.text()
  const payload = JSON.parse(text) as ImportedClassJson
  const grade = Number(payload.年级)
  const majorName = textValue(payload.专业 ?? payload.专业名称)
  const className = textValue(payload.班级名称)
  const students = Array.from(
    new Map(
      (Array.isArray(payload.学生列表) ? payload.学生列表 : [])
        .map((item) => ({
          student_id: textValue(item['学号']),
          real_name: textValue(item['姓名']),
        }))
        .filter((item) => item.student_id && item.real_name)
        .map((item) => [item.student_id, item] as const),
    ).values(),
  )

  if (!Number.isInteger(grade) || grade < 1) {
    throw new Error('年级无效')
  }
  if (!majorName) {
    throw new Error('缺少专业名称')
  }
  if (!className) {
    throw new Error('缺少班级名称')
  }
  if (students.length === 0) {
    throw new Error('导入文件中没有有效的学生数据')
  }

  return {
    class_name: className,
    grade,
    major_name: majorName,
    students,
  }
}
