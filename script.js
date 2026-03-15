// script.js
// =============================================
// GlassFlow Todo App - Fully functional single file
// =============================================

let tasks = []
let currentFilter = 'all'
let pieChart = null
let barChart = null
let lineChart = null
let editingTaskId = null

const taskInput = document.getElementById('task-input')
const addBtn = document.getElementById('add-btn')
const taskList = document.getElementById('task-list')
const emptyState = document.getElementById('empty-state')
const filterBtns = document.querySelectorAll('.filter-btn')
const themeToggle = document.getElementById('theme-toggle')
const clearAllBtn = document.getElementById('clear-all')
const taskCountEl = document.getElementById('task-count')
const progressFill = document.getElementById('progress-fill')
const progressText = document.getElementById('progress-text')

const editModal = document.getElementById('edit-modal')
const editInput = document.getElementById('edit-input')
const cancelEdit = document.getElementById('cancel-edit')
const saveEdit = document.getElementById('save-edit')

// Load from LocalStorage
function loadTasks() {
    const saved = localStorage.getItem('glassflow_tasks')
    tasks = saved ? JSON.parse(saved) : []
    
    // Demo data on first visit
    if (tasks.length === 0) {
        const now = new Date()
        tasks = [
            {
                id: Date.now() - 300000,
                text: "Finish project proposal",
                completed: true,
                createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
                completedAt: new Date(now.getTime() - 86400000).toISOString()
            },
            {
                id: Date.now() - 200000,
                text: "Buy groceries",
                completed: false,
                createdAt: new Date(now.getTime() - 86400000 * 1).toISOString(),
                completedAt: null
            },
            {
                id: Date.now() - 100000,
                text: "Schedule team meeting",
                completed: true,
                createdAt: new Date().toISOString(),
                completedAt: new Date().toISOString()
            },
            {
                id: Date.now(),
                text: "Review design mockups",
                completed: false,
                createdAt: new Date().toISOString(),
                completedAt: null
            }
        ]
        saveTasks()
    }
}

// Save to LocalStorage
function saveTasks() {
    localStorage.setItem('glassflow_tasks', JSON.stringify(tasks))
}

// Render task list
function renderTasks() {
    taskList.innerHTML = ''
    
    let filteredTasks = tasks
    
    if (currentFilter === 'pending') {
        filteredTasks = tasks.filter(t => !t.completed)
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed)
    }
    
    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block'
    } else {
        emptyState.style.display = 'none'
    }
    
    filteredTasks.forEach(task => {
        const li = document.createElement('li')
        li.className = `task-item ${task.completed ? 'completed' : ''}`
        li.dataset.id = task.id
        
        li.innerHTML = `
            <div class="task-checkbox" onclick="toggleComplete(${task.id})"></div>
            <span class="task-text">${task.text}</span>
            <div class="task-actions">
                <button onclick="startEdit(${task.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `
        taskList.appendChild(li)
    })
    
    updateStats()
}

// Toggle complete
window.toggleComplete = function(id) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    
    task.completed = !task.completed
    
    if (task.completed) {
        task.completedAt = new Date().toISOString()
    } else {
        task.completedAt = null
    }
    
    saveTasks()
    renderTasks()
    updateAllCharts()
}

// Delete task
window.deleteTask = function(id) {
    if (!confirm('Delete this task?')) return
    
    tasks = tasks.filter(t => t.id !== id)
    saveTasks()
    renderTasks()
    updateAllCharts()
}

// Start edit
window.startEdit = function(id) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    
    editingTaskId = id
    editInput.value = task.text
    editModal.style.display = 'flex'
    editInput.focus()
    editInput.select()
}

// Update stats
function updateStats() {
    const total = tasks.length
    const completed = tasks.filter(t => t.completed).length
    const percent = total ? Math.round((completed / total) * 100) : 0
    
    taskCountEl.textContent = total
    progressFill.style.width = `${percent}%`
    progressText.textContent = `${percent}%`
}

// Update all charts
function updateAllCharts() {
    updatePieChart()
    updateBarChart()
    updateLineChart()
}

