// State
let currentDate = new Date();
let currentView = 'monthly';
let projects = [];
let crews = [];
let selectedCrewId = null;

// Default crews
const defaultCrews = [
    { id: '1', name: 'Alpha Crew', color: '#3b82f6', members: [{ name: 'John Smith', isLeader: true }, { name: 'Mike Johnson', isLeader: false }] },
    { id: '2', name: 'Beta Crew', color: '#22c55e', members: [{ name: 'Sarah Davis', isLeader: true }, { name: 'Tom Wilson', isLeader: false }] },
    { id: '3', name: 'Gamma Crew', color: '#f59e0b', members: [{ name: 'Chris Brown', isLeader: true }] },
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    render();
});

function loadData() {
    const savedProjects = localStorage.getItem('roadScheduler_projects');
    const savedCrews = localStorage.getItem('roadScheduler_crews');
    
    projects = savedProjects ? JSON.parse(savedProjects) : [];
    crews = savedCrews ? JSON.parse(savedCrews) : defaultCrews;
}

function saveData() {
    localStorage.setItem('roadScheduler_projects', JSON.stringify(projects));
    localStorage.setItem('roadScheduler_crews', JSON.stringify(crews));
}

function setupEventListeners() {
    // Navigation
    document.getElementById('prevBtn').addEventListener('click', () => navigate(-1));
    document.getElementById('nextBtn').addEventListener('click', () => navigate(1));
    document.getElementById('todayBtn').addEventListener('click', goToToday);
    
    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => setView(btn.dataset.view));
    });
    
    // Modals
    document.getElementById('addProjectBtn').addEventListener('click', openNewProjectModal);
    document.getElementById('manageCrewsBtn').addEventListener('click', openCrewModal);
    document.getElementById('projectForm').addEventListener('submit', handleProjectSubmit);
    document.getElementById('addCrewBtn').addEventListener('click', addNewCrew);
    
    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Navigation
function navigate(direction) {
    if (currentView === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + direction);
    } else {
        currentDate.setDate(currentDate.getDate() + (direction * 7));
    }
    render();
}

function goToToday() {
    currentDate = new Date();
    render();
}

function setView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    render();
}

// Render
function render() {
    updatePeriodDisplay();
    
    const container = document.getElementById('calendarContainer');
    
    switch (currentView) {
        case 'monthly':
            container.innerHTML = renderMonthlyCalendar();
            break;
        case 'weekly':
            container.innerHTML = renderWeeklyCalendar();
            break;
        case 'gantt':
            container.innerHTML = renderGanttChart();
            break;
    }
    
    // Add click handlers to project blocks
    container.querySelectorAll('.project-block, .weekly-project, .gantt-bar').forEach(block => {
        block.addEventListener('click', () => openEditProjectModal(block.dataset.projectId));
    });
}

