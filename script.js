//app.js
// Declare arrays to hold the data
let subjects = [];
let assignments = [];
let exams = [];

// schedule tasks and xp
let scheduleTasks = []; // {id, date, task, type, assignmentId?, completed, xpGranted}
let xp = 0; // persisted XP total

// storage keys
const KEY_SUBJECTS = 'sb_subjects';
const KEY_ASSIGNMENTS = 'sb_assignments';
const KEY_EXAMS = 'sb_exams';
const KEY_SCHEDULE = 'sb_schedule';
const KEY_XP = 'sb_xp';
const USERS_DATA_KEY = 'sb_user_data'; // mapping email -> {subjects, assignments, exams, schedule, xp}
const CUR_USER_KEY = 'sb_currentUser';

function saveAll() {
    try {
        const cur = localStorage.getItem(CUR_USER_KEY);
        if (cur) {
            // save under user-scoped storage
            const usersData = JSON.parse(localStorage.getItem(USERS_DATA_KEY) || '{}');
            usersData[cur] = {
                subjects: subjects,
                assignments: assignments,
                exams: exams,
                schedule: scheduleTasks,
                xp: xp
            };
            localStorage.setItem(USERS_DATA_KEY, JSON.stringify(usersData));
        } else {
            // anonymous/global storage
            localStorage.setItem(KEY_SUBJECTS, JSON.stringify(subjects));
            localStorage.setItem(KEY_ASSIGNMENTS, JSON.stringify(assignments));
            localStorage.setItem(KEY_EXAMS, JSON.stringify(exams));
            localStorage.setItem(KEY_SCHEDULE, JSON.stringify(scheduleTasks));
            localStorage.setItem(KEY_XP, String(xp));
        }
    } catch (e) {
        console.warn('Failed to save to localStorage', e);
    }
}

function loadAll() {
    try {
        const cur = localStorage.getItem(CUR_USER_KEY);
        if (cur) {
            const usersData = JSON.parse(localStorage.getItem(USERS_DATA_KEY) || '{}');
            const data = usersData[cur];
            if (data) {
                subjects = data.subjects || [];
                assignments = data.assignments || [];
                exams = data.exams || [];
                scheduleTasks = data.schedule || [];
                xp = parseInt(data.xp,10) || 0;
            } else {
                subjects = [];
                assignments = [];
                exams = [];
                scheduleTasks = [];
                xp = 0;
            }
        } else {
            const s = localStorage.getItem(KEY_SUBJECTS);
            const a = localStorage.getItem(KEY_ASSIGNMENTS);
            const e = localStorage.getItem(KEY_EXAMS);
            const sch = localStorage.getItem(KEY_SCHEDULE);
            const x = localStorage.getItem(KEY_XP);
            if (s) subjects = JSON.parse(s);
            if (a) assignments = JSON.parse(a);
            if (e) exams = JSON.parse(e);
            if (sch) scheduleTasks = JSON.parse(sch);
            if (x) xp = parseInt(x,10) || 0;
        }
    } catch (err) {
        console.warn('Failed to load from localStorage', err);
    }
}

