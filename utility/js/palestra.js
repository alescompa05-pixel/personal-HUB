document.addEventListener('DOMContentLoaded', () => {
    // 9. LOGICA MICRO APP PALESTRA (SENZA EMOJI)
    const workoutSheetsList = document.getElementById('workout-sheets-list');
    const activeSheetName = document.getElementById('active-sheet-name');
    const btnDeleteActiveSheet = document.getElementById('btn-delete-active-sheet');
    const activeSheetEmptyState = document.getElementById('active-sheet-empty-state');
    const activeSheetContent = document.getElementById('active-sheet-content');
    const workoutExercisesList = document.getElementById('workout-exercises-list');
    const workoutAddExerciseForm = document.getElementById('workout-add-exercise-form');

    const inputExerciseName = document.getElementById('input-exercise-name');
    const inputExerciseSetsReps = document.getElementById('input-exercise-sets-reps');
    const inputExerciseRest = document.getElementById('input-exercise-rest');
    const inputExerciseLoad = document.getElementById('input-exercise-load');

    const btnNewWorkoutSheet = document.getElementById('btn-new-workout-sheet');
    const modalNuovaScheda = document.getElementById('modal-nuova-scheda');
    const btnCloseNuovaScheda = document.getElementById('btn-close-nuova-scheda');
    const newSheetForm = document.getElementById('new-sheet-form');
    const inputNewSheetName = document.getElementById('input-new-sheet-name');

    // Elementi Widget/Pillola Allenamento
    const workoutPill = document.getElementById('workout-pill');
    const workoutCountDisplay = document.getElementById('workout-count-display');

    // Modal Dettaglio Allenamento (Pillola Home)
    const modalWorkoutDetail = document.getElementById('modal-workout-detail');
    const btnCloseWorkoutDetail = document.getElementById('btn-close-workout-detail');
    const modalWorkoutSheetName = document.getElementById('modal-workout-sheet-name');
    const modalWorkoutTotalCount = document.getElementById('modal-workout-total-count');
    const modalWorkoutListItems = document.getElementById('modal-workout-list-items');
    const btnModalOpenFullPalestra = document.getElementById('btn-modal-open-full-palestra');
    const selectWidgetWorkoutSheet = document.getElementById('select-widget-workout-sheet');
    const btnWidgetStartWorkout = document.getElementById('btn-widget-start-workout');

    // Elementi Sessione Attiva Allenamento
    const btnStartWorkout = document.getElementById('btn-start-workout');
    const modalWorkoutSession = document.getElementById('modal-workout-session');
    const btnCloseWorkoutSession = document.getElementById('btn-close-workout-session');
    const btnCancelWorkoutSession = document.getElementById('btn-cancel-workout-session');
    const btnFinishWorkoutSession = document.getElementById('btn-finish-workout-session');
    const sessionWorkoutName = document.getElementById('session-workout-name');
    const sessionWorkoutDate = document.getElementById('session-workout-date');
    const sessionExercisesList = document.getElementById('session-exercises-list');

    const defaultWorkoutSheets = [
        {
            id: 1,
            name: "Scheda A - Spinta",
            exercises: [
                { id: 101, name: "Panca Piana", setsReps: "4x8", rest: "120s", load: "60kg" },
                { id: 102, name: "Military Press", setsReps: "3x10", rest: "90s", load: "30kg" },
                { id: 103, name: "Dip parallele", setsReps: "3x Max", rest: "90s", load: "Corporeo" }
            ]
        },
        {
            id: 2,
            name: "Scheda B - Trazione",
            exercises: [
                { id: 201, name: "Trazioni alla sbarra", setsReps: "4x6", rest: "120s", load: "Corporeo" },
                { id: 202, name: "Rematore bilanciere", setsReps: "3x8", rest: "90s", load: "50kg" },
                { id: 203, name: "Curl manubri", setsReps: "3x12", rest: "60s", load: "12kg" }
            ]
        }
    ];

    window.workoutSheets = JSON.parse(localStorage.getItem('hub-workout-sheets')) || defaultWorkoutSheets;
    window.activeSheetId = null;

    // Seleziona la prima scheda all'avvio se presente
    if (window.workoutSheets.length > 0) {
        window.activeSheetId = window.workoutSheets[0].id;
    }

    window.saveWorkouts = function() {
        localStorage.setItem('hub-workout-sheets', JSON.stringify(window.workoutSheets));
    }

    window.renderWorkoutSheets = function() {
        if (!workoutSheetsList) return;
        workoutSheetsList.innerHTML = '';

        if (window.workoutSheets.length === 0) {
            workoutSheetsList.innerHTML = `
                <li style="font-size: 0.9rem; color: var(--text-secondary); text-align: center; padding: 12px 0;">
                    Nessuna scheda creata
                </li>
            `;
            return;
        }

        window.workoutSheets.forEach(sheet => {
            const li = document.createElement('li');
            li.className = `workout-sheet-item ${sheet.id === window.activeSheetId ? 'active' : ''}`;
            li.textContent = sheet.name;
            li.setAttribute('data-id', sheet.id);
            li.addEventListener('click', () => {
                window.activeSheetId = sheet.id;
                window.renderWorkoutSheets();
                window.renderActiveWorkoutSheet();
            });
            workoutSheetsList.appendChild(li);
        });
    }

    window.renderActiveWorkoutSheet = function() {
        const activeSheet = window.workoutSheets.find(s => s.id === window.activeSheetId);

        // 1. Aggiorna Pillola in Home (conteggio esercizi scheda attiva)
        const exerciseCount = activeSheet ? activeSheet.exercises.length : 0;
        if (workoutCountDisplay) {
            workoutCountDisplay.textContent = exerciseCount;
        }

        // 2. Aggiorna Modal di Dettaglio Allenamento se presente
        if (modalWorkoutListItems) {
            modalWorkoutListItems.innerHTML = '';

            if (!activeSheet) {
                if (modalWorkoutSheetName) modalWorkoutSheetName.textContent = "Nessuna scheda attiva";
                if (modalWorkoutTotalCount) modalWorkoutTotalCount.textContent = "0";
                modalWorkoutListItems.innerHTML = `
                    <li class="widget-empty-state" style="border: none; background: transparent; padding: 20px 0;">
                        <p style="color: var(--text-secondary); text-align: center;">Crea o seleziona una scheda per iniziare!</p>
                    </li>
                `;
            } else {
                if (modalWorkoutSheetName) modalWorkoutSheetName.textContent = activeSheet.name;
                if (modalWorkoutTotalCount) modalWorkoutTotalCount.textContent = exerciseCount;

                if (activeSheet.exercises.length === 0) {
                    modalWorkoutListItems.innerHTML = `
                        <li class="widget-empty-state" style="border: none; background: transparent; padding: 20px 0;">
                            <p style="color: var(--text-secondary); text-align: center;">Nessun esercizio inserito in questa scheda.</p>
                        </li>
                    `;
                } else {
                    activeSheet.exercises.forEach(ex => {
                        const li = document.createElement('li');
                        li.className = "task-item";
                        li.innerHTML = `
                            <div class="task-item-left" style="display: flex; align-items: flex-start; gap: 8px;">
                                <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--apple-blue); margin-top: 8px; flex-shrink: 0;"></span>
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">${ex.name}</span>
                                    <div style="display: flex; gap: 6px; margin-top: 2px; flex-wrap: wrap;">
                                        <small style="opacity: 0.65; font-size: 0.75rem; color: var(--text-secondary);">${ex.setsReps}</small>
                                        ${ex.rest ? `<small style="opacity: 0.65; font-size: 0.75rem; color: var(--text-secondary);">• ${ex.rest}</small>` : ''}
                                        ${ex.load ? `<small style="opacity: 0.65; font-size: 0.75rem; color: var(--text-secondary);">• ${ex.load}</small>` : ''}
                                    </div>
                                </div>
                            </div>
                        `;
                        modalWorkoutListItems.appendChild(li);
                    });
                }
            }
        }

        // 3. Aggiorna pagina principale palestra
        if (!activeSheet) {
            if (activeSheetName) activeSheetName.textContent = "Seleziona una scheda";
            if (btnDeleteActiveSheet) btnDeleteActiveSheet.style.display = 'none';
            if (btnStartWorkout) btnStartWorkout.style.display = 'none';
            if (activeSheetEmptyState) activeSheetEmptyState.style.display = 'block';
            if (activeSheetContent) activeSheetContent.style.display = 'none';
            return;
        }

        if (activeSheetName) activeSheetName.textContent = activeSheet.name;
        if (btnDeleteActiveSheet) btnDeleteActiveSheet.style.display = 'block';
        if (btnStartWorkout) {
            btnStartWorkout.style.display = activeSheet.exercises.length > 0 ? 'block' : 'none';
        }
        if (activeSheetEmptyState) activeSheetEmptyState.style.display = 'none';
        if (activeSheetContent) activeSheetContent.style.display = 'block';

        if (workoutExercisesList) {
            workoutExercisesList.innerHTML = '';

            if (activeSheet.exercises.length === 0) {
                workoutExercisesList.innerHTML = `
                    <li class="widget-empty-state" style="border: none; background: transparent; padding: 30px 0;">
                        Nessun esercizio presente. Aggiungine uno sotto!
                    </li>
                `;
                return;
            }

            activeSheet.exercises.forEach(ex => {
                const li = document.createElement('li');
                li.className = "shopping-item";
                li.innerHTML = `
                    <div class="shopping-item-left">
                        <div class="shopping-item-details">
                            <span class="shopping-item-text" style="font-size: 1rem; font-weight: 600; color: var(--text-primary);">${ex.name}</span>
                            <div style="display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
                                <span class="exercise-meta-pill">Serie: ${ex.setsReps}</span>
                                ${ex.rest ? `<span class="exercise-meta-pill">Recupero: ${ex.rest}</span>` : ''}
                                ${ex.load ? `<span class="exercise-meta-pill">Carico: ${ex.load}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="shopping-item-actions">
                        <button class="btn-delete" data-id="${ex.id}" title="Elimina esercizio">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                `;

                li.querySelector('.btn-delete').addEventListener('click', () => {
                    activeSheet.exercises = activeSheet.exercises.filter(e => e.id !== ex.id);
                    window.saveWorkouts();
                    window.renderActiveWorkoutSheet();
                });

                workoutExercisesList.appendChild(li);
            });
        }
    }

    // Aggiunta esercizio
    if (workoutAddExerciseForm) {
        workoutAddExerciseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const activeSheet = window.workoutSheets.find(s => s.id === window.activeSheetId);
            if (!activeSheet) return;

            const name = inputExerciseName.value.trim();
            const setsReps = inputExerciseSetsReps.value.trim();
            const rest = inputExerciseRest ? inputExerciseRest.value.trim() : '';
            const load = inputExerciseLoad ? inputExerciseLoad.value.trim() : '';

            if (name && setsReps) {
                activeSheet.exercises.push({
                    id: Date.now(),
                    name: name,
                    setsReps: setsReps,
                    rest: rest,
                    load: load
                });
                window.saveWorkouts();

                inputExerciseName.value = '';
                inputExerciseSetsReps.value = '';
                if (inputExerciseRest) inputExerciseRest.value = '';
                if (inputExerciseLoad) inputExerciseLoad.value = '';

                window.renderActiveWorkoutSheet();
            }
        });
    }

    // Elimina scheda attiva
    if (btnDeleteActiveSheet) {
        btnDeleteActiveSheet.addEventListener('click', () => {
            if (confirm("Eliminare definitivamente questa scheda di allenamento?")) {
                window.workoutSheets = window.workoutSheets.filter(s => s.id !== window.activeSheetId);
                window.activeSheetId = window.workoutSheets.length > 0 ? window.workoutSheets[0].id : null;
                window.saveWorkouts();
                window.renderWorkoutSheets();
                window.renderActiveWorkoutSheet();
            }
        });
    }

    // Nuova scheda modal azioni
    if (btnNewWorkoutSheet && modalNuovaScheda) {
        btnNewWorkoutSheet.addEventListener('click', () => {
            if (inputNewSheetName) inputNewSheetName.value = '';
            modalNuovaScheda.classList.add('active');
        });
    }

    if (btnCloseNuovaScheda && modalNuovaScheda) {
        btnCloseNuovaScheda.addEventListener('click', () => {
            modalNuovaScheda.classList.remove('active');
        });
    }

    if (newSheetForm && modalNuovaScheda) {
        newSheetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = inputNewSheetName.value.trim();
            if (name) {
                const newSheet = {
                    id: Date.now(),
                    name: name,
                    exercises: []
                };
                window.workoutSheets.push(newSheet);
                window.activeSheetId = newSheet.id;

                window.saveWorkouts();
                modalNuovaScheda.classList.remove('active');

                window.renderWorkoutSheets();
                window.renderActiveWorkoutSheet();
            }
        });
    }

    // Interazioni Pillola Allenamento / Widget
    if (workoutPill && modalWorkoutDetail) {
        workoutPill.addEventListener('click', () => {
            // Popola il selettore nel widget con tutte le schede disponibili
            if (selectWidgetWorkoutSheet) {
                selectWidgetWorkoutSheet.innerHTML = '';

                if (window.workoutSheets.length === 0) {
                    const option = document.createElement('option');
                    option.textContent = "Nessuna scheda creata";
                    option.value = "";
                    selectWidgetWorkoutSheet.appendChild(option);
                } else {
                    window.workoutSheets.forEach(sheet => {
                        const option = document.createElement('option');
                        option.value = sheet.id;
                        option.textContent = sheet.name;
                        if (sheet.id === window.activeSheetId) {
                            option.selected = true;
                        }
                        selectWidgetWorkoutSheet.appendChild(option);
                    });
                }
            }

            window.renderActiveWorkoutSheet();
            modalWorkoutDetail.classList.add('active');
        });
    }

    if (selectWidgetWorkoutSheet) {
        selectWidgetWorkoutSheet.addEventListener('change', () => {
            const val = selectWidgetWorkoutSheet.value;
            if (val) {
                window.activeSheetId = parseInt(val);
                window.renderWorkoutSheets();
                window.renderActiveWorkoutSheet();
            }
        });
    }

    if (btnWidgetStartWorkout && modalWorkoutDetail) {
        btnWidgetStartWorkout.addEventListener('click', () => {
            modalWorkoutDetail.classList.remove('active');
            setTimeout(() => {
                if (btnStartWorkout) {
                    btnStartWorkout.click();
                }
            }, 150);
        });
    }

    if (btnCloseWorkoutDetail && modalWorkoutDetail) {
        btnCloseWorkoutDetail.addEventListener('click', () => {
            modalWorkoutDetail.classList.remove('active');
        });
    }

    if (btnModalOpenFullPalestra && modalWorkoutDetail) {
        btnModalOpenFullPalestra.addEventListener('click', () => {
            modalWorkoutDetail.classList.remove('active');
            window.switchPage('palestra');
        });
    }

    // Database dei Log storici degli allenamenti
    let workoutLogs = JSON.parse(localStorage.getItem('hub-workout-logs')) || [];

    // Helper per determinare il numero di serie da una stringa tipo "4x8"
    function parseSets(setsRepsStr) {
        if (!setsRepsStr) return 3;
        const match = setsRepsStr.match(/^(\d+)/);
        if (match) {
            const val = parseInt(match[1]);
            if (val > 0 && val <= 10) return val;
        }
        return 3;
    }

    // Avvio Sessione Allenamento
    if (btnStartWorkout && modalWorkoutSession) {
        btnStartWorkout.addEventListener('click', () => {
            const activeSheet = window.workoutSheets.find(s => s.id === window.activeSheetId);
            if (!activeSheet || activeSheet.exercises.length === 0) return;

            // Imposta titolo e data odierna formattata
            if (sessionWorkoutName) sessionWorkoutName.textContent = activeSheet.name;
            if (sessionWorkoutDate) {
                const sessionDate = new Date();
                sessionWorkoutDate.textContent = `Sessione del ${sessionDate.getDate().toString().padStart(2, '0')}/${(sessionDate.getMonth() + 1).toString().padStart(2, '0')}/${sessionDate.getFullYear()}`;
            }

            // Pulisci lista esercizi della sessione
            if (sessionExercisesList) {
                sessionExercisesList.innerHTML = '';

                // Trova l'ultimo log registrato per questa scheda
                const sheetLogs = workoutLogs.filter(log => log.sheetId === window.activeSheetId);
                sheetLogs.sort((a, b) => b.timestamp - a.timestamp);
                const lastLog = sheetLogs.length > 0 ? sheetLogs[0] : null;

                activeSheet.exercises.forEach(ex => {
                    const numSets = parseSets(ex.setsReps);
                    const lastExData = lastLog && lastLog.results ? lastLog.results[ex.id] : null;

                    const card = document.createElement('div');
                    card.className = "session-exercise-card";
                    card.setAttribute('data-ex-id', ex.id);

                    let setsHtml = '';
                    for (let i = 0; i < numSets; i++) {
                        const lastSet = lastExData && lastExData[i] ? lastExData[i] : null;
                        const lastInfoStr = lastSet ? `Ultimo: ${lastSet.reps} reps @ ${lastSet.load}` : 'Nuova serie';

                        // Determina placeholders
                        const repPlaceholder = lastSet ? lastSet.reps : (ex.setsReps.split('x')[1] || '8').trim();
                        const loadPlaceholder = lastSet ? lastSet.load : (ex.load || 'kg').trim();

                        setsHtml += `
                            <div class="session-set-row" data-set-index="${i}">
                                <span class="set-num">Serie ${i + 1}</span>
                                <input type="number" class="session-input-reps" placeholder="${repPlaceholder}" min="1" max="99">
                                <span style="font-size: 0.8rem; color: var(--text-secondary);">reps @</span>
                                <input type="text" class="session-input-load" placeholder="${loadPlaceholder}">
                                <span class="last-log-badge">${lastInfoStr}</span>
                                <button type="button" class="btn-check-set" title="Completa serie">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </button>
                            </div>
                        `;
                    }

                    card.innerHTML = `
                        <h4>${ex.name}</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${setsHtml}
                        </div>
                    `;

                    // Bind click del checkbox di completamento serie
                    card.querySelectorAll('.session-set-row').forEach(row => {
                        const btnCheck = row.querySelector('.btn-check-set');
                        const inputReps = row.querySelector('.session-input-reps');
                        const inputLoad = row.querySelector('.session-input-load');

                        btnCheck.addEventListener('click', () => {
                            const isChecked = btnCheck.classList.toggle('checked');
                            row.classList.toggle('completed-set', isChecked);

                            // Se clicca ma i campi sono vuoti, compila automaticamente con il placeholder (valori prefissati o precedenti)
                            if (isChecked) {
                                if (!inputReps.value) {
                                    inputReps.value = inputReps.placeholder;
                                }
                                if (!inputLoad.value) {
                                    inputLoad.value = inputLoad.placeholder;
                                }
                            }
                        });
                    });

                    sessionExercisesList.appendChild(card);
                });
            }

            // Mostra la barra flottante in basso "Allenamento in corso"
            const workoutActiveBar = document.getElementById('workout-active-bar');
            const activeWorkoutBarName = document.getElementById('active-workout-bar-name');
            if (workoutActiveBar) workoutActiveBar.style.display = 'flex';
            if (activeWorkoutBarName) activeWorkoutBarName.textContent = activeSheet.name;

            modalWorkoutSession.classList.add('active');
        });
    }

    // Chiudi Sessione (mantiene attiva la barra flottante in basso!)
    const closeSession = () => {
        if (modalWorkoutSession) {
            modalWorkoutSession.classList.remove('active');
        }
    };

    if (btnCloseWorkoutSession) btnCloseWorkoutSession.addEventListener('click', closeSession);

    // Annulla Sessione (chiude il modal e nasconde/cancella l'allenamento attivo!)
    if (btnCancelWorkoutSession) {
        btnCancelWorkoutSession.addEventListener('click', () => {
            if (confirm("Annullare l'allenamento in corso? Tutti i dati inseriti andranno persi.")) {
                closeSession();
                const workoutActiveBar = document.getElementById('workout-active-bar');
                if (workoutActiveBar) workoutActiveBar.style.display = 'none';
            }
        });
    }

    // Cliccando sulla barra in basso, riapre il modal della sessione
    const workoutActiveBarElement = document.getElementById('workout-active-bar');
    if (workoutActiveBarElement) {
        workoutActiveBarElement.addEventListener('click', (e) => {
            if (modalWorkoutSession) {
                modalWorkoutSession.classList.add('active');
            }
        });
    }

    // Termina Allenamento (Salvataggio Log e nasconde la barra flottante)
    if (btnFinishWorkoutSession && modalWorkoutSession) {
        btnFinishWorkoutSession.addEventListener('click', () => {
            const activeSheet = window.workoutSheets.find(s => s.id === window.activeSheetId);
            if (!activeSheet) return;

            const logEntry = {
                id: Date.now(),
                timestamp: Date.now(),
                sheetId: window.activeSheetId,
                results: {} // conterrà exerciseId -> array di { reps, load }
            };

            const cards = sessionExercisesList.querySelectorAll('.session-exercise-card');
            let hasCompletedAny = false;

            cards.forEach(card => {
                const exId = card.getAttribute('data-ex-id');
                const setRows = card.querySelectorAll('.session-set-row');
                const exerciseResults = [];

                setRows.forEach(row => {
                    const btnCheck = row.querySelector('.btn-check-set');
                    const setIndex = parseInt(row.getAttribute('data-set-index'));
                    const inputReps = row.querySelector('.session-input-reps');
                    const inputLoad = row.querySelector('.session-input-load');

                    if (btnCheck.classList.contains('checked')) {
                        hasCompletedAny = true;
                        exerciseResults[setIndex] = {
                            reps: inputReps.value.trim() || inputReps.placeholder || '0',
                            load: inputLoad.value.trim() || inputLoad.placeholder || '0'
                        };
                    }
                });

                if (exerciseResults.length > 0) {
                    logEntry.results[exId] = exerciseResults;
                }
            });

            if (!hasCompletedAny) {
                alert("Segna almeno una serie come completata prima di terminare!");
                return;
            }

            // Salva log storico
            workoutLogs.push(logEntry);
            localStorage.setItem('hub-workout-logs', JSON.stringify(workoutLogs));

            alert("Allenamento completato con successo! Dati salvati nello storico.");
            closeSession();

            // Nasconde la barra flottante
            const workoutActiveBar = document.getElementById('workout-active-bar');
            if (workoutActiveBar) workoutActiveBar.style.display = 'none';

            window.renderActiveWorkoutSheet();
        });
    }
});