function updatePeriodDisplay() {
    const options = { month: 'long', year: 'numeric' };
    if (currentView === 'weekly') {
        const weekStart = getWeekStart(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        document.getElementById('currentPeriod').textContent = 
            `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
        document.getElementById('currentPeriod').textContent = currentDate.toLocaleDateString('en-US', options);
    }
}

// Monthly Calendar
function renderMonthlyCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = '<div class="monthly-calendar">';
    
    // Header
    html += '<div class="calendar-header">';
    days.forEach(day => {
        html += `<div class="calendar-header-cell">${day}</div>`;
    });
    html += '</div>';
    
    // Body
    html += '<div class="calendar-body">';
    const today = new Date();
    const currentDateCopy = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
        const isOtherMonth = currentDateCopy.getMonth() !== month;
        const isToday = isSameDay(currentDateCopy, today);
        const dateStr = formatDate(currentDateCopy);
        
        html += `<div class="calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" data-date="${dateStr}">`;
        html += `<div class="day-number">${currentDateCopy.getDate()}</div>`;
        html += '<div class="day-projects">';
        
        // Get projects for this day
        const dayProjects = getProjectsForDate(currentDateCopy);
        dayProjects.forEach(project => {
            const crew = crews.find(c => c.id === project.crewId);
            const color = crew?.color || '#666';
            const position = getProjectPosition(project, currentDateCopy);
            html += `<div class="project-block ${position}" style="background: ${color}" data-project-id="${project.id}">${project.name}</div>`;
        });
        
        html += '</div></div>';
        currentDateCopy.setDate(currentDateCopy.getDate() + 1);
    }
    
    html += '</div></div>';
    return html;
}

// Weekly Calendar
function renderWeeklyCalendar() {
    const weekStart = getWeekStart(currentDate);
    const days = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    let html = '<div class="weekly-calendar">';
    
    // Header
    html += '<div class="weekly-header">';
    html += '<div class="weekly-header-cell"></div>';
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + i);
        const isToday = isSameDay(day, today);
        html += `<div class="weekly-header-cell ${isToday ? 'today' : ''}">
            <div class="day-name">${days[i + 1]}</div>
            <div class="day-num">${day.getDate()}</div>
        </div>`;
    }
    html += '</div>';
    
    // Body
    html += '<div class="weekly-body">';
    
    // Time column
    html += '<div class="time-column">';
    for (let h = 6; h < 20; h++) {
        html += `<div class="time-slot">${h > 12 ? h - 12 : h}${h >= 12 ? 'PM' : 'AM'}</div>`;
    }
    html += '</div>';
    
    // Day columns
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + i);
        const dayProjects = getProjectsForDate(day);
        
        html += '<div class="weekly-day-column">';
        dayProjects.forEach((project, idx) => {
            const crew = crews.find(c => c.id === project.crewId);
            const color = crew?.color || '#666';
            const top = 10 + (idx * 45);
            html += `<div class="weekly-project" style="background: ${color}; top: ${top}px; height: 40px;" data-project-id="${project.id}">${project.name}</div>`;
        });
        html += '</div>';
    }
    
    html += '</div></div>';
    return html;
}

// Gantt Chart
function renderGanttChart() {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();
    
    let html = '<div class="gantt-chart">';
    
    // Header
    html += '<div class="gantt-header">';
    html += '<div class="gantt-label-col">Project</div>';
    html += '<div class="gantt-timeline">';
    
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        html += `<div class="gantt-day-header ${isWeekend ? 'weekend' : ''}">
            <div class="day-num">${d}</div>
            <div class="day-name">${dayNames[dayOfWeek]}</div>
        </div>`;
    }
    
    html += '</div></div>';
    
    // Body
    html += '<div class="gantt-body">';
    
    // Get projects that overlap with this month
    const monthProjects = projects.filter(p => {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        return start <= monthEnd && end >= monthStart;
    });
    
    monthProjects.forEach(project => {
        const crew = crews.find(c => c.id === project.crewId);
        const color = crew?.color || '#666';
        const start = new Date(project.startDate);
        const end = new Date(project.endDate);
        
        // Calculate bar position
        const startDay = Math.max(1, start.getDate() - (start.getMonth() === currentDate.getMonth() ? 0 : start.getDate()) + 1);
        const endDay = Math.min(daysInMonth, end.getDate() + (end.getMonth() === currentDate.getMonth() ? 0 : daysInMonth - end.getDate()));
        
        const actualStartDay = start < monthStart ? 1 : start.getDate();
        const actualEndDay = end > monthEnd ? daysInMonth : end.getDate();
        
        const leftPos = (actualStartDay - 1) * 40;
        const width = (actualEndDay - actualStartDay + 1) * 40 - 4;
        
        html += '<div class="gantt-row">';
        html += `<div class="gantt-row-label">
            <span class="crew-color" style="background: ${color}"></span>
            ${project.name}
        </div>`;
        html += '<div class="gantt-row-timeline">';
        
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            html += `<div class="gantt-cell ${isWeekend ? 'weekend' : ''}"></div>`;
        }
        
        html += `<div class="gantt-bar" style="left: ${leftPos}px; width: ${width}px; background: ${color}" data-project-id="${project.id}">${project.name}</div>`;
        html += '</div></div>';
    });
    
    if (monthProjects.length === 0) {
        html += '<div class="empty-state">No projects this month</div>';
    }
    
    html += '</div></div>';
    return html;
}

// Project helpers
function getProjectsForDate(date) {
    const dateStr = formatDate(date);
    return projects.filter(p => {
        return dateStr >= p.startDate && dateStr <= p.endDate;
    });
}

function getProjectPosition(project, date) {
    const dateStr = formatDate(date);
    if (project.startDate === project.endDate) return 'single';
    if (dateStr === project.startDate) return 'start';
    if (dateStr === project.endDate) return 'end';
    return 'middle';
}

// Project Modal
function openNewProjectModal() {
    document.getElementById('projectModalTitle').textContent = 'New Project';
    document.getElementById('projectForm').reset();
    document.getElementById('projectId').value = '';
    document.getElementById('deleteProjectBtn').style.display = 'none';
    populateCrewSelect();
    
    // Set default dates
    document.getElementById('projectStart').value = formatDate(new Date());
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    document.getElementById('projectEnd').value = formatDate(nextWeek);
    
    document.getElementById('projectModal').classList.add('active');
}

function openEditProjectModal(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    document.getElementById('projectModalTitle').textContent = 'Edit Project';
    document.getElementById('projectId').value = project.id;
    document.getElementById('projectName').value = project.name;
    document.getElementById('projectLocation').value = project.location || '';
    document.getElementById('projectStart').value = project.startDate;
    document.getElementById('projectEnd').value = project.endDate;
    document.getElementById('projectNotes').value = project.notes || '';
    
    populateCrewSelect();
    document.getElementById('projectCrew').value = project.crewId;
    
    document.getElementById('deleteProjectBtn').style.display = 'block';
    document.getElementById('deleteProjectBtn').onclick = () => deleteProject(projectId);
    
    document.getElementById('projectModal').classList.add('active');
}

function closeProjectModal() {
    document.getElementById('projectModal').classList.remove('active');
}

function handleProjectSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('projectId').value || generateId();
    const project = {
        id,
        name: document.getElementById('projectName').value,
        location: document.getElementById('projectLocation').value,
        startDate: document.getElementById('projectStart').value,
        endDate: document.getElementById('projectEnd').value,
        crewId: document.getElementById('projectCrew').value,
        notes: document.getElementById('projectNotes').value
    };
    
    const existingIndex = projects.findIndex(p => p.id === id);
    if (existingIndex >= 0) {
        projects[existingIndex] = project;
    } else {
        projects.push(project);
    }
    
    saveData();
    closeProjectModal();
    render();
}

function deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project?')) {
        projects = projects.filter(p => p.id !== projectId);
        saveData();
        closeProjectModal();
        render();
    }
}

function populateCrewSelect() {
    const select = document.getElementById('projectCrew');
    select.innerHTML = '<option value="">Select a crew...</option>';
    crews.forEach(crew => {
        select.innerHTML += `<option value="${crew.id}">${crew.name}</option>`;
    });
}

// Crew Modal
function openCrewModal() {
    selectedCrewId = null;
    renderCrewList();
    renderCrewDetail();
    document.getElementById('crewModal').classList.add('active');
}

function closeCrewModal() {
    document.getElementById('crewModal').classList.remove('active');
    render();
}

function renderCrewList() {
    const list = document.getElementById('crewList');
    list.innerHTML = '';
    
    crews.forEach(crew => {
        const item = document.createElement('li');
        item.className = `crew-list-item ${crew.id === selectedCrewId ? 'active' : ''}`;
        item.innerHTML = `
            <span class="crew-color-dot" style="background: ${crew.color}"></span>
            <span>${crew.name}</span>
        `;
        item.addEventListener('click', () => {
            selectedCrewId = crew.id;
            renderCrewList();
            renderCrewDetail();
        });
        list.appendChild(item);
    });
}

function renderCrewDetail() {
    const panel = document.getElementById('crewDetailPanel');
    
    if (!selectedCrewId) {
        panel.innerHTML = '<div class="empty-state">Select a crew to edit</div>';
        return;
    }
    
    const crew = crews.find(c => c.id === selectedCrewId);
    if (!crew) return;
    
    panel.innerHTML = `
        <div class="crew-detail-form">
            <div class="form-group">
                <label>Crew Name</label>
                <input type="text" id="crewName" value="${crew.name}">
            </div>
            <div class="form-group">
                <label>Color</label>
                <div class="color-picker-wrapper">
                    <input type="color" id="crewColor" value="${crew.color}">
                    <span>${crew.color}</span>
                </div>
            </div>
            
            <div class="crew-members-section">
                <h4>Members</h4>
                <ul class="member-list" id="memberList">
                    ${crew.members.map((m, idx) => `
                        <li class="member-item">
                            <div class="member-info">
                                <span>${m.name}</span>
                                ${m.isLeader ? '<span class="leader-badge">Leader</span>' : ''}
                            </div>
                            <div class="member-actions">
                                ${!m.isLeader ? `<button onclick="setLeader(${idx})">Make Leader</button>` : ''}
                                <button onclick="removeMember(${idx})">Remove</button>
                            </div>
                        </li>
                    `).join('')}
                </ul>
                <div class="add-member-row">
                    <input type="text" id="newMemberName" placeholder="New member name">
                    <button onclick="addMember()">Add</button>
                </div>
            </div>
            
            <div class="crew-actions">
                <button class="btn-danger" onclick="deleteCrew()">Delete Crew</button>
                <button class="btn-primary" onclick="saveCrewChanges()">Save Changes</button>
            </div>
        </div>
    `;
    
    // Update color display when changed
    document.getElementById('crewColor').addEventListener('input', (e) => {
        e.target.nextElementSibling.textContent = e.target.value;
    });
}

function addNewCrew() {
    const newCrew = {
        id: generateId(),
        name: 'New Crew',
        color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
        members: []
    };
    crews.push(newCrew);
    selectedCrewId = newCrew.id;
    saveData();
    renderCrewList();
    renderCrewDetail();
}

function saveCrewChanges() {
    const crew = crews.find(c => c.id === selectedCrewId);
    if (!crew) return;
    
    crew.name = document.getElementById('crewName').value;
    crew.color = document.getElementById('crewColor').value;
    
    saveData();
    renderCrewList();
}

function deleteCrew() {
    if (confirm('Are you sure you want to delete this crew? Projects assigned to this crew will become unassigned.')) {
        crews = crews.filter(c => c.id !== selectedCrewId);
        selectedCrewId = null;
        saveData();
        renderCrewList();
        renderCrewDetail();
    }
}

function addMember() {
    const crew = crews.find(c => c.id === selectedCrewId);
    if (!crew) return;
    
    const name = document.getElementById('newMemberName').value.trim();
    if (!name) return;
    
    crew.members.push({ name, isLeader: false });
    saveData();
    renderCrewDetail();
}

function removeMember(idx) {
    const crew = crews.find(c => c.id === selectedCrewId);
    if (!crew) return;
    
    crew.members.splice(idx, 1);
    saveData();
    renderCrewDetail();
}

function setLeader(idx) {
    const crew = crews.find(c => c.id === selectedCrewId);
    if (!crew) return;
    
    crew.members.forEach((m, i) => m.isLeader = i === idx);
    saveData();
    renderCrewDetail();
}

// Utilities
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Set initial view
setView('monthly');