function genId(prefix) {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random()*10000)}`;
}

// XP system
const XP_PER_TASK = 10;
function createXPDisplay() {
    if (document.getElementById('xpDisplay')) return;
    const xpDiv = document.createElement('div');
    xpDiv.id = 'xpDisplay';
    xpDiv.style.position = 'fixed';
    xpDiv.style.top = '12px';
    xpDiv.style.right = '12px';
    xpDiv.style.background = '#0d9488';
    xpDiv.style.color = '#ffffff';
    xpDiv.style.padding = '8px 12px';
    xpDiv.style.borderRadius = '999px';
    xpDiv.style.fontWeight = '700';
    xpDiv.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
    xpDiv.style.zIndex = '1000';
    xpDiv.textContent = 'XP: 0';
    document.body.appendChild(xpDiv);
}

function calcTotalXP() {
    let completed = 0;
    assignments.forEach(a => { if (a.isComplete) completed++; });
    exams.forEach(e => { if (e.isComplete) completed++; });
    return completed * XP_PER_TASK;
}

function updateXPDisplay() {
    if (!document.body) return;
    if (!document.getElementById('xpDisplay')) createXPDisplay();
    const xpDiv = document.getElementById('xpDisplay');
    xpDiv.textContent = `XP: ${calcTotalXP()}`;
}

// support alternate id from index2.html (addSubjBtn)
const addSubjectBtn = document.getElementById('addSubjectBtn') || document.getElementById('addSubjBtn');
if (addSubjectBtn) {
    addSubjectBtn.addEventListener('click', () => {
        const newSubjectInput = document.getElementById('newSubject');
        const subjectName = newSubjectInput.value.trim();
        if (subjectName) {
            subjects.push(subjectName);
            updateSubjectsLists();
            newSubjectInput.value = '';
            saveAll();
        }
    });
}

// Clear saved subjects button (added to index2.html)
const clearSubjectsBtn = document.getElementById('clearSubjectsBtn');
if (clearSubjectsBtn){
    clearSubjectsBtn.addEventListener('click', ()=>{
        if (!confirm('Clear all saved subjects? This cannot be undone.')) return;
        subjects = [];
        // remove key from localStorage and persist cleared state
        try { localStorage.removeItem(KEY_SUBJECTS); } catch(e){}
        saveAll();
        updateSubjectsLists();
        updateAssignmentsList();
    });
}

// Toggle handlers for completion state
function toggleAssignmentCompletion(event) {
    const idx = event.target.dataset.index;
    const checked = event.target.checked;
    if (typeof assignments[idx] !== 'undefined') {
        assignments[idx].isComplete = checked;
        // award XP for whole-assignment completion (only once)
        if (checked && !assignments[idx].xpGranted){ xp += XP_PER_TASK; assignments[idx].xpGranted = true; }
        if (!checked && assignments[idx].xpGranted){ xp = Math.max(0, xp - XP_PER_TASK); assignments[idx].xpGranted = false; }
        updateAssignmentsList();
        saveAll();
        updateXPDisplay();
    }
}

function toggleExamCompletion(event) {
    const idx = event.target.dataset.index;
    const checked = event.target.checked;
    if (typeof exams[idx] !== 'undefined') {
        exams[idx].isComplete = checked;
        if (checked && !exams[idx].xpGranted){ xp += XP_PER_TASK; exams[idx].xpGranted = true; }
        if (!checked && exams[idx].xpGranted){ xp = Math.max(0, xp - XP_PER_TASK); exams[idx].xpGranted = false; }
        updateExamsList();
        saveAll();
        updateXPDisplay();
    }
}

document.getElementById('addAssignmentBtn').addEventListener('click', () => {
    const newAssignmentInput = document.getElementById('newAssignment');
    const assignmentSubjectSelect = document.getElementById('assignmentSubject');
    const hoursInput = document.getElementById('assignmentHours');
    const assignmentName = newAssignmentInput.value.trim();
    const assignmentSubject = assignmentSubjectSelect.value;
    const hoursNeeded = hoursInput && hoursInput.value ? parseFloat(hoursInput.value) : 1;
    if (assignmentName && assignmentSubject) {
        assignments.push({ id: genId('a'), name: assignmentName, subject: assignmentSubject, hoursNeeded: Math.max(0.5, hoursNeeded), progress: 0, isComplete: false });
        updateAssignmentsList();
        newAssignmentInput.value = '';
        assignmentSubjectSelect.value = '';
        if (hoursInput) hoursInput.value = '';
        saveAll();
    }
});



document.getElementById('addExamBtn').addEventListener('click', () => {
    const examDateInput = document.getElementById('examDate');
    const examSubjectSelect = document.getElementById('examSubject');
    const examDate = examDateInput.value;
    const examSubject = examSubjectSelect.value;
    if (examDate && examSubject) {
        exams.push({ id: genId('e'), subject: examSubject, date: examDate, isComplete: false });
        updateExamsList();
        examDateInput.value = '';
        examSubjectSelect.value = '';
        saveAll();
    }
});

function updateSubjectsLists() {
    const subjectsList = document.getElementById('subjectsList');
    const assignmentSubjectSelect = document.getElementById('assignmentSubject');
    const examSubjectSelect = document.getElementById('examSubject');

    subjectsList.innerHTML = '';
    assignmentSubjectSelect.innerHTML = '<option value="">Select Subject</option>';
    examSubjectSelect.innerHTML = '<option value="">Select Subject</option>';

    subjects.forEach(subject => {
        // Display subjects
        const tag = document.createElement('span');
        tag.className = 'bg-teal-700 text-teal-100 text-xs font-semibold px-2.5 py-0.5 rounded-full';
        tag.style.display = 'inline-flex';
        tag.style.alignItems = 'center';
        tag.style.gap = '8px';
        const text = document.createElement('span');
        text.textContent = subject;
        // remove button for this subject
        const rem = document.createElement('button');
        rem.textContent = '✕';
        rem.title = `Remove subject ${subject}`;
        rem.style.marginLeft = '6px';
        rem.style.background = 'transparent';
        rem.style.border = 'none';
        rem.style.color = 'rgba(255,255,255,0.9)';
        rem.style.cursor = 'pointer';
        rem.onclick = ()=>{
            if (!confirm(`Remove subject "${subject}" and its related assignments/exams?`)) return;
            // remove subject from subjects array
            subjects = subjects.filter(s=>s!==subject);
            // remove related assignments and exams
            assignments = assignments.filter(a=>a.subject !== subject);
            exams = exams.filter(x=>x.subject !== subject);
            saveAll();
            updateSubjectsLists();
            updateAssignmentsList();
            updateExamsList();
            updateXPDisplay();
        };
        tag.appendChild(text);
        tag.appendChild(rem);
        subjectsList.appendChild(tag);

        // Add subjects to dropdowns
        const option1 = document.createElement('option');
        option1.value = subject;
        option1.textContent = subject;
        assignmentSubjectSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = subject;
        option2.textContent = subject;
        examSubjectSelect.appendChild(option2);
    });
}

function updateAssignmentsList() {
    const assignmentsList = document.getElementById('assignmentsList');
    assignmentsList.innerHTML = '';
    assignments.forEach((assignment, index) => {
        const p = document.createElement('p');
        p.className = assignment.isComplete ? 'completed-task' : '';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !!assignment.isComplete;
        checkbox.dataset.index = index;
        checkbox.onchange = toggleAssignmentCompletion;

        const textSpan = document.createElement('span');
        textSpan.textContent = ` ${assignment.name} for ${assignment.subject} (${assignment.hoursNeeded || 1}h)`;

        // remove button
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.style.marginLeft = '8px';
        removeBtn.onclick = () => { assignments.splice(index,1); updateAssignmentsList(); saveAll(); };

        p.appendChild(checkbox);
        p.appendChild(textSpan);
        p.appendChild(removeBtn);
        assignmentsList.appendChild(p);
    });
    updateXPDisplay();
}

function updateExamsList() {
    const examsList = document.getElementById('examsList');
    examsList.innerHTML = '';
    exams.forEach((exam, index) => {
        const p = document.createElement('p');
        p.className = exam.isComplete ? 'completed-task' : '';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !!exam.isComplete;
        checkbox.dataset.index = index;
        checkbox.onchange = toggleExamCompletion;

        const textSpan = document.createElement('span');
        textSpan.textContent = ` ${exam.subject} exam on ${exam.date}`;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.style.marginLeft = '8px';
        removeBtn.onclick = () => { exams.splice(index,1); updateExamsList(); saveAll(); };

        p.appendChild(checkbox);
        p.appendChild(textSpan);
        p.appendChild(removeBtn);
        examsList.appendChild(p);
    });
    updateXPDisplay();
}

// Initial update to populate lists if any data exists
loadAll();

// One-time sanitizer: if the only subjects present are known sample values
// and there are no assignments/exams/schedule/xp, assume these were
// pre-populated during development and remove them so the app starts clean.
function sanitizeInitialData(){
    const sampleDefaults = ['Physics','Calculus','Math','Chemistry'];
    const onlySamples = subjects.length > 0
        && subjects.every(s => sampleDefaults.includes(s))
        && assignments.length === 0
        && exams.length === 0
        && scheduleTasks.length === 0
        && xp === 0;
    if (onlySamples){
        subjects = [];
        saveAll();
    }
}
sanitizeInitialData();

updateSubjectsLists();
updateAssignmentsList();
updateExamsList();
updateXPDisplay();

// move the generate logic to a named function so it can be invoked safely
function generateScheduleHandler(){
    // Client-side dynamic scheduler with splitting, ramp-up and persistence
    const dailyHoursInput = document.getElementById('dailyHours');
    const dailyHours = dailyHoursInput.value ? parseFloat(dailyHoursInput.value) : 3;

    // Build exam map from exams array (expects ISO date strings)
    const examMap = {};
    const examDates = [];
    exams.forEach(e => {
        if (e && e.subject && e.date) {
            examMap[e.subject] = new Date(e.date);
            examDates.push(new Date(e.date));
        }
    });

    const today = new Date();
    const startDate = new Date(today.setHours(0,0,0,0));
    const endDate = examDates.length ? new Date(Math.max(...examDates.map(d => d.getTime()))) : new Date(Date.now() + 6*24*60*60*1000);

    // we will create scheduleTasks anew
    scheduleTasks = [];

    const fmt = d => d.toISOString().slice(0,10);

    // Create a map of assignment remaining hours
    const assignMap = {};// id -> remainingHours
    assignments.forEach(a => { assignMap[a.id] = Math.max(0.25, a.hoursNeeded || 1); });

    // helper: days between
    function daysBetween(a,b){ return Math.ceil((b - a)/(1000*60*60*24)); }

    // ramp-up weight: closer to exam gets higher weight. returns multiplier for given subject on date d
    function rampWeightFor(subject, d){
        if (!examMap[subject]) return 1;
        const examDate = new Date(examMap[subject]);
        const totalDays = Math.max(1, daysBetween(startDate, examDate));
        const remaining = Math.max(0, daysBetween(d, examDate));
        // linear ramp: weight ranges 1 (far) .. 2 (on day)
        const w = 1 + ( (totalDays - remaining) / totalDays );
        return Math.max(0.8, Math.min(2, w));
    }

    // For each day, allocate hours according to dailyHours, prioritizing:
    // 1) exam-day review (1h each subject if exam on that day)
    // 2) split assignment hours across available days before exam (try to schedule 1h blocks)
    // 3) study slots distributed among subjects weighted by rampWeight

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate()+1)){
        const dayStr = fmt(new Date(d));
        let capacity = Number.isFinite(dailyHours) && dailyHours > 0 ? Math.floor(dailyHours) : 3;

        // 1) exam-day reviews
        Object.keys(examMap).forEach(subj => {
            const ed = new Date(examMap[subj]);
            if (ed.toDateString() === d.toDateString() && capacity > 0) {
                scheduleTasks.push({ id: genId('s'), date: dayStr, task: `Review for ${subj} exam (exam day)`, type: 'exam-review', subject: subj, examId: exams.find(x=>x.subject===subj)?.id, completed:false, xpGranted:false });
                capacity -= 1;
            }
        });

        // 2) assignments splitting: try to allocate 1h slots for assignments with nearest exam first
        // sort assignments by their exam date (earlier exam -> higher priority)
        const sortable = assignments.map(a => ({a, examT: examMap[a.subject] ? new Date(examMap[a.subject]).getTime() : Infinity }));
        sortable.sort((x,y)=> x.examT - y.examT);

        for (let item of sortable){
            if (capacity <= 0) break;
            const a = item.a;
            const remaining = assignMap[a.id] || 0;
            if (remaining <= 0.001) continue;
            // only schedule assignment work on days up to the exam (if exam exists) or any day if no exam
            const examDate = examMap[a.subject];
            if (examDate && new Date(d) > new Date(examDate)) continue;
            // allocate one hour block
            scheduleTasks.push({ id: genId('s'), date: dayStr, task: `Work on ${a.name} (${a.subject}) (1h)`, type: 'assignment', assignmentId: a.id, completed:false, xpGranted:false });
            assignMap[a.id] = Math.max(0, remaining - 1);
            capacity -= 1;
        }

        // 3) study slots - distribute among subjects weighted by rampWeight
        if (capacity > 0){
            // compute weights
            const subs = subjects.slice();
            if (subs.length === 0) continue;
            const weights = subs.map(s => ({s, w: rampWeightFor(s, new Date(d))}));
            const totalW = weights.reduce((s,x)=>s+x.w,0);
            // choose up to capacity slots by cycling through subjects proportional to weight
            for (let i=0;i<capacity;i++){
                // pick subject by weighted round-robin
                let r = Math.random()*totalW;
                let cum = 0; let chosen = weights[0].s;
                for (const w of weights){ cum += w.w; if (r <= cum){ chosen = w.s; break; } }
                scheduleTasks.push({ id: genId('s'), date: dayStr, task: `Study ${chosen} (1h)`, type: 'study', subject: chosen, completed:false, xpGranted:false });
            }
        }
    }

    // Save schedule and persist
    saveAll();

    // render schedule table with checkboxes to mark completed schedule tasks awarding XP
    const scheduleList = document.getElementById('scheduleList');
    scheduleList.innerHTML = '';

    const grouped = scheduleTasks.reduce((acc,it)=>{ if(!acc[it.date]) acc[it.date]=[]; acc[it.date].push(it); return acc; },{});

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const thDate = document.createElement('th'); thDate.textContent = 'Date'; thDate.style.textAlign='left'; thDate.style.padding='8px';
    const thTasks = document.createElement('th'); thTasks.textContent = 'Tasks'; thTasks.style.textAlign='left'; thTasks.style.padding='8px';
    headerRow.appendChild(thDate); headerRow.appendChild(thTasks); thead.appendChild(headerRow); table.appendChild(thead);

    const tbody = document.createElement('tbody');
    Object.keys(grouped).sort().forEach(dateKey=>{
        const tr = document.createElement('tr');
        const tdDate = document.createElement('td'); tdDate.textContent = dateKey; tdDate.style.padding='8px'; tdDate.style.verticalAlign='top'; tdDate.style.borderTop='1px solid rgba(255,255,255,0.06)';
        const tdTasks = document.createElement('td'); tdTasks.style.padding='8px'; tdTasks.style.borderTop='1px solid rgba(255,255,255,0.06)';

        const ul = document.createElement('ul'); ul.style.margin='0'; ul.style.paddingLeft='1.25rem';
        grouped[dateKey].forEach(taskObj=>{
            const li = document.createElement('li'); li.style.display='flex'; li.style.alignItems='center'; li.style.gap='8px';
            const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = !!taskObj.completed; cb.dataset.id = taskObj.id;
            cb.onchange = (ev)=>{
                const id = ev.target.dataset.id;
                const t = scheduleTasks.find(x=>x.id===id);
                if (!t) return;
                t.completed = ev.target.checked;
                // award XP only once per schedule task
                if (t.completed && !t.xpGranted){ xp += XP_PER_TASK; t.xpGranted = true; }
                if (!t.completed && t.xpGranted){ xp = Math.max(0, xp - XP_PER_TASK); t.xpGranted = false; }
                saveAll();
                updateXPDisplay();
            };
            const span = document.createElement('span'); span.textContent = taskObj.task;
            li.appendChild(cb); li.appendChild(span);
            // link back to assignment or exam (optional jump)
            if (taskObj.type === 'assignment'){
                const link = document.createElement('button'); link.textContent='Goto'; link.className='complete-schedule-task-btn'; link.onclick = ()=>{
                    // find assignment in list and highlight (simple scroll)
                    const idx = assignments.findIndex(x=>x.id===taskObj.assignmentId);
                    if (idx>=0){ updateAssignmentsList(); document.getElementById('assignmentsList').children[idx].scrollIntoView({behavior:'smooth'}); }
                };
                li.appendChild(link);
            }
            ul.appendChild(li);
        });
        tdTasks.appendChild(ul);
        tr.appendChild(tdDate); tr.appendChild(tdTasks); tbody.appendChild(tr);
    });
    table.appendChild(tbody); scheduleList.appendChild(table);
    updateXPDisplay();
}

// wire the Generate button to the named handler (script is loaded at end of page)
const genBtn = document.getElementById('generateScheduleBtn');
if (genBtn) genBtn.addEventListener('click', generateScheduleHandler);

// ----------------------
// Client-side auth demo
// ----------------------

const USERS_KEY = 'sb_users';

function toHex(buffer){
    return Array.from(new Uint8Array(buffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function hashPassword(password){
    const enc = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    return toHex(digest);
}

function loadUsers(){
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch(e){ return {}; }
}
function saveUsers(u){
    try { localStorage.setItem(USERS_KEY, JSON.stringify(u)); } catch(e){ console.warn('Failed saving users', e); }
}

function setCurrentUser(email){
    try { localStorage.setItem(CUR_USER_KEY, email); } catch(e){}
    // load user-specific data into the app
    loadAll();
    updateSubjectsLists();
    updateAssignmentsList();
    updateExamsList();
    updateXPDisplay();
    updateAuthUI();
}
function clearCurrentUser(){
    try { localStorage.removeItem(CUR_USER_KEY); } catch(e){}
    updateAuthUI();
}

async function signupHandler(){
    const email = (document.getElementById('signupEmail').value || '').trim();
    const pass = document.getElementById('signupPassword').value || '';
    const conf = document.getElementById('signupConfirm').value || '';
    const msg = document.getElementById('authMessage');
    msg.textContent = '';
    if (!email || !pass) { msg.textContent = 'Please provide email and password.'; return; }
    if (pass !== conf) { msg.textContent = 'Passwords do not match.'; return; }
    const users = loadUsers();
    if (users[email]) { msg.textContent = 'An account with that email already exists.'; return; }
    const h = await hashPassword(pass);
    users[email] = { passwordHash: h, created: Date.now() };
    saveUsers(users);
    // create empty user-scoped data so this new account starts fresh (resets progress)
    try {
        const usersData = JSON.parse(localStorage.getItem(USERS_DATA_KEY) || '{}');
        usersData[email] = { subjects: [], assignments: [], exams: [], schedule: [], xp: 0 };
        localStorage.setItem(USERS_DATA_KEY, JSON.stringify(usersData));
    } catch(e) { console.warn('Failed to initialize user data', e); }
    setCurrentUser(email);
    msg.style.color = 'lightgreen';
    msg.textContent = 'Account created and signed in.';
    setTimeout(()=>{ closeAuthModal(); msg.style.color=''; msg.textContent=''; }, 900);
}

async function loginHandler(){
    const email = (document.getElementById('loginEmail').value || '').trim();
    const pass = document.getElementById('loginPassword').value || '';
    const msg = document.getElementById('authMessage');
    msg.textContent = '';
    if (!email || !pass) { msg.textContent = 'Please provide email and password.'; return; }
    const users = loadUsers();
    const entry = users[email];
    if (!entry) { msg.textContent = 'No account found for that email.'; return; }
    const h = await hashPassword(pass);
    if (h !== entry.passwordHash) { msg.textContent = 'Incorrect password.'; return; }
    setCurrentUser(email);
    msg.style.color = 'lightgreen';
    msg.textContent = 'Signed in.';
    setTimeout(()=>{ closeAuthModal(); msg.style.color=''; msg.textContent=''; }, 700);
}

function logoutHandler(){
    // save current progress into the current user's storage before logging out
    try { saveAll(); } catch(e){}
    clearCurrentUser();
}

function openAuthModal(){
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    showLoginView();
}
function closeAuthModal(){
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.style.display = 'none';
}

function showLoginView(){
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('authMessage').textContent = '';
}
function showSignupView(){
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
    document.getElementById('authMessage').textContent = '';
}

function updateAuthUI(){
    const display = document.getElementById('userIdDisplay');
    const logoutBtn = document.getElementById('logoutBtn');
    const cur = localStorage.getItem(CUR_USER_KEY);
    if (cur) {
        if (display) display.textContent = `Signed in: ${cur}`;
        if (logoutBtn) logoutBtn.classList.remove('hidden');
    } else {
        if (display) display.textContent = 'Not signed in';
        if (logoutBtn) logoutBtn.classList.add('hidden');
    }
}

// Wire up auth controls
document.addEventListener('DOMContentLoaded', ()=>{
    const authBtn = document.getElementById('authBtn');
    const closeBtn = document.getElementById('closeAuth');
    const showLogin = document.getElementById('showLogin');
    const showSignup = document.getElementById('showSignup');
    const loginSubmit = document.getElementById('loginSubmit');
    const signupSubmit = document.getElementById('signupSubmit');
    const logoutBtn = document.getElementById('logoutBtn');

    if (authBtn) authBtn.addEventListener('click', openAuthModal);
    if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);
    if (showLogin) showLogin.addEventListener('click', showLoginView);
    if (showSignup) showSignup.addEventListener('click', showSignupView);
    if (loginSubmit) loginSubmit.addEventListener('click', loginHandler);
    if (signupSubmit) signupSubmit.addEventListener('click', signupHandler);
    if (logoutBtn) logoutBtn.addEventListener('click', logoutHandler);

    // close modal by clicking outside content
    const modal = document.getElementById('authModal');
    if (modal) modal.addEventListener('click', (e)=>{ if (e.target === modal) closeAuthModal(); });

    updateAuthUI();
});