document.addEventListener('DOMContentLoaded', () => {
    // Selectors principali pagina Travel Planner
    const travelPlannerForm = document.getElementById('travel-planner-form');
    const inputTravelDestination = document.getElementById('input-travel-destination');
    const inputTravelStartDate = document.getElementById('input-travel-start-date');
    const inputTravelEndDate = document.getElementById('input-travel-end-date');
    const travelPlansList = document.getElementById('travel-plans-list');

    // Selectors Modal Dettaglio Viaggio
    const modalTripDetail = document.getElementById('modal-trip-detail');
    const btnCloseTripDetail = document.getElementById('btn-close-trip-detail');
    const tripDetailTitle = document.getElementById('trip-detail-title');
    const tripDetailDate = document.getElementById('trip-detail-date');

    // Bottoni Tab all'interno del Modal
    const btnTabProgramma = document.getElementById('btn-trip-tab-programma');
    const btnTabDocumenti = document.getElementById('btn-trip-tab-documenti');
    const btnTabValigia = document.getElementById('btn-trip-tab-valigia');
    const btnTabSpese = document.getElementById('btn-trip-tab-spese');

    // Pannelli Tab all'interno del Modal
    const panelProgramma = document.getElementById('trip-panel-programma');
    const panelDocumenti = document.getElementById('trip-panel-documenti');
    const panelValigia = document.getElementById('trip-panel-valigia');
    const panelSpese = document.getElementById('trip-panel-spese');

    // Elementi Tab Programma
    const tripActivityForm = document.getElementById('trip-activity-form');
    const selectActivityDate = document.getElementById('select-activity-date');
    const inputActivityTime = document.getElementById('input-activity-time');
    const inputActivityTitle = document.getElementById('input-activity-title');
    const inputActivityNotes = document.getElementById('input-activity-notes');
    const tripActivitiesContainer = document.getElementById('trip-activities-container');

    // Elementi Tab Documenti
    const tripDocumentForm = document.getElementById('trip-document-form');
    const selectDocumentCategory = document.getElementById('select-document-category');
    const inputDocumentName = document.getElementById('input-document-name');
    const inputDocumentRef = document.getElementById('input-document-ref');
    const tripDocumentsList = document.getElementById('trip-documents-list');

    // Elementi Tab Valigia
    const tripLuggageForm = document.getElementById('trip-luggage-form');
    const inputLuggageItem = document.getElementById('input-luggage-item');
    const tripLuggageList = document.getElementById('trip-luggage-list');

    // Elementi Tab Spese
    const tripExpenseForm = document.getElementById('trip-expense-form');
    const inputExpenseName = document.getElementById('input-expense-name');
    const inputExpenseAmount = document.getElementById('input-expense-amount');
    const selectExpenseCategory = document.getElementById('select-expense-category');
    const tripExpensesList = document.getElementById('trip-expenses-list');
    const tripExpensesTotal = document.getElementById('trip-expenses-total');

    let activeTripId = null;

    // Usa window.leisureData come fonte di verità in-memory (popolato da Supabase al login)
    // In modalità mock, parte da un oggetto vuoto già inizializzato in settings.js
    if (!window.leisureData) window.leisureData = { trips: [] };
    if (!window.leisureData.trips) window.leisureData.trips = [];

    // Sanitizzazione: assicura che tutti i viaggi locali abbiano un ID valido
    window.leisureData.trips.forEach(trip => {
        if (!trip.id) {
            trip.id = crypto.randomUUID ? crypto.randomUUID() : 'trip-' + Date.now() + Math.random().toString(36).substr(2, 9);
        }
    });

    function saveLeisureData() {
        // Dati già in window.leisureData — sincronizza con Supabase
        syncLeisureToCalendar();
        
        if (typeof window.syncData === 'function') {
            window.syncData('leisure_planner');
        }
    }

    // =============================================
    // INTEGRAZIONE CALENDARIO & TIMELINE GIORNALIERA
    // =============================================
    function syncLeisureToCalendar() {
        if (!window.events) window.events = [];

        // Rimuovi tutti i precedenti eventi del Travel Planner
        window.events = window.events.filter(ev => ev.origin !== 'travel-planner');

        window.leisureData.trips.forEach(trip => {
            // 1. Evento per la durata del viaggio
            window.events.push({
                id: trip.id,
                title: `Viaggio: ${trip.destination}`,
                date: trip.startDate,
                endDate: trip.endDate,
                allDay: true,
                category: "svago",
                notes: `Viaggio pianificato a ${trip.destination}.`,
                origin: 'travel-planner'
            });

            // 2. Evento per ciascuna attività dell'itinerario giorno per giorno
            if (trip.itinerary) {
                trip.itinerary.forEach(act => {
                    window.events.push({
                        id: act.id,
                        title: `${trip.destination}: ${act.title}`,
                        date: act.date,
                        time: act.time,
                        allDay: false,
                        category: "svago",
                        notes: act.notes || '',
                        origin: 'travel-planner',
                        tripId: trip.id
                    });
                });
            }
        });

        // Ricarica le viste
        if (typeof window.renderEvents === 'function') window.renderEvents();
        if (typeof window.renderCalendar === 'function') {
            window.renderCalendar(window.currentYear, window.currentMonth);
        }
        if (typeof window.renderFocusTimelineBlocks === 'function') {
            window.renderFocusTimelineBlocks();
        }
    }

    // =============================================
    // GESTIONE CAMBIO TAB DENTRO IL MODAL
    // =============================================
    const tabButtons = [btnTabProgramma, btnTabDocumenti, btnTabValigia, btnTabSpese];
    const tabPanels = [panelProgramma, panelDocumenti, panelValigia, panelSpese];

    function switchModalTab(activeIndex) {
        tabButtons.forEach((btn, idx) => {
            if (!btn) return;
            if (idx === activeIndex) {
                btn.classList.add('active');
                btn.style.color = 'var(--text-primary)';
                btn.style.background = 'rgba(255, 255, 255, 0.7)';
                btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            } else {
                btn.classList.remove('active');
                btn.style.color = 'var(--text-secondary)';
                btn.style.background = 'transparent';
                btn.style.boxShadow = 'none';
            }
        });

        tabPanels.forEach((panel, idx) => {
            if (!panel) return;
            panel.style.display = idx === activeIndex ? 'block' : 'none';
        });
    }

    tabButtons.forEach((btn, idx) => {
        if (btn) {
            btn.addEventListener('click', () => switchModalTab(idx));
        }
    });

    // =============================================
    // HELPER PER DATE
    // =============================================
    function getDatesInRange(startStr, endStr) {
        const dates = [];
        let current = new Date(startStr);
        const last = new Date(endStr);
        let limit = 0;
        
        while (current <= last && limit < 31) {
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
            limit++;
        }
        return dates;
    }

    function formatLocalDate(dateStr) {
        const dateObj = new Date(dateStr);
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        let formatted = dateObj.toLocaleDateString('it-IT', options);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    // =============================================
    // RENDER LISTA VIAGGI (PAGINA PRINCIPALE)
    // =============================================
    function renderTrips() {
        if (!travelPlansList) return;
        
        // Legge direttamente da window.leisureData (in-memory, aggiornato da Supabase)
        
        travelPlansList.innerHTML = '';

        if (!leisureData.trips || leisureData.trips.length === 0) {
            travelPlansList.innerHTML = `
                <div class="history-empty-state" style="padding: 40px 0; text-align: center; color: var(--text-secondary);">
                    Non hai ancora programmato nessun viaggio.
                </div>
            `;
            return;
        }

        leisureData.trips.forEach(trip => {
            const card = document.createElement('div');
            card.className = "history-item-card";
            card.style.cursor = "pointer";

            const startFormatted = formatLocalDate(trip.startDate);
            const endFormatted = formatLocalDate(trip.endDate);

            const docCount = trip.documents ? trip.documents.length : 0;
            const luggageChecked = trip.luggage ? trip.luggage.filter(l => l.checked).length : 0;
            const luggageTotal = trip.luggage ? trip.luggage.length : 0;
            
            let totalSpent = 0;
            if (trip.expenses) {
                trip.expenses.forEach(e => totalSpent += parseFloat(e.amount || 0));
            }

            card.innerHTML = `
                <div class="history-item-info" style="flex: 1;">
                    <h4 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">${trip.destination}</h4>
                    <span class="history-item-meta" style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-top: 4px;">Dal ${trip.startDate} al ${trip.endDate}</span>
                    <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                        <span class="exercise-meta-pill" style="font-size: 0.75rem;">Documenti: ${docCount}</span>
                        <span class="exercise-meta-pill" style="font-size: 0.75rem;">Valigia: ${luggageChecked}/${luggageTotal}</span>
                        <span class="exercise-meta-pill" style="font-size: 0.75rem;">Spese: ${totalSpent.toFixed(2)} €</span>
                    </div>
                </div>
                <div class="history-item-actions" style="display: flex; gap: 8px; align-items: center;">
                    <button type="button" class="btn-open-detail-trip" style="border: 1px solid var(--glass-border); background: var(--glass-bg); padding: 8px 14px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; cursor: pointer; color: var(--text-primary);">Dettagli</button>
                    <button type="button" class="btn-delete-trip" style="background: rgba(255, 59, 48, 0.08); color: #ff3b30; border: none; padding: 8px 14px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">Elimina</button>
                </div>
            `;

            const openDetail = () => {
                activeTripId = trip.id;
                openTripDetailModal(trip);
            };

            card.querySelector('.btn-open-detail-trip').addEventListener('click', (e) => {
                e.stopPropagation();
                openDetail();
            });
            card.addEventListener('click', openDetail);

            card.querySelector('.btn-delete-trip').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Sei sicuro di voler eliminare il viaggio a ${trip.destination}? Verranno rimossi anche gli eventi dal calendario.`)) {
                    leisureData.trips = leisureData.trips.filter(t => t.id !== trip.id);
                    saveLeisureData();
                    renderTrips();
                }
            });

            travelPlansList.appendChild(card);
        });
    }

    if (travelPlannerForm) {
        travelPlannerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const destination = inputTravelDestination.value.trim();
            const start = inputTravelStartDate.value;
            const end = inputTravelEndDate.value;

            if (start > end) {
                alert("La data di inizio non può essere successiva alla data di fine!");
                return;
            }

            if (destination && start && end) {
                const newTrip = {
                    id: Date.now(),
                    destination: destination,
                    startDate: start,
                    endDate: end,
                    itinerary: [],
                    documents: [],
                    luggage: [],
                    expenses: []
                };

                leisureData.trips.push(newTrip);
                saveLeisureData();

                inputTravelDestination.value = '';
                inputTravelStartDate.value = '';
                inputTravelEndDate.value = '';

                renderTrips();
            }
        });
    }

    // =============================================
    // DETTAGLI DI UN VIAGGIO SELEZIONATO
    // =============================================
    function openTripDetailModal(trip) {
        if (!modalTripDetail) return;

        if (tripDetailTitle) tripDetailTitle.textContent = `Viaggio a ${trip.destination}`;
        if (tripDetailDate) {
            tripDetailDate.textContent = `Dal ${formatLocalDate(trip.startDate)} al ${formatLocalDate(trip.endDate)}`;
        }

        // Popola la selezione date nel tab Programma
        if (selectActivityDate) {
            selectActivityDate.innerHTML = '';
            const dates = getDatesInRange(trip.startDate, trip.endDate);
            dates.forEach((d, idx) => {
                const dateObj = new Date(d);
                const options = { weekday: 'short', day: 'numeric', month: 'short' };
                const formatted = dateObj.toLocaleDateString('it-IT', options);
                
                const opt = document.createElement('option');
                opt.value = d;
                opt.textContent = `Giorno ${idx + 1} - ${formatted}`;
                selectActivityDate.appendChild(opt);
            });
        }

        switchModalTab(0); // vai a scheda Programma per impostazione predefinita
        renderTripItinerary(trip);
        renderTripDocuments(trip);
        renderTripLuggage(trip);
        renderTripExpenses(trip);

        modalTripDetail.classList.add('active');
    }

    // RENDER TAB 1: PROGRAMMA
    function renderTripItinerary(trip) {
        if (!tripActivitiesContainer) return;
        tripActivitiesContainer.innerHTML = '';

        if (!trip.itinerary || trip.itinerary.length === 0) {
            tripActivitiesContainer.innerHTML = `
                <p style="color: var(--text-secondary); text-align: center; padding: 20px 0; font-style: italic; font-size: 0.9rem;">
                    Nessuna attività programmata per questo viaggio.
                </p>
            `;
            return;
        }

        // Raggruppa per data
        const grouped = {};
        const datesInRange = getDatesInRange(trip.startDate, trip.endDate);
        datesInRange.forEach(d => grouped[d] = []);

        trip.itinerary.forEach(act => {
            if (grouped[act.date]) {
                grouped[act.date].push(act);
            }
        });

        datesInRange.forEach((dateStr, idx) => {
            const dateObj = new Date(dateStr);
            const dateOptions = { weekday: 'long', day: 'numeric', month: 'short' };
            let dateLabel = dateObj.toLocaleDateString('it-IT', dateOptions);
            dateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

            const dayDiv = document.createElement('div');
            dayDiv.style.marginBottom = "14px";

            dayDiv.innerHTML = `
                <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 4px; margin-bottom: 8px;">
                    Giorno ${idx + 1} - ${dateLabel}
                </h4>
                <div class="day-activities-list" style="display: flex; flex-direction: column; gap: 8px; padding-left: 4px;"></div>
            `;

            const listContainer = dayDiv.querySelector('.day-activities-list');
            const dayActs = grouped[dateStr];

            if (dayActs.length === 0) {
                listContainer.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic; opacity: 0.7; margin: 0;">Nessuna attività programmata.</p>`;
            } else {
                // Ordina per orario
                dayActs.sort((a, b) => a.time.localeCompare(b.time));

                dayActs.forEach(act => {
                    const item = document.createElement('div');
                    item.className = "task-item";
                    item.style.cssText = "margin-left: 0; padding: 8px 10px; background: rgba(0,0,0,0.02); border-radius: 10px;";
                    item.innerHTML = `
                        <div style="display: flex; flex-direction: column; flex: 1;">
                            <span style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">
                                <span style="color: var(--apple-blue); font-variant-numeric: tabular-nums; margin-right: 6px;">${act.time}</span> ${act.title}
                            </span>
                            ${act.notes ? `<small style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${act.notes}</small>` : ''}
                        </div>
                        <button type="button" class="btn-delete-activity" style="background: transparent; border: none; color: #ff3b30; cursor: pointer; font-size: 0.75rem; font-weight: 600;">Rimuovi</button>
                    `;

                    item.querySelector('.btn-delete-activity').addEventListener('click', () => {
                        trip.itinerary = trip.itinerary.filter(a => a.id !== act.id);
                        saveLeisureData();
                        renderTripItinerary(trip);
                    });

                    listContainer.appendChild(item);
                });
            }

            tripActivitiesContainer.appendChild(dayDiv);
        });
    }

    if (tripActivityForm) {
        tripActivityForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (activeTripId === null) return;
            const trip = leisureData.trips.find(t => t.id === activeTripId);
            if (!trip) return;

            const date = selectActivityDate.value;
            const time = inputActivityTime.value;
            const title = inputActivityTitle.value.trim();
            const notes = inputActivityNotes.value.trim();

            if (date && time && title) {
                if (!trip.itinerary) trip.itinerary = [];
                
                trip.itinerary.push({
                    id: Date.now(),
                    date: date,
                    time: time,
                    title: title,
                    notes: notes
                });

                saveLeisureData();
                inputActivityTime.value = '';
                inputActivityTitle.value = '';
                inputActivityNotes.value = '';

                renderTripItinerary(trip);
            }
        });
    }

    // RENDER TAB 2: DOCUMENTI
    function renderTripDocuments(trip) {
        if (!tripDocumentsList) return;
        tripDocumentsList.innerHTML = '';

        if (!trip.documents || trip.documents.length === 0) {
            tripDocumentsList.innerHTML = `
                <p style="color: var(--text-secondary); text-align: center; padding: 20px 0; font-style: italic; font-size: 0.9rem;">
                    Nessun documento o alloggio registrato.
                </p>
            `;
            return;
        }

        // Raggruppa per categoria
        const categories = ["Trasporti", "Alloggio", "Prenotazione", "Altro"];
        
        categories.forEach(cat => {
            const catDocs = trip.documents.filter(d => d.category === cat);
            if (catDocs.length === 0) return;

            const catDiv = document.createElement('div');
            catDiv.style.marginBottom = "14px";
            catDiv.innerHTML = `
                <h4 style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 4px; margin-bottom: 8px;">${cat}</h4>
                <div class="cat-docs-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
            `;

            const list = catDiv.querySelector('.cat-docs-list');

            catDocs.forEach(doc => {
                const item = document.createElement('div');
                item.className = "task-item";
                item.style.cssText = "margin-left: 0; padding: 8px 10px; background: rgba(0,0,0,0.02); border-radius: 10px;";
                item.innerHTML = `
                    <div style="display: flex; flex-direction: column; flex: 1;">
                        <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">${doc.name}</span>
                        ${doc.ref ? `<small style="font-size: 0.75rem; color: var(--apple-blue); font-weight: 500; margin-top: 2px;">${doc.ref}</small>` : ''}
                    </div>
                    <button type="button" class="btn-delete-doc" style="background: transparent; border: none; color: #ff3b30; cursor: pointer; font-size: 0.75rem; font-weight: 600;">Rimuovi</button>
                `;

                item.querySelector('.btn-delete-doc').addEventListener('click', () => {
                    trip.documents = trip.documents.filter(d => d.id !== doc.id);
                    saveLeisureData();
                    renderTripDocuments(trip);
                    renderTrips(); // Aggiorna contatore sulla card principale
                });

                list.appendChild(item);
            });

            tripDocumentsList.appendChild(catDiv);
        });
    }

    if (tripDocumentForm) {
        tripDocumentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (activeTripId === null) return;
            const trip = leisureData.trips.find(t => t.id === activeTripId);
            if (!trip) return;

            const category = selectDocumentCategory.value;
            const name = inputDocumentName.value.trim();
            const ref = inputDocumentRef.value.trim();

            if (category && name) {
                if (!trip.documents) trip.documents = [];

                trip.documents.push({
                    id: Date.now(),
                    category: category,
                    name: name,
                    ref: ref
                });

                saveLeisureData();
                inputDocumentName.value = '';
                inputDocumentRef.value = '';

                renderTripDocuments(trip);
                renderTrips();
            }
        });
    }

    // RENDER TAB 3: VALIGIA
    function renderTripLuggage(trip) {
        if (!tripLuggageList) return;
        tripLuggageList.innerHTML = '';

        if (!trip.luggage || trip.luggage.length === 0) {
            tripLuggageList.innerHTML = `
                <p style="color: var(--text-secondary); text-align: center; padding: 20px 0; font-style: italic; font-size: 0.9rem;">
                    La valigia è vuota. Aggiungi vestiti, documenti o caricatori!
                </p>
            `;
            return;
        }

        trip.luggage.forEach(item => {
            const li = document.createElement('li');
            li.className = `task-item ${item.checked ? 'completed' : ''}`;
            li.style.cssText = "margin-left: 0; padding: 8px 10px; border-bottom: 1px solid rgba(0,0,0,0.03);";
            li.innerHTML = `
                <div class="task-item-left" style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" ${item.checked ? 'checked' : ''} style="margin: 0;">
                    <span style="font-size: 0.88rem;">${item.text}</span>
                </div>
                <button type="button" class="btn-delete-luggage" style="background: transparent; border: none; color: #ff3b30; cursor: pointer; font-size: 0.75rem; font-weight: 600;">Rimuovi</button>
            `;

            li.querySelector('input').addEventListener('change', (e) => {
                item.checked = e.target.checked;
                li.classList.toggle('completed', item.checked);
                saveLeisureData();
                renderTrips(); // Aggiorna contatore sulla card
            });

            li.querySelector('.btn-delete-luggage').addEventListener('click', () => {
                trip.luggage = trip.luggage.filter(l => l.id !== item.id);
                saveLeisureData();
                renderTripLuggage(trip);
                renderTrips();
            });

            tripLuggageList.appendChild(li);
        });
    }

    if (tripLuggageForm) {
        tripLuggageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (activeTripId === null) return;
            const trip = leisureData.trips.find(t => t.id === activeTripId);
            if (!trip) return;

            const text = inputLuggageItem.value.trim();
            if (text) {
                if (!trip.luggage) trip.luggage = [];
                trip.luggage.push({
                    id: Date.now(),
                    text: text,
                    checked: false
                });

                saveLeisureData();
                inputLuggageItem.value = '';
                renderTripLuggage(trip);
                renderTrips();
            }
        });
    }

    // RENDER TAB 4: SPESE
    function renderTripExpenses(trip) {
        if (!tripExpensesList || !tripExpensesTotal) return;
        tripExpensesList.innerHTML = '';

        let total = 0;

        if (!trip.expenses || trip.expenses.length === 0) {
            tripExpensesList.innerHTML = `
                <p style="color: var(--text-secondary); text-align: center; padding: 20px 0; font-style: italic; font-size: 0.9rem;">
                    Non hai registrato alcuna spesa per questo viaggio.
                </p>
            `;
            tripExpensesTotal.textContent = "0,00";
            return;
        }

        // Ordina le spese per importo decrescente o inserimento
        trip.expenses.forEach(exp => {
            total += parseFloat(exp.amount || 0);

            const li = document.createElement('li');
            li.className = "task-item";
            li.style.cssText = "margin-left: 0; padding: 8px 10px; background: rgba(0,0,0,0.02); border-radius: 10px;";
            li.innerHTML = `
                <div style="display: flex; flex-direction: column; flex: 1;">
                    <span style="font-size: 0.88rem; font-weight: 600; color: var(--text-primary);">${exp.text}</span>
                    <span class="exercise-meta-pill" style="font-size: 0.7rem; align-self: flex-start; margin-top: 4px;">${exp.category}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums;">${parseFloat(exp.amount).toFixed(2)} €</span>
                    <button type="button" class="btn-delete-expense" style="background: transparent; border: none; color: #ff3b30; cursor: pointer; font-size: 0.75rem; font-weight: 600;">Rimuovi</button>
                </div>
            `;

            li.querySelector('.btn-delete-expense').addEventListener('click', () => {
                trip.expenses = trip.expenses.filter(e => e.id !== exp.id);
                saveLeisureData();
                renderTripExpenses(trip);
                renderTrips();
            });

            tripExpensesList.appendChild(li);
        });

        tripExpensesTotal.textContent = total.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    if (tripExpenseForm) {
        tripExpenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (activeTripId === null) return;
            const trip = leisureData.trips.find(t => t.id === activeTripId);
            if (!trip) return;

            const text = inputExpenseName.value.trim();
            const amount = parseFloat(inputExpenseAmount.value);
            const category = selectExpenseCategory.value;

            if (text && amount > 0) {
                if (!trip.expenses) trip.expenses = [];
                trip.expenses.push({
                    id: Date.now(),
                    text: text,
                    amount: amount,
                    category: category
                });

                saveLeisureData();
                inputExpenseName.value = '';
                inputExpenseAmount.value = '';

                renderTripExpenses(trip);
                renderTrips();
            }
        });
    }

    // =============================================
    // CHIUSURA MODAL DETTAGLI VIAGGIO
    // =============================================
    if (btnCloseTripDetail && modalTripDetail) {
        btnCloseTripDetail.addEventListener('click', () => {
            modalTripDetail.classList.remove('active');
            activeTripId = null;
        });
    }

    if (modalTripDetail) {
        modalTripDetail.addEventListener('click', (e) => {
            if (e.target === modalTripDetail) {
                modalTripDetail.classList.remove('active');
                activeTripId = null;
            }
        });
    }

    // =============================================
    // INIZIALIZZAZIONE VISTE
    // =============================================
    window.renderTrips = renderTrips;
    renderTrips();
    // Forza la sincronizzazione iniziale degli eventi salvati nel calendario
    syncLeisureToCalendar();
});
