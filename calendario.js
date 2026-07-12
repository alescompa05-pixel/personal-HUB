document.addEventListener('DOMContentLoaded', () => {
    // 10. LOGICA CALENDARIO INTELLIGENTE
    let calendarDate = new Date();
    window.currentYear = calendarDate.getFullYear();
    window.currentMonth = calendarDate.getMonth();
    window.selectedDateStr = new Date().toISOString().split('T')[0];

    const monthsIt = [
        "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
        "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];

    const btnPrevMonth = document.getElementById('btn-prev-month');
    const btnNextMonth = document.getElementById('btn-next-month');
    const calendarCurrentMonthYear = document.getElementById('calendar-current-month-year');
    const calendarDaysGrid = document.getElementById('calendar-days-grid');
    const calendarSelectedDateLabel = document.getElementById('calendar-selected-date-label');
    const calendarSelectedDayEvents = document.getElementById('calendar-selected-day-events');
    const calendarAddEventForm = document.getElementById('calendar-add-event-form');
    
    const inputCalendarEventTitle = document.getElementById('input-calendar-event-title');
    const inputCalendarEventTime = document.getElementById('input-calendar-event-time');
    const selectCalendarEventType = document.getElementById('select-calendar-event-type');
    const calendarLinkSpesaGroup = document.getElementById('calendar-link-spesa-group');
    const selectCalendarLinkSpesa = document.getElementById('select-calendar-link-spesa');
    const calendarLinkPalestraGroup = document.getElementById('calendar-link-palestra-group');
    const selectCalendarLinkPalestra = document.getElementById('select-calendar-link-palestra');

    const inputCalendarEventAllDay = document.getElementById('input-calendar-event-allday');
    const inputCalendarEventMultiDay = document.getElementById('input-calendar-event-multiday');
    const calendarDateRangeGroup = document.getElementById('calendar-date-range-group');
    const inputCalendarEventStartDate = document.getElementById('input-calendar-event-start-date');
    const inputCalendarEventEndDate = document.getElementById('input-calendar-event-end-date');
    const calendarTimeRangeGroup = document.getElementById('calendar-time-range-group');
    const inputCalendarEventEndTime = document.getElementById('input-calendar-event-end-time');

    window.renderCalendar = function(year, month) {
        if (!calendarDaysGrid || !calendarCurrentMonthYear) return;
        calendarDaysGrid.innerHTML = '';
        
        calendarCurrentMonthYear.textContent = `${monthsIt[month]} ${year}`;

        const firstDayIndex = new Date(year, month, 1).getDay();
        let startDayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Padding celle vuote inizio mese
        for (let i = 0; i < startDayOffset; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day empty';
            calendarDaysGrid.appendChild(emptyDiv);
        }

        const todayISO = new Date().toISOString().split('T')[0];

        // Celle giorni del mese
        for (let d = 1; d <= daysInMonth; d++) {
            const cellDateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = d;

            if (cellDateStr === todayISO) {
                dayDiv.classList.add('today');
            }
            if (cellDateStr === window.selectedDateStr) {
                dayDiv.classList.add('active');
            }

            const hasEvents = window.events.some(ev => cellDateStr >= ev.date && cellDateStr <= (ev.endDate || ev.date));
            if (hasEvents) {
                const dot = document.createElement('span');
                dot.className = 'event-dot';
                dayDiv.appendChild(dot);
            }

            dayDiv.addEventListener('click', () => {
                window.selectedDateStr = cellDateStr;
                
                const allDays = calendarDaysGrid.querySelectorAll('.calendar-day');
                allDays.forEach(cell => cell.classList.remove('active'));
                dayDiv.classList.add('active');

                window.updateSelectedDayLabel();
                window.renderSelectedDayEvents();
            });

            calendarDaysGrid.appendChild(dayDiv);
        }
    }

    window.updateSelectedDayLabel = function() {
        if (!calendarSelectedDateLabel) return;
        const parts = window.selectedDateStr.split('-');
        calendarSelectedDateLabel.textContent = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    window.renderSelectedDayEvents = function() {
        if (!calendarSelectedDayEvents) return;
        calendarSelectedDayEvents.innerHTML = '';

        const dayEvents = window.events.filter(ev => window.selectedDateStr >= ev.date && window.selectedDateStr <= (ev.endDate || ev.date));
        dayEvents.sort((a, b) => {
            if (a.allDay && !b.allDay) return -1;
            if (!a.allDay && b.allDay) return 1;
            const timeA = a.time || '';
            const timeB = b.time || '';
            return timeA.localeCompare(timeB);
        });

        if (dayEvents.length === 0) {
            calendarSelectedDayEvents.innerHTML = `
                <li style="font-size: 0.9rem; color: var(--text-secondary); text-align: center; padding: 20px 0;">
                    Nessun impegno pianificato per questo giorno
                </li>
            `;
            return;
        }

        dayEvents.forEach(event => {
            const li = document.createElement('li');
            li.className = 'event-item';
            li.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 12px; background: rgba(255,255,255,0.2); border: 1px solid var(--glass-border);";

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

            li.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="font-size: 0.85rem; font-weight: 600; color: var(--apple-blue);">${timeStr}</span>
                    ${durationStr}
                    <span style="font-size: 0.9rem; font-weight: 550; color: var(--text-primary);">${event.title}</span>
                    ${linkHtml}
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="btn-edit" data-id="${event.id}" title="Modifica impegno" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-delete" data-id="${event.id}" title="Elimina impegno" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;

            const badge = li.querySelector('.link-badge');
            if (badge) {
                badge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (typeof window.handleEventLinkClick === 'function') {
                        window.handleEventLinkClick(e.target);
                    }
                });
            }

            li.querySelector('.btn-edit').addEventListener('click', (e) => {
                e.stopPropagation();
                startEditingEvent(event);
            });

            li.querySelector('.btn-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                window.events = window.events.filter(ev => ev.id !== event.id);
                if (typeof window.renderEvents === 'function') {
                    window.renderEvents();
                }
                window.renderCalendar(window.currentYear, window.currentMonth);
                window.renderSelectedDayEvents();
            });

            calendarSelectedDayEvents.appendChild(li);
        });
    }

    if (btnPrevMonth) {
        btnPrevMonth.addEventListener('click', () => {
            window.currentMonth--;
            if (window.currentMonth < 0) {
                window.currentMonth = 11;
                window.currentYear--;
            }
            window.renderCalendar(window.currentYear, window.currentMonth);
        });
    }

    if (btnNextMonth) {
        btnNextMonth.addEventListener('click', () => {
            window.currentMonth++;
            if (window.currentMonth > 11) {
                window.currentMonth = 0;
                window.currentYear++;
            }
            window.renderCalendar(window.currentYear, window.currentMonth);
        });
    }

    if (selectCalendarEventType) {
        selectCalendarEventType.addEventListener('change', () => {
            const val = selectCalendarEventType.value;
            
            if (calendarLinkSpesaGroup) calendarLinkSpesaGroup.style.display = 'none';
            if (calendarLinkPalestraGroup) calendarLinkPalestraGroup.style.display = 'none';

            if (val === 'spesa') {
                if (calendarLinkSpesaGroup) calendarLinkSpesaGroup.style.display = 'flex';
                if (selectCalendarLinkSpesa) {
                    selectCalendarLinkSpesa.innerHTML = '';
                    if (window.shoppingLists.length === 0) {
                        const option = document.createElement('option');
                        option.textContent = "Nessuna lista creata";
                        option.value = "";
                        selectCalendarLinkSpesa.appendChild(option);
                    } else {
                        window.shoppingLists.forEach(list => {
                            const option = document.createElement('option');
                            option.value = list.id;
                            option.textContent = list.name;
                            if (!list.archived) option.selected = true;
                            selectCalendarLinkSpesa.appendChild(option);
                        });
                    }
                }
            } else if (val === 'allenamento') {
                if (calendarLinkPalestraGroup) calendarLinkPalestraGroup.style.display = 'flex';
                if (selectCalendarLinkPalestra) {
                    selectCalendarLinkPalestra.innerHTML = '';
                    if (window.workoutSheets.length === 0) {
                        const option = document.createElement('option');
                        option.textContent = "Nessuna scheda creata";
                        option.value = "";
                        selectCalendarLinkPalestra.appendChild(option);
                    } else {
                        window.workoutSheets.forEach(sheet => {
                            const option = document.createElement('option');
                            option.value = sheet.id;
                            option.textContent = sheet.name;
                            if (sheet.id === window.activeSheetId) option.selected = true;
                            selectCalendarLinkPalestra.appendChild(option);
                        });
                    }
                }
            }
        });
    }

    // Gestione checkboxes del form
    if (inputCalendarEventAllDay) {
        inputCalendarEventAllDay.addEventListener('change', () => {
            const isAllDay = inputCalendarEventAllDay.checked;
            if (isAllDay) {
                if (calendarTimeRangeGroup) calendarTimeRangeGroup.style.display = 'none';
                if (inputCalendarEventTime) inputCalendarEventTime.removeAttribute('required');
            } else {
                if (calendarTimeRangeGroup) calendarTimeRangeGroup.style.display = 'grid';
                if (inputCalendarEventTime) inputCalendarEventTime.setAttribute('required', 'true');
            }
        });
    }

    if (inputCalendarEventMultiDay) {
        inputCalendarEventMultiDay.addEventListener('change', () => {
            const isMultiDay = inputCalendarEventMultiDay.checked;
            if (isMultiDay) {
                if (calendarDateRangeGroup) calendarDateRangeGroup.style.display = 'grid';
                if (inputCalendarEventStartDate) inputCalendarEventStartDate.value = window.selectedDateStr;
                if (inputCalendarEventEndDate) inputCalendarEventEndDate.value = window.selectedDateStr;
            } else {
                if (calendarDateRangeGroup) calendarDateRangeGroup.style.display = 'none';
            }
        });
    }

    // Gestione bottoni Annulla e Modifica nel Form del Calendario
    const btnCancelEditEvent = document.getElementById('btn-cancel-edit-event');
    const btnSaveCalendarEvent = document.getElementById('btn-save-calendar-event');

    function resetCalendarForm() {
        if (calendarAddEventForm) delete calendarAddEventForm.dataset.editingId;
        inputCalendarEventTitle.value = '';
        if (inputCalendarEventTime) inputCalendarEventTime.value = '';
        if (inputCalendarEventEndTime) inputCalendarEventEndTime.value = '';
        selectCalendarEventType.value = 'generic';
        if (inputCalendarEventAllDay) inputCalendarEventAllDay.checked = false;
        if (inputCalendarEventMultiDay) inputCalendarEventMultiDay.checked = false;
        
        if (calendarTimeRangeGroup) calendarTimeRangeGroup.style.display = 'grid';
        if (inputCalendarEventTime) inputCalendarEventTime.setAttribute('required', 'true');
        if (calendarDateRangeGroup) calendarDateRangeGroup.style.display = 'none';
        if (calendarLinkSpesaGroup) calendarLinkSpesaGroup.style.display = 'none';
        if (calendarLinkPalestraGroup) calendarLinkPalestraGroup.style.display = 'none';

        if (btnCancelEditEvent) btnCancelEditEvent.style.display = 'none';
        if (btnSaveCalendarEvent) btnSaveCalendarEvent.textContent = 'Aggiungi Impegno';
    }

    if (btnCancelEditEvent) {
        btnCancelEditEvent.addEventListener('click', resetCalendarForm);
    }

    function startEditingEvent(event) {
        if (!calendarAddEventForm) return;
        calendarAddEventForm.dataset.editingId = event.id;
        inputCalendarEventTitle.value = event.title;
        
        const type = event.linkedType || 'generic';
        selectCalendarEventType.value = type;
        
        // Trigger visualizzazione pannelli collegati
        if (type === 'spesa') {
            if (calendarLinkSpesaGroup) calendarLinkSpesaGroup.style.display = 'flex';
            if (calendarLinkPalestraGroup) calendarLinkPalestraGroup.style.display = 'none';
            if (selectCalendarLinkSpesa) selectCalendarLinkSpesa.value = event.linkedId || '';
        } else if (type === 'allenamento') {
            if (calendarLinkSpesaGroup) calendarLinkSpesaGroup.style.display = 'none';
            if (calendarLinkPalestraGroup) calendarLinkPalestraGroup.style.display = 'flex';
            if (selectCalendarLinkPalestra) selectCalendarLinkPalestra.value = event.linkedId || '';
        } else {
            if (calendarLinkSpesaGroup) calendarLinkSpesaGroup.style.display = 'none';
            if (calendarLinkPalestraGroup) calendarLinkPalestraGroup.style.display = 'none';
        }

        const isAllDay = !!event.allDay;
        if (inputCalendarEventAllDay) inputCalendarEventAllDay.checked = isAllDay;
        if (isAllDay) {
            if (calendarTimeRangeGroup) calendarTimeRangeGroup.style.display = 'none';
            if (inputCalendarEventTime) inputCalendarEventTime.removeAttribute('required');
        } else {
            if (calendarTimeRangeGroup) calendarTimeRangeGroup.style.display = 'grid';
            if (inputCalendarEventTime) {
                inputCalendarEventTime.setAttribute('required', 'true');
                inputCalendarEventTime.value = event.time || '';
            }
            if (inputCalendarEventEndTime) inputCalendarEventEndTime.value = event.endTime || '';
        }

        const isMultiDay = event.endDate && event.endDate !== event.date;
        if (inputCalendarEventMultiDay) inputCalendarEventMultiDay.checked = isMultiDay;
        if (isMultiDay) {
            if (calendarDateRangeGroup) calendarDateRangeGroup.style.display = 'grid';
            if (inputCalendarEventStartDate) inputCalendarEventStartDate.value = event.date;
            if (inputCalendarEventEndDate) inputCalendarEventEndDate.value = event.endDate;
        } else {
            if (calendarDateRangeGroup) calendarDateRangeGroup.style.display = 'none';
        }

        if (btnCancelEditEvent) btnCancelEditEvent.style.display = 'inline-block';
        if (btnSaveCalendarEvent) btnSaveCalendarEvent.textContent = 'Salva Modifiche';

        // Scrolla l'input in evidenza
        calendarAddEventForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (calendarAddEventForm) {
        calendarAddEventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = inputCalendarEventTitle.value.trim();
            const type = selectCalendarEventType.value;

            if (title) {
                let linkedType = null;
                let linkedId = null;

                if (type === 'spesa' && selectCalendarLinkSpesa.value) {
                    linkedType = 'spesa';
                    linkedId = parseInt(selectCalendarLinkSpesa.value);
                } else if (type === 'allenamento' && selectCalendarLinkPalestra.value) {
                    linkedType = 'allenamento';
                    linkedId = parseInt(selectCalendarLinkPalestra.value);
                } else if (type !== 'generic') {
                    linkedType = type;
                    linkedId = null;
                }

                const allDay = inputCalendarEventAllDay ? inputCalendarEventAllDay.checked : false;
                const multiDay = inputCalendarEventMultiDay ? inputCalendarEventMultiDay.checked : false;
                
                let startDate = window.selectedDateStr;
                let endDate = window.selectedDateStr;
                if (multiDay) {
                    startDate = inputCalendarEventStartDate.value || window.selectedDateStr;
                    endDate = inputCalendarEventEndDate.value || startDate;
                }

                let time = '';
                let endTime = '';
                if (!allDay) {
                    time = inputCalendarEventTime.value || '';
                    endTime = inputCalendarEventEndTime.value || '';
                }

                const editingId = calendarAddEventForm.dataset.editingId;
                if (editingId) {
                    // Modifica impegno esistente
                    const eventIndex = window.events.findIndex(ev => ev.id === parseInt(editingId));
                    if (eventIndex !== -1) {
                        window.events[eventIndex] = {
                            ...window.events[eventIndex],
                            title: title,
                            time: time,
                            endTime: endTime,
                            date: startDate,
                            endDate: endDate,
                            allDay: allDay,
                            linkedType: linkedType,
                            linkedId: linkedId
                        };
                    }
                } else {
                    // Aggiungi nuovo impegno
                    window.events.push({
                        id: Date.now(),
                        title: title,
                        time: time,
                        endTime: endTime,
                        date: startDate,
                        endDate: endDate,
                        allDay: allDay,
                        linkedType: linkedType,
                        linkedId: linkedId
                    });
                }

                resetCalendarForm();

                if (typeof window.renderEvents === 'function') {
                    window.renderEvents();
                }
                window.renderCalendar(window.currentYear, window.currentMonth);
                window.renderSelectedDayEvents();
            }
        });
    }

    const cardCalendario = document.querySelector('.app-card[data-target="calendario"]');
    if (cardCalendario) {
        cardCalendario.addEventListener('click', () => {
            window.selectedDateStr = new Date().toISOString().split('T')[0];
            const parts = window.selectedDateStr.split('-');
            window.currentYear = parseInt(parts[0]);
            window.currentMonth = parseInt(parts[1]) - 1;
            
            if (inputCalendarEventAllDay) inputCalendarEventAllDay.checked = false;
            if (inputCalendarEventMultiDay) inputCalendarEventMultiDay.checked = false;
            if (calendarTimeRangeGroup) calendarTimeRangeGroup.style.display = 'grid';
            if (inputCalendarEventTime) {
                inputCalendarEventTime.value = '';
                inputCalendarEventTime.setAttribute('required', 'true');
            }
            if (inputCalendarEventEndTime) inputCalendarEventEndTime.value = '';
            if (calendarDateRangeGroup) calendarDateRangeGroup.style.display = 'none';
            if (calendarLinkSpesaGroup) calendarLinkSpesaGroup.style.display = 'none';
            if (calendarLinkPalestraGroup) calendarLinkPalestraGroup.style.display = 'none';
            if (selectCalendarEventType) selectCalendarEventType.value = 'generic';
            
            window.updateSelectedDayLabel();
            window.renderCalendar(window.currentYear, window.currentMonth);
            window.renderSelectedDayEvents();
        });
    }
});
