document.addEventListener('DOMContentLoaded', () => {
    // 11. LOGICA GIORNATA FOCUS
    const focusTodayDateLabel = document.getElementById('focus-today-date-label');
    const focusBlocksContainer = document.getElementById('focus-blocks-container');
    const focusLiveLine = document.getElementById('focus-live-line');
    const focusAddBlockForm = document.getElementById('focus-add-block-form');
    const inputFocusBlockTitle = document.getElementById('input-focus-block-title');
    const inputFocusBlockStart = document.getElementById('input-focus-block-start');
    const inputFocusBlockEnd = document.getElementById('input-focus-block-end');
    const selectFocusBlockCategory = document.getElementById('select-focus-block-category');
    const inputFocusBlockNotes = document.getElementById('input-focus-block-notes');
    
    const focusLinkSpesaGroup = document.getElementById('focus-link-spesa-group');
    const selectFocusLinkSpesa = document.getElementById('select-focus-link-spesa');
    const focusLinkPalestraGroup = document.getElementById('focus-link-palestra-group');
    const selectFocusLinkPalestra = document.getElementById('select-focus-link-palestra');
    
    const focusStatisticsContainer = document.getElementById('focus-statistics-container');
    const focusPendingTasksList = document.getElementById('focus-pending-tasks-list');

    // Nuovi controlli data per la timeline
    let focusSelectedDate = new Date().toISOString().split('T')[0];
    const btnFocusPrevDay = document.getElementById('btn-focus-prev-day');
    const btnFocusNextDay = document.getElementById('btn-focus-next-day');
    const btnFocusCalendar = document.getElementById('btn-focus-calendar');
    const focusDatePicker = document.getElementById('focus-date-picker');

    function updateFocusPageForDate() {
        if (focusTodayDateLabel) {
            const options = { weekday: 'long', day: 'numeric', month: 'long' };
            const dateObj = new Date(focusSelectedDate + 'T00:00:00');
            const dataStr = dateObj.toLocaleDateString('it-IT', options);
            focusTodayDateLabel.textContent = dataStr.charAt(0).toUpperCase() + dataStr.slice(1);
        }
        if (focusDatePicker) {
            focusDatePicker.value = focusSelectedDate;
        }
        updateFocusLiveLine();
        window.renderFocusTimelineBlocks();
        renderFocusStatistics();
    }

    if (btnFocusPrevDay) {
        btnFocusPrevDay.addEventListener('click', () => {
            const d = new Date(focusSelectedDate + 'T00:00:00');
            d.setDate(d.getDate() - 1);
            focusSelectedDate = d.toISOString().split('T')[0];
            updateFocusPageForDate();
        });
    }

    if (btnFocusNextDay) {
        btnFocusNextDay.addEventListener('click', () => {
            const d = new Date(focusSelectedDate + 'T00:00:00');
            d.setDate(d.getDate() + 1);
            focusSelectedDate = d.toISOString().split('T')[0];
            updateFocusPageForDate();
        });
    }

    if (focusDatePicker) {
        focusDatePicker.addEventListener('change', (e) => {
            if (e.target.value) {
                focusSelectedDate = e.target.value;
                updateFocusPageForDate();
                focusDatePicker.blur();
            }
        });
    }

    window.initFocusPage = function() {
        // Ripristina la data odierna all'apertura principale della sezione
        focusSelectedDate = new Date().toISOString().split('T')[0];
        updateFocusPageForDate();

        const now = new Date();
        const curH = now.getHours();
        if (inputFocusBlockStart && !inputFocusBlockStart.value) {
            const startH = Math.max(7, Math.min(22, curH));
            inputFocusBlockStart.value = `${startH.toString().padStart(2, '0')}:00`;
            if (inputFocusBlockEnd) {
                inputFocusBlockEnd.value = `${(startH + 1).toString().padStart(2, '0')}:00`;
            }
        }

        renderTimelineGrid();
        window.renderFocusPendingTasks();
        populateFocusConditionalSelects();
    }

    function renderTimelineGrid() {
        const gridContainer = document.querySelector('#focus-day .timeline-grid');
        if (!gridContainer) return;
        gridContainer.innerHTML = '';
        for (let h = 7; h <= 23; h++) {
            const row = document.createElement('div');
            row.className = 'timeline-hour-row';
            row.innerHTML = `<span class="timeline-hour-label">${h.toString().padStart(2, '0')}:00</span>`;
            gridContainer.appendChild(row);
        }
    }

    function updateFocusLiveLine() {
        if (!focusLiveLine) return;
        const now = new Date();
        const curDateStr = now.toISOString().split('T')[0];
        
        if (curDateStr !== focusSelectedDate) {
            focusLiveLine.style.display = 'none';
            return;
        }

        const h = now.getHours();
        const m = now.getMinutes();
        if (h >= 7 && h < 23) {
            const topPx = (h - 7) * 60 + m;
            focusLiveLine.style.top = `${topPx}px`;
            focusLiveLine.style.display = 'block';
        } else {
            focusLiveLine.style.display = 'none';
        }
    }

    setInterval(() => {
        const calPage = document.getElementById('focus-day');
        if (calPage && calPage.classList.contains('active')) {
            updateFocusLiveLine();
        }
    }, 60000);

    function populateFocusConditionalSelects() {
        const cat = selectFocusBlockCategory ? selectFocusBlockCategory.value : 'lavoro';
        
        if (focusLinkSpesaGroup) focusLinkSpesaGroup.style.display = 'none';
        if (focusLinkPalestraGroup) focusLinkPalestraGroup.style.display = 'none';

        if (cat === 'spesa') {
            if (focusLinkSpesaGroup) focusLinkSpesaGroup.style.display = 'flex';
            if (selectFocusLinkSpesa) {
                selectFocusLinkSpesa.innerHTML = '';
                if (window.shoppingLists.length === 0) {
                    const option = document.createElement('option');
                    option.textContent = "Nessuna lista creata";
                    option.value = "";
                    selectFocusLinkSpesa.appendChild(option);
                } else {
                    window.shoppingLists.forEach(list => {
                        const option = document.createElement('option');
                        option.value = list.id;
                        option.textContent = list.name;
                        if (!list.archived) option.selected = true;
                        selectFocusLinkSpesa.appendChild(option);
                    });
                }
            }
        } else if (cat === 'allenamento') {
            if (focusLinkPalestraGroup) focusLinkPalestraGroup.style.display = 'flex';
            if (selectFocusLinkPalestra) {
                selectFocusLinkPalestra.innerHTML = '';
                if (window.workoutSheets.length === 0) {
                    const option = document.createElement('option');
                    option.textContent = "Nessuna scheda creata";
                    option.value = "";
                    selectFocusLinkPalestra.appendChild(option);
                } else {
                    window.workoutSheets.forEach(sheet => {
                        const option = document.createElement('option');
                        option.value = sheet.id;
                        option.textContent = sheet.name;
                        if (sheet.id === window.activeSheetId) option.selected = true;
                        selectFocusLinkPalestra.appendChild(option);
                    });
                }
            }
        }
    }

    if (selectFocusBlockCategory) {
        selectFocusBlockCategory.addEventListener('change', populateFocusConditionalSelects);
    }

    window.renderFocusTimelineBlocks = function() {
        if (!focusBlocksContainer) return;
        focusBlocksContainer.innerHTML = '';

        const todayStr = focusSelectedDate;
        const todayEvents = window.events.filter(ev => todayStr >= ev.date && todayStr <= (ev.endDate || ev.date) && !ev.allDay && ev.time);

        todayEvents.forEach(event => {
            const startParts = event.time.split(':');
            const startH = parseInt(startParts[0]);
            const startM = parseInt(startParts[1]);
            
            let endH = startH + 1;
            let endM = startM;
            if (event.endTime) {
                const endParts = event.endTime.split(':');
                endH = parseInt(endParts[0]);
                endM = parseInt(endParts[1]);
            }

            let startMin = startH * 60 + startM;
            let endMin = endH * 60 + endM;
            
            startMin = Math.max(7 * 60, Math.min(23 * 60, startMin));
            endMin = Math.max(7 * 60, Math.min(23 * 60, endMin));
            if (endMin <= startMin) endMin = startMin + 30;

            const topPx = startMin - 7 * 60;
            const heightPx = endMin - startMin;

            const block = document.createElement('div');
            const category = event.linkedType || 'generic';
            const isCompact = heightPx < 45;
            block.className = `timeline-block block-${category}${isCompact ? ' block-compact' : ''}`;
            block.style.cssText = `top: ${topPx}px; height: ${heightPx}px;`;

            let badgeHtml = '';
            if (!isCompact && heightPx >= 75) {
                if (event.linkedType === 'spesa') {
                    const lst = window.shoppingLists.find(l => l.id === event.linkedId);
                    const name = lst ? lst.name : 'Spesa';
                    badgeHtml = `<span class="timeline-block-badge" style="background: rgba(52,199,89,0.1); color: #34c759;">Spesa: ${name}</span>`;
                } else if (event.linkedType === 'allenamento') {
                    const sheet = window.workoutSheets.find(s => s.id === event.linkedId);
                    const name = sheet ? sheet.name : 'Scheda';
                    badgeHtml = `<span class="timeline-block-badge" style="background: rgba(0,122,255,0.1); color: #007aff;">Palestra: ${name}</span>`;
                } else if (event.linkedType && event.linkedType !== 'generic') {
                    const labels = {
                        'lavoro': 'Lavoro',
                        'studio': 'Studio',
                        'salute': 'Salute',
                        'personale': 'Personale',
                        'tempo-libero': 'Relax'
                    };
                    const label = labels[event.linkedType] || event.linkedType;
                    badgeHtml = `<span class="timeline-block-badge" style="background: rgba(0,0,0,0.06); color: inherit;">${label}</span>`;
                }
            }

            if (isCompact) {
                block.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 6px; width: calc(100% - 32px); overflow: hidden; white-space: nowrap; height: 100%;">
                        <span class="timeline-block-time" style="font-size: 0.7rem; font-weight: 600; flex-shrink: 0; margin: 0; color: inherit;">${event.time}</span>
                        <span class="timeline-block-title" style="font-size: 0.72rem; font-weight: 600; text-overflow: ellipsis; overflow: hidden; margin: 0; color: inherit;">${event.title}</span>
                    </div>
                    <div style="position: absolute; right: 6px; top: 50%; transform: translateY(-50%); display: flex; gap: 4px; align-items: center; color: inherit;">
                        <button class="btn-edit-block" data-id="${event.id}" title="Modifica blocco" style="background: transparent; border: none; cursor: pointer; color: inherit; display: flex; align-items: center; justify-content: center; width: 14px; height: 14px;">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-delete-block" data-id="${event.id}" title="Elimina blocco" style="background: transparent; border: none; cursor: pointer; color: inherit; display: flex; align-items: center; justify-content: center; width: 14px; height: 14px;">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                `;
            } else {
                const notesHtml = event.notes ? `<div class="timeline-block-notes" style="font-size: 0.75rem; opacity: 0.85; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; color: inherit; line-height: 1.2;">${event.notes}</div>` : '';
                block.innerHTML = `
                    <span class="timeline-block-time">${event.time}${event.endTime ? ` - ${event.endTime}` : ''}</span>
                    <span class="timeline-block-title" style="display: block;">${event.title}</span>
                    ${badgeHtml}
                    ${notesHtml}
                    <div style="position: absolute; right: 8px; top: 6px; display: flex; gap: 6px; align-items: center; color: inherit;">
                        <button class="btn-edit-block" data-id="${event.id}" title="Modifica blocco" style="background: transparent; border: none; cursor: pointer; color: inherit; display: flex; align-items: center; justify-content: center; width: 18px; height: 18px;">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-delete-block" data-id="${event.id}" title="Elimina blocco" style="background: transparent; border: none; cursor: pointer; color: inherit; display: flex; align-items: center; justify-content: center; width: 18px; height: 18px;">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                `;
            }

            block.addEventListener('click', (e) => {
                if (e.target.closest('.btn-delete-block') || e.target.closest('.btn-edit-block')) return;
                
                if (event.linkedType === 'spesa' && event.linkedId) {
                    window.shoppingLists.forEach(list => list.archived = (list.id !== event.linkedId));
                    localStorage.setItem('hub-shopping-lists', JSON.stringify(window.shoppingLists));
                    if (typeof window.syncData === 'function') {
                        window.syncData('shopping_lists');
                    }
                    if (typeof window.renderShopping === 'function') {
                        window.renderShopping();
                    }
                    window.switchPage('spesa');
                } else if (event.linkedType === 'allenamento' && event.linkedId) {
                    window.activeSheetId = event.linkedId;
                    if (typeof window.saveWorkouts === 'function') window.saveWorkouts();
                    if (typeof window.renderWorkoutSheets === 'function') window.renderWorkoutSheets();
                    if (typeof window.renderActiveWorkoutSheet === 'function') window.renderActiveWorkoutSheet();
                    window.switchPage('palestra');
                } else {
                    // Cliccando su un blocco generico, lo carica in modifica
                    startEditingBlock(event);
                }
            });

            block.querySelector('.btn-edit-block').addEventListener('click', (e) => {
                e.stopPropagation();
                startEditingBlock(event);
            });

            block.querySelector('.btn-delete-block').addEventListener('click', (e) => {
                e.stopPropagation();
                window.events = window.events.filter(ev => ev.id !== event.id);
                if (typeof window.renderEvents === 'function') {
                    window.renderEvents();
                }
                window.renderFocusTimelineBlocks();
                renderFocusStatistics();
            });

            focusBlocksContainer.appendChild(block);
        });
    }

    function renderFocusStatistics() {
        if (!focusStatisticsContainer) return;
        focusStatisticsContainer.innerHTML = '';

        const todayStr = focusSelectedDate;
        const todayEvents = window.events.filter(ev => todayStr >= ev.date && todayStr <= (ev.endDate || ev.date) && !ev.allDay && ev.time);

        const stats = {
            'lavoro': 0,
            'studio': 0,
            'salute': 0,
            'personale': 0,
            'tempo-libero': 0,
            'spesa': 0,
            'allenamento': 0,
            'generic': 0
        };

        let totalMinutes = 0;

        todayEvents.forEach(event => {
            const startParts = event.time.split(':');
            const startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            
            let endH = parseInt(startParts[0]) + 1;
            let endM = parseInt(startParts[1]);
            if (event.endTime) {
                const endParts = event.endTime.split(':');
                endH = parseInt(endParts[0]);
                endM = parseInt(endParts[1]);
            }
            let endMin = endH * 60 + endM;
            if (endMin <= startMin) endMin = startMin + 30;

            const diff = endMin - startMin;
            const cat = event.linkedType || 'generic';
            if (stats[cat] !== undefined) {
                stats[cat] += diff;
                totalMinutes += diff;
            }
        });

        const categoryLabels = {
            'lavoro': 'Lavoro',
            'studio': 'Studio',
            'salute': 'Salute',
            'personale': 'Personale',
            'tempo-libero': 'Relax',
            'spesa': 'Spesa',
            'allenamento': 'Palestra',
            'generic': 'Generico'
        };

        if (totalMinutes === 0) {
            focusStatisticsContainer.innerHTML = `
                <div style="font-size: 0.82rem; color: var(--text-secondary); text-align: center; padding: 10px 0;">
                    Nessun blocco temporizzato per oggi. Aggiungi attività per vedere le statistiche di focus.
                </div>
            `;
            return;
        }

        Object.keys(stats).forEach(cat => {
            const mins = stats[cat];
            if (mins === 0) return;

            const pct = Math.round((mins / totalMinutes) * 100);
            const label = categoryLabels[cat] || cat;

            const row = document.createElement('div');
            row.className = 'focus-stat-row';
            row.innerHTML = `
                <div class="focus-stat-info">
                    <span>${label}</span>
                    <span>${mins} min (${pct}%)</span>
                </div>
                <div class="focus-stat-track">
                    <div class="focus-stat-fill fill-${cat}" style="width: ${pct}%;"></div>
                </div>
            `;
            focusStatisticsContainer.appendChild(row);
        });
    }

    window.renderFocusPendingTasks = function() {
        if (!focusPendingTasksList) return;
        focusPendingTasksList.innerHTML = '';

        const pendingTasks = window.tasks.filter(t => !t.completed);

        if (pendingTasks.length === 0) {
            focusPendingTasksList.innerHTML = `
                <li style="font-size: 0.82rem; color: var(--text-secondary); text-align: center; padding: 20px 0;">
                    Tutti i task completati!
                </li>
            `;
            return;
        }

        pendingTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-radius: 10px; background: rgba(255,255,255,0.15); border: 1px solid var(--glass-border);";
            li.innerHTML = `
                <span style="font-size: 0.85rem; color: var(--text-primary); font-weight: 500;">${task.text}</span>
                <button class="btn-schedule-task" data-title="${task.text}" title="Pianifica nella timeline" style="background: rgba(52,199,89,0.08); color: #34c759; border: none; padding: 4px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; cursor: pointer;">
                    + Pianifica
                </button>
            `;

            li.querySelector('.btn-schedule-task').addEventListener('click', (e) => {
                const title = e.target.getAttribute('data-title');
                if (inputFocusBlockTitle) {
                    inputFocusBlockTitle.value = title;
                    inputFocusBlockTitle.focus();
                    inputFocusBlockTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });

            focusPendingTasksList.appendChild(li);
        });
    }

    // Gestione bottoni Annulla e Modifica nel Form del Focus
    const btnCancelEditBlock = document.getElementById('btn-cancel-edit-block');
    const btnSaveFocusBlock = document.getElementById('btn-save-focus-block');

    function resetFocusForm() {
        if (focusAddBlockForm) delete focusAddBlockForm.dataset.editingId;
        inputFocusBlockTitle.value = '';
        if (inputFocusBlockNotes) inputFocusBlockNotes.value = '';
        
        // Imposta orario iniziale predefinito (fine dell'ultimo blocco o 09:00)
        inputFocusBlockStart.value = '09:00';
        inputFocusBlockEnd.value = '10:00';
        
        selectFocusBlockCategory.value = 'lavoro';
        if (focusLinkSpesaGroup) focusLinkSpesaGroup.style.display = 'none';
        if (focusLinkPalestraGroup) focusLinkPalestraGroup.style.display = 'none';

        if (btnCancelEditBlock) btnCancelEditBlock.style.display = 'none';
        if (btnSaveFocusBlock) btnSaveFocusBlock.textContent = 'Aggiungi Blocco';
    }

    if (btnCancelEditBlock) {
        btnCancelEditBlock.addEventListener('click', resetFocusForm);
    }

    function startEditingBlock(event) {
        if (!focusAddBlockForm) return;
        focusAddBlockForm.dataset.editingId = event.id;
        inputFocusBlockTitle.value = event.title;
        inputFocusBlockStart.value = event.time;
        inputFocusBlockEnd.value = event.endTime || '';
        if (inputFocusBlockNotes) inputFocusBlockNotes.value = event.notes || '';

        const type = event.linkedType || 'generic';
        selectFocusBlockCategory.value = type;

        // Trigger visualizzazione pannelli collegati
        if (type === 'spesa') {
            if (focusLinkSpesaGroup) focusLinkSpesaGroup.style.display = 'flex';
            if (focusLinkPalestraGroup) focusLinkPalestraGroup.style.display = 'none';
            if (selectFocusLinkSpesa) selectFocusLinkSpesa.value = event.linkedId || '';
        } else if (type === 'allenamento') {
            if (focusLinkSpesaGroup) focusLinkSpesaGroup.style.display = 'none';
            if (focusLinkPalestraGroup) focusLinkPalestraGroup.style.display = 'flex';
            if (selectFocusLinkPalestra) selectFocusLinkPalestra.value = event.linkedId || '';
        } else {
            if (focusLinkSpesaGroup) focusLinkSpesaGroup.style.display = 'none';
            if (focusLinkPalestraGroup) focusLinkPalestraGroup.style.display = 'none';
        }

        if (btnCancelEditBlock) btnCancelEditBlock.style.display = 'inline-block';
        if (btnSaveFocusBlock) btnSaveFocusBlock.textContent = 'Salva Modifiche';

        // Scrolla l'input in evidenza
        focusAddBlockForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (focusAddBlockForm) {
        focusAddBlockForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = inputFocusBlockTitle.value.trim();
            const startVal = inputFocusBlockStart.value;
            const endVal = inputFocusBlockEnd.value;
            const type = selectFocusBlockCategory.value;
            const notes = inputFocusBlockNotes ? inputFocusBlockNotes.value.trim() : '';

            if (title && startVal && endVal) {
                let linkedType = null;
                let linkedId = null;

                if (type === 'spesa' && selectFocusLinkSpesa.value) {
                    linkedType = 'spesa';
                    linkedId = parseInt(selectFocusLinkSpesa.value);
                } else if (type === 'allenamento' && selectFocusLinkPalestra.value) {
                    linkedType = 'allenamento';
                    linkedId = parseInt(selectFocusLinkPalestra.value);
                } else if (type !== 'generic') {
                    linkedType = type;
                    linkedId = null;
                }

                const editingId = focusAddBlockForm.dataset.editingId;
                if (editingId) {
                    // Modifica blocco esistente
                    const eventIndex = window.events.findIndex(ev => ev.id === parseInt(editingId));
                    if (eventIndex !== -1) {
                        window.events[eventIndex] = {
                            ...window.events[eventIndex],
                            title: title,
                            time: startVal,
                            endTime: endVal,
                            notes: notes,
                            linkedType: linkedType,
                            linkedId: linkedId
                        };
                    }
                    resetFocusForm();
                } else {
                    // Aggiungi nuovo blocco
                    window.events.push({
                        id: Date.now(),
                        title: title,
                        time: startVal,
                        endTime: endVal,
                        date: focusSelectedDate,
                        notes: notes,
                        linkedType: linkedType,
                        linkedId: linkedId,
                        allDay: false
                    });

                    inputFocusBlockTitle.value = '';
                    inputFocusBlockStart.value = endVal;
                    const endParts = endVal.split(':');
                    const nextHour = (parseInt(endParts[0]) + 1).toString().padStart(2, '0');
                    inputFocusBlockEnd.value = `${nextHour}:${endParts[1]}`;
                    
                    selectFocusBlockCategory.value = 'lavoro';
                    if (focusLinkSpesaGroup) focusLinkSpesaGroup.style.display = 'none';
                    if (focusLinkPalestraGroup) focusLinkPalestraGroup.style.display = 'none';
                }

                if (typeof window.renderEvents === 'function') {
                    window.renderEvents();
                }
                window.renderFocusTimelineBlocks();
                renderFocusStatistics();
            }
        });
    }

    const cardFocusDay = document.querySelector('.app-card[data-target="focus-day"]');
    if (cardFocusDay) {
        cardFocusDay.addEventListener('click', () => {
            window.initFocusPage();
        });
    }
});
