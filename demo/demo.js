document.addEventListener('DOMContentLoaded', () => {
  const START_HOUR = 6
  const END_HOUR = 21
  const STORAGE_KEY = 'doublebook_tasks'
  const TEXTAREA_KEY = 'doublebook_textareas'
  window.reset = () => { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(TEXTAREA_KEY); location.reload() }
  const detail = document.getElementById('detail')
  const backdrop = document.getElementById('backdrop')
  const scheduleCols = document.getElementById('schedule-cols')
  const scheduleToggle = document.getElementById('schedule-toggle')
  const scheduleView = document.getElementById('schedule-view')
  let activeTask = null
  let countdownId = null
  let todayCol = null
  let tomorrowCol = null
  let timeLabelEl = null
  let earlyExpanded = false
  let lastMinute = -1

  const hide = el => el.classList.add('hidden')
  const show = el => el.classList.remove('hidden')
  const toggle = el => el.classList.toggle('hidden')

  const loadTasks = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').map(t => ({ ...t, time: new Date(t.time) }))
  const saveTasks = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  const tasks = loadTasks()

  const sameDay = (a, b) => a.toDateString() === b.toDateString()
  const fmtDate = d => d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  const fmt = (d, sec) => {
    const h = d.getHours() % 12 || 12
    const m = String(d.getMinutes()).padStart(2, '0')
    const s = String(d.getSeconds()).padStart(2, '0')
    const p = d.getHours() >= 12 ? 'PM' : 'AM'
    return sec ? `${h}:${m}:${s} ${p}` : `${h}:${m} ${p}`
  }

  const fmtHour = h => `${h % 12 || 12}${h >= 12 ? 'p' : 'a'}`

  const timePos = (d, col) => {
    const row = col.querySelector(`.hour-row[data-hour="${d.getHours()}"]`)
    if (!row) return null
    const frac = d.getMinutes() / 60 + d.getSeconds() / 3600
    return row.offsetTop + frac * row.offsetHeight
  }

  // Fill date headers
  const now = new Date()
  const tmrw = new Date(now)
  tmrw.setDate(tmrw.getDate() + 1)
  document.getElementById('today-date').textContent = fmtDate(now)
  document.getElementById('tomorrow-date').textContent = fmtDate(tmrw)

  // Textarea persistence
  const savedText = JSON.parse(localStorage.getItem(TEXTAREA_KEY) || '{}')
  const todayTextarea = document.getElementById('today-tasks')
  const tomorrowTextarea = document.getElementById('tomorrow-tasks')
  if (savedText.today) todayTextarea.value = savedText.today
  if (savedText.tomorrow) tomorrowTextarea.value = savedText.tomorrow
  const saveTextareas = () => localStorage.setItem(TEXTAREA_KEY, JSON.stringify({ today: todayTextarea.value, tomorrow: tomorrowTextarea.value }))
  todayTextarea.addEventListener('input', saveTextareas)
  tomorrowTextarea.addEventListener('input', saveTextareas)

  // Schedule toggle
  scheduleToggle.addEventListener('click', () => {
    scheduleToggle.classList.toggle('open')
    toggle(scheduleView)
    if (!scheduleView.classList.contains('hidden')) rebuild()
  })

  // Detail modal
  const openDetail = task => {
    activeTask = task
    show(detail)
    show(backdrop)
    document.getElementById('opt-time').value = `${String(task.time.getHours()).padStart(2, '0')}:${String(task.time.getMinutes()).padStart(2, '0')}`
    document.getElementById('task-input').value = task.prompt || ''
    show(document.getElementById('basic-view'))
    hide(document.getElementById('smart-view'))
    show(document.getElementById('workflow'))
    show(document.getElementById('agent-row'))
    show(document.getElementById('detail-actions'))
    hide(document.getElementById('schedule-opts'))
    show(document.getElementById('workflow-status'))
    document.getElementById('workflow-status').textContent = 'Will be generated as soon as task is described'
    hide(document.getElementById('workflow-steps'))
    document.getElementById('workflow-steps').innerHTML = ''
    hide(document.getElementById('workflow-customize-btn'))
    hide(document.getElementById('workflow-custom'))
    document.querySelectorAll('#input-toggle .toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.input === 'question'))
    clearInterval(countdownId)
    const updateCountdown = () => {
      const diff = Math.max(0, Math.floor((task.time - Date.now()) / 1000))
      const el = document.getElementById('countdown')
      if (diff <= 0) {
        el.innerHTML = 'Running now <span class="repeat">\u00b7 Repeat daily</span>'
        clearInterval(countdownId)
      } else if (diff >= 60) {
        el.innerHTML = `Task will run in ${Math.floor(diff / 60)}:${String(diff % 60).padStart(2, '0')} <span class="repeat">\u00b7 Repeat daily</span>`
      } else {
        el.innerHTML = `Task will run in ${diff}s <span class="repeat">\u00b7 Repeat daily</span>`
      }
    }
    updateCountdown()
    countdownId = setInterval(updateCountdown, 1000)
  }

  const closeDetail = () => {
    if (activeTask) {
      activeTask.prompt = document.getElementById('task-input').value.trim()
      saveTasks()
    }
    activeTask = null
    clearInterval(countdownId)
    hide(detail)
    hide(backdrop)
    rebuild()
  }

  const createTask = taskTime => {
    const task = { id: Date.now(), time: taskTime, label: 'Agentic Minute', prompt: '' }
    tasks.push(task)
    saveTasks()
    rebuild()
    openDetail(task)
  }

  // Shared builders
  const buildTaskEl = (task, inline) => {
    const el = document.createElement('div')
    el.className = inline ? 'task-block inline' : 'task-block'
    el.dataset.id = task.id
    const name = document.createElement('span')
    name.className = 'task-name'
    name.textContent = task.prompt || task.label
    const status = document.createElement('span')
    status.className = 'task-status'
    el.appendChild(name)
    el.appendChild(status)
    el.addEventListener('click', e => { e.stopPropagation(); openDetail(task) })
    return el
  }

  const buildHourRow = h => {
    const row = document.createElement('div')
    row.className = 'hour-row'
    row.dataset.hour = h
    const label = document.createElement('span')
    label.className = 'hour-label'
    label.textContent = fmtHour(h)
    row.appendChild(label)
    return row
  }

  const buildMinuteSummary = count => {
    const el = document.createElement('div')
    el.className = 'minute-summary'
    el.textContent = `${count} minute${count !== 1 ? 's' : ''} without active tasks`
    return el
  }

  // Build a past hour row with inline tasks and collapsed empty minutes
  const buildPastHourRow = (h, hourTasks) => {
    const row = document.createElement('div')
    row.className = 'hour-row current-hour'
    row.dataset.hour = h
    const label = document.createElement('span')
    label.className = 'hour-label'
    label.textContent = fmtHour(h)
    row.appendChild(label)
    const content = document.createElement('div')
    content.className = 'current-hour-content'
    const tasksByMin = new Map()
    hourTasks.forEach(t => {
      const m = t.time.getMinutes()
      if (!tasksByMin.has(m)) tasksByMin.set(m, [])
      tasksByMin.get(m).push(t)
    })
    let rangeStart = 0
    for (let m = 0; m < 60; m++) {
      if (tasksByMin.has(m)) {
        if (m > rangeStart) content.appendChild(buildMinuteSummary(m - rangeStart))
        tasksByMin.get(m).forEach(t => content.appendChild(buildTaskEl(t, true)))
        rangeStart = m + 1
      }
    }
    if (60 > rangeStart) content.appendChild(buildMinuteSummary(60 - rangeStart))
    row.appendChild(content)
    return row
  }

  // Build a day column
  const buildDayCol = (date, isToday) => {
    const col = document.createElement('div')
    col.className = 'day-col'

    const now = new Date()
    const curHour = now.getHours()
    const curMin = now.getMinutes()
    const dayTasks = tasks.filter(t => sameDay(t.time, date))

    if (isToday) {
      const earlyCount = Math.max(0, curHour - START_HOUR)

      // Early hours — show hours with tasks, collapse empty ranges
      if (earlyCount > 0) {
        const taskHours = new Set(dayTasks.filter(t => t.time.getHours() >= START_HOUR && t.time.getHours() < curHour).map(t => t.time.getHours()))
        let rangeStart = START_HOUR
        for (let h = START_HOUR; h < curHour; h++) {
          if (taskHours.has(h)) {
            if (h > rangeStart && !earlyExpanded) {
              const count = h - rangeStart
              const collapsed = document.createElement('div')
              collapsed.className = 'collapsed-hours'
              collapsed.textContent = `Show ${count} empty hour${count !== 1 ? 's' : ''} from earlier`
              collapsed.addEventListener('click', () => { earlyExpanded = true; rebuild() })
              col.appendChild(collapsed)
            } else if (h > rangeStart) {
              for (let eh = rangeStart; eh < h; eh++) col.appendChild(buildHourRow(eh))
            }
            col.appendChild(buildPastHourRow(h, dayTasks.filter(t => t.time.getHours() === h)))
            rangeStart = h + 1
          }
        }
        if (curHour > rangeStart) {
          if (earlyExpanded) {
            for (let eh = rangeStart; eh < curHour; eh++) col.appendChild(buildHourRow(eh))
          } else {
            const count = curHour - rangeStart
            const collapsed = document.createElement('div')
            collapsed.className = 'collapsed-hours'
            collapsed.textContent = `Show ${count} empty hour${count !== 1 ? 's' : ''} from earlier`
            collapsed.addEventListener('click', () => { earlyExpanded = true; rebuild() })
            col.appendChild(collapsed)
          }
        }
      }

      // Current hour with flow-based minute layout
      if (curHour >= START_HOUR && curHour <= END_HOUR) {
        const row = document.createElement('div')
        row.className = 'hour-row current-hour'
        row.dataset.hour = curHour
        const hourLabel = document.createElement('span')
        hourLabel.className = 'hour-label'
        hourLabel.textContent = fmtHour(curHour)
        row.appendChild(hourLabel)

        const content = document.createElement('div')
        content.className = 'current-hour-content'

        const tasksByMin = new Map()
        dayTasks.filter(t => t.time.getHours() === curHour).forEach(t => {
          const m = t.time.getMinutes()
          if (!tasksByMin.has(m)) tasksByMin.set(m, [])
          tasksByMin.get(m).push(t)
        })

        // Past minutes — collapsed summaries with inline tasks
        let rangeStart = 0
        for (let m = 0; m <= curMin; m++) {
          if (tasksByMin.has(m)) {
            if (m > rangeStart) content.appendChild(buildMinuteSummary(m - rangeStart))
            tasksByMin.get(m).forEach(t => content.appendChild(buildTaskEl(t, true)))
            rangeStart = m + 1
          }
        }
        if (curMin + 1 > rangeStart) content.appendChild(buildMinuteSummary(curMin + 1 - rangeStart))

        // Time line
        const tl = document.createElement('div')
        tl.id = 'time-line'
        const rule = document.createElement('div')
        rule.id = 'time-rule'
        timeLabelEl = document.createElement('div')
        timeLabelEl.id = 'time-label'
        timeLabelEl.textContent = fmt(now, true)
        tl.appendChild(rule)
        tl.appendChild(timeLabelEl)
        content.appendChild(tl)

        row.appendChild(content)
        col.appendChild(row)

        // Future minutes — individual for current 5-min block, then 5-min increments
        const blockEnd = Math.ceil((curMin + 1) / 5) * 5
        const fmtMin = m => `:${String(m).padStart(2, '0')}`
        for (let m = curMin + 1; m < 60; m++) {
          const shouldShow = tasksByMin.has(m) || m < blockEnd || m % 5 === 0
          if (!shouldShow) continue
          if (tasksByMin.has(m)) {
            const slot = document.createElement('div')
            slot.className = 'minute-row'
            const slotLabel = document.createElement('span')
            slotLabel.className = 'hour-label'
            slotLabel.textContent = fmtMin(m)
            slot.appendChild(slotLabel)
            const slotContent = document.createElement('div')
            slotContent.className = 'minute-row-content'
            tasksByMin.get(m).forEach(t => slotContent.appendChild(buildTaskEl(t, true)))
            slot.appendChild(slotContent)
            col.appendChild(slot)
          } else {
            const slot = document.createElement('div')
            slot.className = 'minute-row future'
            const slotLabel = document.createElement('span')
            slotLabel.className = 'hour-label'
            slotLabel.textContent = fmtMin(m)
            slot.appendChild(slotLabel)
            slot.addEventListener('click', () => {
              const t = new Date()
              t.setHours(curHour, m, 0, 0)
              createTask(t)
            })
            col.appendChild(slot)
          }
        }
      }

      // Future hours
      for (let h = Math.max(START_HOUR, curHour + 1); h <= END_HOUR; h++) col.appendChild(buildHourRow(h))

      // Absolute task blocks for future hours only
      requestAnimationFrame(() => {
        dayTasks.forEach(task => {
          const h = task.time.getHours()
          if (h <= curHour) return
          const pos = timePos(task.time, col)
          if (pos === null) return
          const block = buildTaskEl(task, false)
          block.style.top = pos + 'px'
          col.appendChild(block)
        })
      })
    } else {
      // Tomorrow — simple hour rows
      for (let h = START_HOUR; h <= END_HOUR; h++) col.appendChild(buildHourRow(h))
      requestAnimationFrame(() => {
        dayTasks.forEach(task => {
          const pos = timePos(task.time, col)
          if (pos === null) return
          const block = buildTaskEl(task, false)
          block.style.top = pos + 'px'
          col.appendChild(block)
        })
      })
    }

    return col
  }

  // Rebuild schedule columns
  const rebuild = () => {
    if (scheduleView.classList.contains('hidden')) return
    const scroll = todayCol?.scrollTop || 0
    const now = new Date()
    const tmrw = new Date(now)
    tmrw.setDate(tmrw.getDate() + 1)

    todayCol?.remove()
    tomorrowCol?.remove()

    todayCol = buildDayCol(now, true)
    tomorrowCol = buildDayCol(tmrw, false)

    scheduleCols.appendChild(todayCol)
    scheduleCols.appendChild(tomorrowCol)

    lastMinute = now.getMinutes()
    requestAnimationFrame(() => { todayCol.scrollTop = scroll })
  }

  // Update task statuses
  const updateTaskStatuses = () => {
    const now = Date.now()
    const next = tasks.filter(t => t.time > now).sort((a, b) => a.time - b.time)[0]
    tasks.forEach(task => {
      const el = document.querySelector(`[data-id="${task.id}"]`)
      if (!el) return
      const name = el.querySelector('.task-name')
      const status = el.querySelector('.task-status')
      if (!name || !status) return
      const diff = Math.floor((task.time - now) / 1000)
      if (diff > 0) {
        name.textContent = task.prompt || task.label
        status.textContent = next && task.id === next.id ? (diff > 60 ? `in ${Math.floor(diff / 60)}:${String(diff % 60).padStart(2, '0')}` : `in ${diff}s`) : ''
      } else if (diff > -5) {
        name.textContent = 'Jenny is working on it\u2026'
        status.textContent = ''
      } else {
        name.textContent = 'Jenny texted for approval\u2026'
        status.textContent = ''
      }
    })
  }

  // Tick
  const tick = () => {
    const now = new Date()
    if (timeLabelEl) timeLabelEl.textContent = fmt(now, true)
    if (!scheduleView.classList.contains('hidden') && now.getMinutes() !== lastMinute) rebuild()
    updateTaskStatuses()
  }

  setInterval(tick, 1000)

  // Tabs
  document.querySelectorAll('nav a').forEach(a =>
    a.addEventListener('click', () => {
      document.querySelectorAll('nav a').forEach(t => t.classList.remove('active'))
      document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'))
      a.classList.add('active')
      document.getElementById(a.dataset.tab)?.classList.add('active')
    })
  )

  // New basic task
  document.getElementById('new-task').addEventListener('click', () => {
    const now = new Date()
    const taskTime = new Date(now.getTime() + 2 * 60 * 1000)
    taskTime.setSeconds(0, 0)
    createTask(taskTime)
  })

  // Smart task — template list
  document.getElementById('new-smart').addEventListener('click', () => {
    activeTask = null
    show(detail)
    show(backdrop)
    hide(document.getElementById('basic-view'))
    show(document.getElementById('smart-view'))
    hide(document.getElementById('schedule-opts'))
    hide(document.getElementById('workflow'))
    hide(document.getElementById('agent-row'))
    hide(document.getElementById('detail-actions'))
    document.getElementById('countdown').textContent = 'Choose a template'
  })

  // Delete task
  document.getElementById('delete-btn').addEventListener('click', () => {
    if (!activeTask) return
    const idx = tasks.findIndex(t => t.id === activeTask.id)
    if (idx > -1) tasks.splice(idx, 1)
    saveTasks()
    activeTask = null
    clearInterval(countdownId)
    hide(detail)
    hide(backdrop)
    rebuild()
  })

  // Save
  document.getElementById('save-btn').addEventListener('click', closeDetail)
  backdrop.addEventListener('click', closeDetail)

  // Toggle schedule options
  document.getElementById('edit-schedule').addEventListener('click', () => toggle(document.getElementById('schedule-opts')))

  // Repeat → custom field
  document.getElementById('opt-repeat').addEventListener('change', e => {
    const wrap = document.getElementById('opt-custom-wrap')
    e.target.value === 'Custom' ? show(wrap) : hide(wrap)
  })

  // Input toggle
  document.querySelectorAll('#input-toggle .toggle-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('#input-toggle .toggle-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      document.getElementById('task-input').placeholder = btn.dataset.input === 'question'
        ? 'What would you like done?'
        : 'Describe the task in detail...'
    })
  )

  // Workflow generation on blur
  document.getElementById('task-input').addEventListener('blur', e => {
    const val = e.target.value.trim()
    const status = document.getElementById('workflow-status')
    const steps = document.getElementById('workflow-steps')
    const customBtn = document.getElementById('workflow-customize-btn')
    if (!val) {
      show(status)
      status.textContent = 'Will be generated as soon as task is described'
      hide(steps)
      hide(customBtn)
      return
    }
    status.textContent = 'Generating workflow...'
    show(status)
    hide(steps)
    setTimeout(() => {
      hide(status)
      show(steps)
      show(customBtn)
      steps.innerHTML = ''
      ;['Parse and understand task', 'Identify required actions and dependencies', 'Execute via Jenny', 'Verify results and report back'].forEach((text, i) => {
        const row = document.createElement('div')
        row.className = 'workflow-step'
        const num = document.createElement('span')
        num.className = 'workflow-step-num'
        num.textContent = i + 1
        const lbl = document.createElement('span')
        lbl.textContent = text
        row.appendChild(num)
        row.appendChild(lbl)
        steps.appendChild(row)
      })
    }, 800)
  })

  // Customize workflow toggle
  document.getElementById('workflow-customize-btn').addEventListener('click', () => {
    const custom = document.getElementById('workflow-custom')
    toggle(custom)
    if (!custom.classList.contains('hidden')) custom.focus()
  })
})