// Pie Chart - Completed vs Pending
function updatePieChart() {
    const completed = tasks.filter(t => t.completed).length
    const pending = tasks.length - completed
    
    const ctx = document.getElementById('pie-chart')
    
    if (pieChart) pieChart.destroy()
    
    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [completed, pending],
                backgroundColor: ['#6366f1', '#e2e8f0'],
                borderWidth: 0,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '72%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: 'var(--text)', padding: 20, font: { size: 14 } }
                }
            }
        }
    })
}

// Bar Chart - Tasks created per day
function updateBarChart() {
    const groups = {}
    
    tasks.forEach(task => {
        const date = new Date(task.createdAt).toISOString().split('T')[0]
        groups[date] = (groups[date] || 0) + 1
    })
    
    const sortedDates = Object.keys(groups).sort()
    const labels = sortedDates.map(date => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })
    
    const ctx = document.getElementById('bar-chart')
    
    if (barChart) barChart.destroy()
    
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tasks Created',
                data: Object.values(groups),
                backgroundColor: '#a5b4fc',
                borderRadius: 12,
                barThickness: 28
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { grid: { color: 'rgba(255,255,255,0.1)' } }
            }
        }
    })
}

// Line Chart - Completion trend
function updateLineChart() {
    const groups = {}
    
    tasks.filter(t => t.completed && t.completedAt).forEach(task => {
        const date = new Date(task.completedAt).toISOString().split('T')[0]
        groups[date] = (groups[date] || 0) + 1
    })
    
    const sortedDates = Object.keys(groups).sort()
    const labels = sortedDates.map(date => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })
    
    const ctx = document.getElementById('line-chart')
    
    if (lineChart) lineChart.destroy()
    
    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tasks Completed',
                data: Object.values(groups),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                tension: 0.4,
                borderWidth: 4,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { grid: { color: 'rgba(255,255,255,0.1)' } }
            }
        }
    })
}

// Add new task
function addTask() {
    const text = taskInput.value.trim()
    if (!text) return
    
    const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    }
    
    tasks.unshift(newTask) // newest first
    saveTasks()
    renderTasks()
    updateAllCharts()
    
    // Clear input
    taskInput.value = ''
    
    // Nice animation already handled by CSS
}

// Filter handler
function setFilter(filter) {
    currentFilter = filter
    
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter)
    })
    
    renderTasks()
}

// Theme toggle
function toggleTheme() {
    document.documentElement.classList.toggle('dark')
    
    const icon = themeToggle.querySelector('i')
    if (document.documentElement.classList.contains('dark')) {
        icon.classList.remove('fa-moon')
        icon.classList.add('fa-sun')
    } else {
        icon.classList.remove('fa-sun')
        icon.classList.add('fa-moon')
    }
    
    // Re-render charts with new colors
    setTimeout(() => {
        updateAllCharts()
    }, 50)
}

// Clear all
function clearAllTasks() {
    if (!confirm('Delete ALL tasks permanently?')) return
    tasks = []
    saveTasks()
    renderTasks()
    updateAllCharts()
}

// Event Listeners
function initListeners() {
    // Add task
    addBtn.addEventListener('click', addTask)
    taskInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') addTask()
    })
    
    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setFilter(btn.dataset.filter)
        })
    })
    
    // Theme
    themeToggle.addEventListener('click', toggleTheme)
    
    // Clear all
    clearAllBtn.addEventListener('click', clearAllTasks)
    
    // Modal
    cancelEdit.addEventListener('click', () => {
        editModal.style.display = 'none'
    })
    
    saveEdit.addEventListener('click', () => {
        if (!editingTaskId) return
        
        const newText = editInput.value.trim()
        if (newText) {
            const task = tasks.find(t => t.id === editingTaskId)
            if (task) {
                task.text = newText
                saveTasks()
                renderTasks()
                updateAllCharts()
            }
        }
        editModal.style.display = 'none'
    })
    
    // Close modal on outside click
    editModal.addEventListener('click', e => {
        if (e.target === editModal) editModal.style.display = 'none'
    })
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
    if (e.metaKey && e.key === 'k') {
        e.preventDefault()
        taskInput.focus()
    }
})

// Initialize everything
function initializeApp() {
    loadTasks()
    renderTasks()
    updateAllCharts()
    initListeners()
    
    // Set initial filter
    setFilter('all')
    
    // Check saved theme
    if (localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark')
        themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun')
    }
}

// Start the app
initializeApp()