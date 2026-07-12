document.addEventListener('DOMContentLoaded', () => {
    // Registrazione Service Worker per PWA (Progressive Web App)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('PWA Service Worker registrato con successo:', reg.scope))
                .catch(err => console.error('Errore registrazione Service Worker:', err));
        });
    }

    // =============================================
    // COORDiNATORE PRINCIPALE (ENTRY POINT)
    // =============================================
    const greetingElement = document.getElementById('greeting');
    const dateElement = document.getElementById('current-date');

    // 2. GESTIONE DATA DINAMICA
    const opzioniData = { weekday: 'long', day: 'numeric', month: 'long' };
    const dataFormattata = new Date().toLocaleDateString('it-IT', opzioniData);
    if (dateElement) {
        dateElement.textContent = dataFormattata.charAt(0).toUpperCase() + dataFormattata.slice(1);
    }

    // 3. NAVIGAZIONE PAGINE INTERNE
    const cards = document.querySelectorAll('.card');
    const backButtons = document.querySelectorAll('.btn-back');
    const pages = document.querySelectorAll('.page');
    const topBar = document.querySelector('.top-bar');

    window.switchPage = function(targetPageId) {
        pages.forEach(page => page.classList.remove('active'));

        const targetPage = document.getElementById(targetPageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Nascondi la top-bar nelle pagine interne per maggiore pulizia
        if (topBar) {
            if (targetPageId !== 'dashboard') {
                topBar.style.display = 'none';
            } else {
                topBar.style.display = 'flex';
            }
        }

        if (targetPageId === 'focus-day') {
            if (typeof window.initFocusPage === 'function') {
                window.initFocusPage();
            }
        }
        if (targetPageId === 'storico-palestra') {
            if (typeof window.renderWorkoutHistory === 'function') {
                window.renderWorkoutHistory();
            }
        }
        if (targetPageId === 'viaggi') {
            if (typeof window.renderTrips === 'function') {
                window.renderTrips();
            }
        }
    }

    const allClickableCards = document.querySelectorAll('.card, .app-card');
    allClickableCards.forEach(card => {
        card.addEventListener('click', () => {
            const target = card.getAttribute('data-target');
            if (target) {
                window.switchPage(target);
            }
        });
    });

    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            const backTarget = button.getAttribute('data-back') || 'dashboard';
            window.switchPage(backTarget);
        });
    });

    // 5. GESTIONE DIALOGS DETTAGLIO WIDGET
    const modalMeteo = document.getElementById('modal-meteo');
    const btnCloseMeteo = document.getElementById('btn-close-meteo');
    const weatherPill = document.getElementById('weather-pill');

    const modalTasks = document.getElementById('modal-tasks');
    const btnCloseTasks = document.getElementById('btn-close-tasks');
    const tasksPill = document.getElementById('tasks-pill');

    const modalEvents = document.getElementById('modal-events');
    const btnCloseEvents = document.getElementById('btn-close-events');
    const eventsPill = document.getElementById('events-pill');

    // Meteo Modal
    if (weatherPill && modalMeteo) {
        weatherPill.addEventListener('click', () => {
            modalMeteo.classList.add('active');
        });
    }
    if (btnCloseMeteo && modalMeteo) {
        btnCloseMeteo.addEventListener('click', () => {
            modalMeteo.classList.remove('active');
        });
    }

    // Tasks Modal
    if (tasksPill && modalTasks) {
        tasksPill.addEventListener('click', () => {
            modalTasks.classList.add('active');
        });
    }
    if (btnCloseTasks && modalTasks) {
        btnCloseTasks.addEventListener('click', () => {
            modalTasks.classList.remove('active');
        });
    }

    // Events Modal
    if (eventsPill && modalEvents) {
        eventsPill.addEventListener('click', () => {
            modalEvents.classList.add('active');
        });
    }
    if (btnCloseEvents && modalEvents) {
        btnCloseEvents.addEventListener('click', () => {
            modalEvents.classList.remove('active');
        });
    }

    // Modal Legale / Privacy
    const modalLegal = document.getElementById('modal-legal');
    const btnCloseLegal = document.getElementById('btn-close-legal');
    const btnAgreeLegal = document.getElementById('btn-agree-legal');
    const linksOpenLegal = document.querySelectorAll('.link-open-legal');

    linksOpenLegal.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (modalLegal) modalLegal.classList.add('active');
        });
    });

    if (btnCloseLegal && modalLegal) {
        btnCloseLegal.addEventListener('click', () => {
            modalLegal.classList.remove('active');
        });
    }

    if (btnAgreeLegal && modalLegal) {
        btnAgreeLegal.addEventListener('click', () => {
            modalLegal.classList.remove('active');
        });
    }

    // Chiudere cliccando fuori
    [modalMeteo, modalTasks, modalEvents, document.getElementById('modal-legal')].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }
    });

    // 6. LOGICA DI DETTAGLIO TASK (Oggi)
    const taskListItems = document.getElementById('task-list-items');
    const inputNewTask = document.getElementById('input-new-task');
    const addTaskForm = document.getElementById('add-task-form');
    const tasksCompletedCount = document.getElementById('tasks-completed-count');
    const tasksTotalCount = document.getElementById('tasks-total-count');
    const tasksProgressFill = document.getElementById('tasks-progress-fill');
    const tasksCountDisplay = document.getElementById('tasks-count-display');

    window.renderTasks = function() {
        if (!taskListItems) return;
        taskListItems.innerHTML = '';
        let completed = 0;

        window.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <div class="task-item-left">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                    <span>${task.text}</span>
                </div>
                <button class="btn-delete" data-id="${task.id}" title="Elimina task">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            `;
            taskListItems.appendChild(li);
            if (task.completed) completed++;
        });

        // Aggiorna valori nel modal
        if (tasksCompletedCount) tasksCompletedCount.textContent = completed;
        if (tasksTotalCount) tasksTotalCount.textContent = window.tasks.length;

        // Barra di progresso
        const progressPct = window.tasks.length > 0 ? (completed / window.tasks.length) * 100 : 0;
        if (tasksProgressFill) tasksProgressFill.style.width = `${progressPct}%`;

        // Aggiorna contatore widget sulla dashboard
        const activeCount = window.tasks.length - completed;
        if (tasksCountDisplay) tasksCountDisplay.textContent = activeCount;

        // Persistenza
        localStorage.setItem('hub-tasks', JSON.stringify(window.tasks));

        // Aggiorna anche la vista focus se attiva
        if (typeof window.renderFocusPendingTasks === 'function') {
            window.renderFocusPendingTasks();
        }
    }

    if (taskListItems) {
        taskListItems.addEventListener('change', (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
                const id = parseInt(e.target.getAttribute('data-id'));
                const task = window.tasks.find(t => t.id === id);
                if (task) {
                    task.completed = e.target.checked;
                    window.renderTasks();
                }
            }
        });

        taskListItems.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.btn-delete');
            if (deleteBtn) {
                const id = parseInt(deleteBtn.getAttribute('data-id'));
                window.tasks = window.tasks.filter(t => t.id !== id);
                window.renderTasks();
            }
        });
    }

    if (addTaskForm) {
        addTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = inputNewTask.value.trim();
            if (text) {
                window.tasks.push({
                    id: Date.now(),
                    text: text,
                    completed: false
                });
                inputNewTask.value = '';
                window.renderTasks();
            }
        });
    }

    // 7. LOGICA DI DETTAGLIO IMPEGNI (Timeline)
    const eventsTimelineList = document.getElementById('events-timeline-list');
    const addEventForm = document.getElementById('add-event-form');
    const inputEventTitle = document.getElementById('input-event-title');
    const inputEventTime = document.getElementById('input-event-time');
    const eventsCountDisplay = document.getElementById('events-count-display');

    // Funzione per navigare a un impegno collegato
    window.handleEventLinkClick = function(target) {
        const badge = target.closest('.link-badge');
        if (!badge) return;
        const type = badge.getAttribute('data-type');
        const id = parseInt(badge.getAttribute('data-id'));
        if (type && id) {
            if (type === 'spesa') {
                window.shoppingLists.forEach(list => {
                    list.archived = (list.id !== id);
                });
                localStorage.setItem('hub-shopping-lists', JSON.stringify(window.shoppingLists));
                if (typeof window.renderShopping === 'function') window.renderShopping();
                window.switchPage('spesa');
            } else if (type === 'palestra') {
                window.activeSheetId = id;
                if (typeof window.saveWorkouts === 'function') window.saveWorkouts();
                if (typeof window.renderWorkoutSheets === 'function') window.renderWorkoutSheets();
                if (typeof window.renderActiveWorkoutSheet === 'function') window.renderActiveWorkoutSheet();
                window.switchPage('palestra');
            }
            // Chiudi i modali aperti
            const modalEventsDetail = document.getElementById('modal-events-detail');
            if (modalEventsDetail) modalEventsDetail.classList.remove('active');
        }
    }

    window.renderEvents = function() {
        if (!eventsTimelineList) return;
        eventsTimelineList.innerHTML = '';

        // Filtra impegni che cadono OGGI per il widget della home
        const todayStr = new Date().toISOString().split('T')[0];
        const todayEvents = window.events.filter(ev => todayStr >= ev.date && todayStr <= (ev.endDate || ev.date));

        // Ordina per tempo
        todayEvents.sort((a, b) => {
            if (a.allDay && !b.allDay) return -1;
            if (!a.allDay && b.allDay) return 1;
            const timeA = a.time || '';
            const timeB = b.time || '';
            return timeA.localeCompare(timeB);
        });

        if (todayEvents.length === 0) {
            eventsTimelineList.innerHTML = `
                <div style="font-size: 0.9rem; color: var(--text-secondary); text-align: center; padding: 20px 0;">
                    Nessun impegno per oggi
                </div>
            `;
        } else {
            todayEvents.forEach(event => {
                const div = document.createElement('div');
                div.className = 'event-item';
                
                let linkHtml = '';
                if (event.linkedType === 'spesa') {
                    const lst = window.shoppingLists.find(l => l.id === event.linkedId);
                    const name = lst ? lst.name : 'Spesa';
                    linkHtml = `<span class="link-badge link-spesa" data-type="spesa" data-id="${event.linkedId}" title="Apri Lista Spesa">${name}</span>`;
                } else if (event.linkedType === 'allenamento') {
                    const sheet = window.workoutSheets.find(s => s.id === event.linkedId);
                    const name = sheet ? sheet.name : 'Scheda';
                    linkHtml = `<span class="link-badge link-palestra" data-type="palestra" data-id="${event.linkedId}" title="Apri Scheda Palestra">${name}</span>`;
                } else if (event.linkedType && event.linkedType !== 'generic') {
                    const labels = {
                        'lavoro': 'Lavoro',
                        'studio': 'Studio',
                        'salute': 'Salute',
                        'personale': 'Personale',
                        'tempo-libero': 'Tempo Libero'
                    };
                    const label = labels[event.linkedType] || event.linkedType;
                    linkHtml = `<span class="link-badge badge-${event.linkedType}">${label}</span>`;
                }

                let timeStr = '';
                if (event.allDay) {
                    timeStr = 'Tutto il giorno';
                } else {
                    timeStr = event.time || '';
                    if (event.endTime) {
                        timeStr += ` - ${event.endTime}`;
                    }
                }

                let durationStr = '';
                if (event.endDate && event.endDate !== event.date) {
                    const startParts = event.date.split('-');
                    const endParts = event.endDate.split('-');
                    durationStr = `<span style="font-size: 0.72rem; opacity: 0.7; font-weight: 550; margin-left: 4px;">(${startParts[2]}/${startParts[1]} - ${endParts[2]}/${endParts[1]})</span>`;
                }

                div.innerHTML = `
                    <div class="event-item-left" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span class="event-item-time">${timeStr}</span>
                        ${durationStr}
                        <span class="event-item-title">${event.title}</span>
                        ${linkHtml}
                    </div>
                    <button class="btn-delete" data-id="${event.id}" title="Elimina impegno">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                `;
                
                // Gestore click sul badge
                const badge = div.querySelector('.link-badge');
                if (badge) {
                    badge.addEventListener('click', (e) => {
                        e.stopPropagation();
                        window.handleEventLinkClick(e.target);
                    });
                }

                eventsTimelineList.appendChild(div);
            });
        }

        // Aggiorna contatore widget
        if (eventsCountDisplay) {
            eventsCountDisplay.textContent = todayEvents.length;
        }

        // Persistenza
        localStorage.setItem('hub-events', JSON.stringify(window.events));
        
        // Rerender calendario e focus se siamo sulla pagina per riflettere le modifiche
        const calPage = document.getElementById('calendario');
        if (calPage && calPage.classList.contains('active')) {
            if (typeof window.renderCalendar === 'function') window.renderCalendar(window.currentYear, window.currentMonth);
            if (typeof window.renderSelectedDayEvents === 'function') window.renderSelectedDayEvents();
        }

        if (typeof window.renderFocusTimelineBlocks === 'function') {
            window.renderFocusTimelineBlocks();
        }
    }

    if (eventsTimelineList) {
        eventsTimelineList.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.btn-delete');
            if (deleteBtn) {
                const id = parseInt(deleteBtn.getAttribute('data-id'));
                window.events = window.events.filter(ev => ev.id !== id);
                window.renderEvents();
            }
        });
    }

    if (addEventForm) {
        addEventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = inputEventTitle.value.trim();
            const time = inputEventTime.value;
            if (title && time) {
                window.events.push({
                    id: Date.now(),
                    title: title,
                    time: time,
                    date: new Date().toISOString().split('T')[0],
                    linkedType: null,
                    linkedId: null
                });
                inputEventTitle.value = '';
                inputEventTime.value = '';
                window.renderEvents();
            }
        });
    }

    // Inizializzazione globale di tutte le micro app all'avvio
    if (typeof window.loadSettings === 'function') window.loadSettings();
    window.renderTasks();
    window.renderEvents();
    if (typeof window.renderShopping === 'function') window.renderShopping();
    if (typeof window.renderWorkoutSheets === 'function') window.renderWorkoutSheets();
    if (typeof window.renderActiveWorkoutSheet === 'function') window.renderActiveWorkoutSheet();
});
