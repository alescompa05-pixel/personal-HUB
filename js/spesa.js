document.addEventListener('DOMContentLoaded', () => {
    // 8. LOGICA MICRO APP SPESA (AVANZATA)
    const shoppingListItems = document.getElementById('shopping-list-items');
    const shoppingForm = document.getElementById('shopping-form');
    const inputShoppingItem = document.getElementById('input-shopping-item');
    const shoppingCount = document.getElementById('shopping-count');
    const btnClearShopping = document.getElementById('btn-clear-shopping');
    const shoppingFilterBar = document.getElementById('shopping-filter-bar');

    // Elementi di navigazione/modali spesa
    const btnNewList = document.getElementById('btn-new-list');
    const btnHistoryList = document.getElementById('btn-history-list');
    const modalNuovaSpesa = document.getElementById('modal-nuova-spesa');
    const btnCloseNuovaSpesa = document.getElementById('btn-close-nuova-spesa');
    const newListForm = document.getElementById('new-list-form');
    const inputNewListName = document.getElementById('input-new-list-name');

    const modalCronologiaSpesa = document.getElementById('modal-cronologia-spesa');
    const btnCloseCronologia = document.getElementById('btn-close-cronologia');
    const historyListTimeline = document.getElementById('history-list-timeline');

    const modalModificaArticolo = document.getElementById('modal-modifica-articolo');
    const btnCloseModifica = document.getElementById('btn-close-modifica');
    const editItemForm = document.getElementById('edit-item-form');
    const inputEditItemId = document.getElementById('input-edit-item-id');
    const inputEditItemName = document.getElementById('input-edit-item-name');
    const selectEditItemCategory = document.getElementById('select-edit-item-category');
    const inputEditItemQty = document.getElementById('input-edit-item-qty');
    const inputEditItemNotes = document.getElementById('input-edit-item-notes');

    // Elementi Widget/Pillola Spesa
    const shoppingPill = document.getElementById('shopping-pill');
    const shoppingCountDisplay = document.getElementById('shopping-count-display');

    // Modal Dettaglio Spesa (Pillola Home)
    const modalShoppingDetail = document.getElementById('modal-shopping-detail');
    const btnCloseShoppingDetail = document.getElementById('btn-close-shopping-detail');
    const modalShoppingListName = document.getElementById('modal-shopping-list-name');
    const modalShoppingCompletedCount = document.getElementById('modal-shopping-completed-count');
    const modalShoppingTotalCount = document.getElementById('modal-shopping-total-count');
    const modalShoppingProgressFill = document.getElementById('modal-shopping-progress-fill');
    const modalShoppingListItems = document.getElementById('modal-shopping-list-items');
    const btnModalOpenFullSpesa = document.getElementById('btn-modal-open-full-spesa');

    // Suggerimenti rapidi
    const suggestionsRow = document.getElementById('suggestions-row-items');

    // Modello Dati e Migrazione
    const defaultShoppingList = [
        { id: 1, text: "Pane fresco", category: "Alimentari", qty: 1, notes: "Integrale", bought: false },
        { id: 2, text: "Acqua frizzante", category: "Bevande", qty: 6, notes: "Lete", bought: false },
        { id: 3, text: "Sapone piatti", category: "Igiene", qty: 2, notes: "Svelto", bought: true }
    ];

    // window.shoppingLists è già inizializzato come array vuoto in settings.js.
    // Viene popolato da Supabase al login. In modalità mock usa i default in-memory.
    if (!window.shoppingLists || window.shoppingLists.length === 0) {
        window.shoppingLists = [{
            id: Date.now(),
            name: "Spesa Settimanale",
            date: new Date().toLocaleDateString('it-IT'),
            archived: false,
            items: defaultShoppingList
        }];
    }

    let currentShoppingFilter = 'all';

    window.getActiveList = function() {
        return window.shoppingLists.find(list => !list.archived) || null;
    }

    // Funzione per aggiornare il widget (pillola statistica e modal dettaglio)
    window.renderShoppingWidget = function() {
        const activeList = window.getActiveList();

        // 1. Aggiorna Pillola in Home (conteggio articoli rimanenti)
        let unboughtCount = 0;
        if (activeList) {
            unboughtCount = activeList.items.filter(item => !item.bought).length;
        }
        if (shoppingCountDisplay) {
            shoppingCountDisplay.textContent = unboughtCount;
        }

        // 2. Aggiorna Modal di Dettaglio Spesa se presente
        if (modalShoppingListItems) {
            modalShoppingListItems.innerHTML = '';

            if (!activeList || activeList.items.length === 0) {
                if (modalShoppingListName) modalShoppingListName.textContent = "Nessuna spesa attiva";
                if (modalShoppingCompletedCount) modalShoppingCompletedCount.textContent = "0";
                if (modalShoppingTotalCount) modalShoppingTotalCount.textContent = "0";
                if (modalShoppingProgressFill) modalShoppingProgressFill.style.width = '0%';

                modalShoppingListItems.innerHTML = `
                    <li class="widget-empty-state" style="border: none; background: transparent; padding: 20px 0;">
                        <p style="color: var(--text-secondary); text-align: center;">${!activeList ? 'Crea una nuova lista per iniziare!' : 'Nessun articolo nella lista spesa!'}</p>
                    </li>
                `;
                return;
            }

            if (modalShoppingListName) {
                modalShoppingListName.textContent = activeList.name;
            }

            const totalItems = activeList.items.length;
            const completedItems = activeList.items.filter(item => item.bought).length;

            if (modalShoppingCompletedCount) modalShoppingCompletedCount.textContent = completedItems;
            if (modalShoppingTotalCount) modalShoppingTotalCount.textContent = totalItems;

            if (modalShoppingProgressFill) {
                const percent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
                modalShoppingProgressFill.style.width = `${percent}%`;
            }

            // Raggruppa gli articoli per categoria
            const categories = {};
            activeList.items.forEach(item => {
                if (!categories[item.category]) {
                    categories[item.category] = [];
                }
                categories[item.category].push(item);
            });

            let isFirst = true;
            Object.keys(categories).sort().forEach(categoryName => {
                // Header della categoria
                const headerLi = document.createElement('li');
                headerLi.className = "category-group-header";
                headerLi.style.cssText = `font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-top: ${isFirst ? '4px' : '16px'}; margin-bottom: 8px; list-style: none; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid rgba(0,0,0,0.04); padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;`;

                headerLi.innerHTML = `<span>${categoryName}</span>`;
                modalShoppingListItems.appendChild(headerLi);
                isFirst = false;

                // Articoli appartenenti alla categoria
                categories[categoryName].forEach(item => {
                    const li = document.createElement('li');
                    li.className = `task-item ${item.bought ? 'completed' : ''}`;
                    li.style.marginLeft = "8px"; // Rientro per evidenziare il raggruppamento
                    li.innerHTML = `
                        <div class="task-item-left" style="display: flex; align-items: flex-start; gap: 8px;">
                            <input type="checkbox" ${item.bought ? 'checked' : ''} data-id="${item.id}" style="margin-top: 3px;">
                            <div style="display: flex; flex-direction: column;">
                                <span>${item.text} ${item.qty > 1 ? `<small style="opacity: 0.65; margin-left: 6px;">(x${item.qty})</small>` : ''}</span>
                                ${item.notes ? `<span class="shopping-item-notes" style="margin-top: 2px; align-self: flex-start;">${item.notes}</span>` : ''}
                            </div>
                        </div>
                    `;
                    modalShoppingListItems.appendChild(li);
                });
            });
        }
    }

    window.renderShopping = function() {
        if (!shoppingListItems) return;
        shoppingListItems.innerHTML = '';

        const activeList = window.getActiveList();
        const headerTitle = document.querySelector('#spesa .shopping-page-header h2');

        if (!activeList) {
            if (headerTitle) headerTitle.textContent = "Nessuna Lista Attiva";
            if (shoppingCount) shoppingCount.textContent = "0";
            shoppingListItems.innerHTML = `
                <div class="history-empty-state" style="padding: 40px 0;">
                    <p>Non c'è nessuna spesa attiva. Clicca su "+ Nuova Lista" in alto per iniziare!</p>
                </div>
            `;
            window.renderShoppingWidget();
            return;
        }

        if (headerTitle) {
            headerTitle.textContent = activeList.name;
        }

        let activeCount = 0;

        // Filtra gli elementi in base al chip selezionato
        const filteredList = activeList.items.filter(item => {
            if (!item.bought) activeCount++;
            if (currentShoppingFilter === 'all') return true;
            return item.category === currentShoppingFilter;
        });

        if (filteredList.length === 0) {
            shoppingListItems.innerHTML = `
                <li class="widget-empty-state" style="border: none; background: transparent; padding: 20px 0;">
                    <p>Nessun articolo in questa categoria</p>
                </li>
            `;
        } else {
            filteredList.forEach(item => {
                const li = document.createElement('li');
                li.className = `shopping-item ${item.bought ? 'bought' : ''}`;
                li.innerHTML = `
                    <div class="shopping-item-left">
                        <input type="checkbox" ${item.bought ? 'checked' : ''} data-id="${item.id}">
                        <div class="shopping-item-details">
                            <span class="shopping-item-text">${item.text}</span>
                            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px; flex-wrap: wrap;">
                                <span class="shopping-category-tag tag-${item.category.toLowerCase()}">${item.category}</span>
                                <span class="shopping-item-meta">Q.tà: ${item.qty}</span>
                                ${item.notes ? `<span class="shopping-item-notes" style="margin-top: 0;">${item.notes}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="shopping-item-actions">
                        <button class="btn-edit" data-id="${item.id}" title="Modifica articolo">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-delete" data-id="${item.id}" title="Rimuovi articolo">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                `;
                shoppingListItems.appendChild(li);
            });
        }

        // Aggiorna contatore
        if (shoppingCount) {
            shoppingCount.textContent = activeCount;
        }

        // Rendi sincrono il widget in home page
        window.renderShoppingWidget();
    }

    // Aggiunta elemento classico via Form in linea (Aggiunta veloce)
    if (shoppingForm) {
        shoppingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const activeList = window.getActiveList();
            if (!activeList) {
                alert("Crea prima una nuova lista spesa!");
                return;
            }

            const text = inputShoppingItem.value.trim();
            const categorySelect = document.getElementById('select-shopping-category');
            const qtyInput = document.getElementById('input-shopping-qty');
            const notesInput = document.getElementById('input-shopping-notes');

            const category = categorySelect ? categorySelect.value : "Alimentari";
            const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
            const notes = notesInput ? notesInput.value.trim() : '';

            if (text) {
                activeList.items.push({
                    id: Date.now(),
                    text: text,
                    category: category,
                    qty: qty,
                    notes: notes,
                    bought: false
                });
                inputShoppingItem.value = '';
                if (notesInput) notesInput.value = '';
                if (qtyInput) qtyInput.value = '1';
                window.renderShopping();
            }
        });
    }

    // Aggiunta rapida tramite chip suggerimenti
    if (suggestionsRow) {
        suggestionsRow.addEventListener('click', (e) => {
            const chip = e.target.closest('.suggestion-chip');
            if (chip) {
                const activeList = window.getActiveList();
                if (!activeList) {
                    // Se non c'è una spesa attiva, ne creiamo una automatica
                    window.shoppingLists.forEach(l => l.archived = true);
                    const newListName = `Spesa del ${new Date().toLocaleDateString('it-IT')}`;
                    window.shoppingLists.push({
                        id: Date.now(),
                        name: newListName,
                        date: new Date().toLocaleDateString('it-IT'),
                        archived: false,
                        items: []
                    });
                }

                const itemText = chip.getAttribute('data-item');
                const itemCategory = chip.getAttribute('data-category');

                const currentActive = window.getActiveList();
                currentActive.items.push({
                    id: Date.now(),
                    text: itemText,
                    category: itemCategory,
                    qty: 1,
                    notes: '',
                    bought: false
                });
                window.renderShopping();
            }
        });
    }

    // Gestione azioni elementi della lista (checkbox, elimina, modifica)
    if (shoppingListItems) {
        // Toggle completamento (bought)
        shoppingListItems.addEventListener('change', (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
                const id = parseInt(e.target.getAttribute('data-id'));
                const activeList = window.getActiveList();
                if (activeList) {
                    const item = activeList.items.find(i => i.id === id);
                    if (item) {
                        item.bought = e.target.checked;
                        window.renderShopping();
                    }
                }
            }
        });

        // Click sui tasti di Modifica o Cancellazione
        shoppingListItems.addEventListener('click', (e) => {
            // Delete button
            const deleteBtn = e.target.closest('.btn-delete');
            if (deleteBtn) {
                const id = parseInt(deleteBtn.getAttribute('data-id'));
                const activeList = window.getActiveList();
                if (activeList) {
                    activeList.items = activeList.items.filter(item => item.id !== id);
                    window.renderShopping();
                }
                return;
            }

            // Edit button
            const editBtn = e.target.closest('.btn-edit');
            if (editBtn && modalModificaArticolo) {
                const id = parseInt(editBtn.getAttribute('data-id'));
                const activeList = window.getActiveList();
                if (activeList) {
                    const item = activeList.items.find(i => i.id === id);
                    if (item) {
                        // Popola il form di modifica
                        inputEditItemId.value = item.id;
                        inputEditItemName.value = item.text;
                        selectEditItemCategory.value = item.category;
                        inputEditItemQty.value = item.qty;
                        inputEditItemNotes.value = item.notes || '';

                        // Mostra modal modifica
                        modalModificaArticolo.classList.add('active');
                    }
                }
            }
        });
    }

    // Gestione checkbox dal Widget Dettaglio Spesa (Pillola Home)
    if (modalShoppingListItems) {
        modalShoppingListItems.addEventListener('change', (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
                const id = parseInt(e.target.getAttribute('data-id'));
                const activeList = window.getActiveList();
                if (activeList) {
                    const item = activeList.items.find(i => i.id === id);
                    if (item) {
                        item.bought = e.target.checked;
                        window.renderShopping(); // Renderizzerà la lista spesa e il widget coerentemente
                    }
                }
            }
        });
    }

    // Gestione click sulla Pillola Spesa in Home per aprire il modal dettaglio
    if (shoppingPill && modalShoppingDetail) {
        shoppingPill.addEventListener('click', () => {
            window.renderShoppingWidget();
            modalShoppingDetail.classList.add('active');
        });
    }

    if (btnCloseShoppingDetail && modalShoppingDetail) {
        btnCloseShoppingDetail.addEventListener('click', () => {
            modalShoppingDetail.classList.remove('active');
        });
    }

    if (btnModalOpenFullSpesa && modalShoppingDetail) {
        btnModalOpenFullSpesa.addEventListener('click', () => {
            modalShoppingDetail.classList.remove('active');
            window.switchPage('spesa');
        });
    }

    // Gestisci pulizia articoli già acquistati
    if (btnClearShopping) {
        btnClearShopping.addEventListener('click', () => {
            const activeList = window.getActiveList();
            if (activeList) {
                activeList.items = activeList.items.filter(item => item.bought !== true && item.bought !== 'true');
                window.renderShopping();
            }
        });
    }

    // Gestisci filtri per categoria (chips)
    if (shoppingFilterBar) {
        shoppingFilterBar.addEventListener('click', (e) => {
            const chip = e.target.closest('.filter-chip');
            if (chip) {
                shoppingFilterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                currentShoppingFilter = chip.getAttribute('data-filter');
                window.renderShopping();
            }
        });
    }

    // Nuova Lista Modal Actions
    if (btnNewList && modalNuovaSpesa) {
        btnNewList.addEventListener('click', () => {
            if (inputNewListName) inputNewListName.value = '';
            modalNuovaSpesa.classList.add('active');
        });
    }
    if (btnCloseNuovaSpesa && modalNuovaSpesa) {
        btnCloseNuovaSpesa.addEventListener('click', () => {
            modalNuovaSpesa.classList.remove('active');
        });
    }
    if (newListForm && modalNuovaSpesa) {
        newListForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = inputNewListName.value.trim();
            if (name) {
                // Archivia la lista precedente se presente
                window.shoppingLists.forEach(list => list.archived = true);

                // Crea nuova lista
                window.shoppingLists.push({
                    id: Date.now(),
                    name: name,
                    date: new Date().toLocaleDateString('it-IT'),
                    archived: false,
                    items: []
                });

                modalNuovaSpesa.classList.remove('active');
                window.renderShopping();
            }
        });
    }

    // Funzione per riempire la cronologia liste con anteprima degli articoli
    function renderHistory() {
        if (!historyListTimeline) return;
        historyListTimeline.innerHTML = '';

        const archivedLists = window.shoppingLists.filter(list => list.archived);

        if (archivedLists.length === 0) {
            historyListTimeline.innerHTML = `
                <div class="history-empty-state">
                    <p>Nessuna spesa archiviata nella cronologia.</p>
                </div>
            `;
            return;
        }

        // Ordina cronologia dalla più recente
        archivedLists.sort((a, b) => b.id - a.id);

        archivedLists.forEach(list => {
            const card = document.createElement('div');
            card.className = "history-item-card";

            // Genera l'anteprima degli articoli della lista archiviata
            const previewHtml = list.items.length > 0
                ? `<ul class="history-preview-items">` +
                list.items.slice(0, 3).map(item => `<li>${item.bought ? '✓' : '•'} ${item.text} ${item.qty > 1 ? `(x${item.qty})` : ''}</li>`).join('') +
                (list.items.length > 3 ? `<li style="opacity:0.6; font-style:italic;">...e altri ${list.items.length - 3} articoli</li>` : '') +
                `</ul>`
                : `<p class="history-item-meta" style="margin-top: 4px; font-style: italic;">Nessun articolo inserito</p>`;

            card.innerHTML = `
                <div class="history-item-info">
                    <h4>${list.name}</h4>
                    <span class="history-item-meta">${list.date} • ${list.items.length} articoli</span>
                    ${previewHtml}
                </div>
                <div class="history-item-actions">
                    <button class="btn-restore-list" data-id="${list.id}">Usa questa lista</button>
                    <button class="btn-delete" data-id="${list.id}" style="background: rgba(255, 59, 48, 0.08); color: #ff3b30; border: none; padding: 6px 12px; border-radius: 10px; font-size: 0.8rem; font-weight:600; cursor:pointer;">Elimina</button>
                </div>
            `;
            historyListTimeline.appendChild(card);
        });
    }

    // Cronologia Modal Actions
    if (btnHistoryList && modalCronologiaSpesa) {
        btnHistoryList.addEventListener('click', () => {
            renderHistory();
            modalCronologiaSpesa.classList.add('active');
        });
    }
    if (btnCloseCronologia && modalCronologiaSpesa) {
        btnCloseCronologia.addEventListener('click', () => {
            modalCronologiaSpesa.classList.remove('active');
        });
    }
    if (historyListTimeline) {
        historyListTimeline.addEventListener('click', (e) => {
            // Ripristina lista
            const restoreBtn = e.target.closest('.btn-restore-list');
            if (restoreBtn) {
                const id = parseInt(restoreBtn.getAttribute('data-id'));

                // Archivia tutte le liste
                window.shoppingLists.forEach(list => list.archived = true);

                // Imposta la selezionata come attiva
                const listToRestore = window.shoppingLists.find(list => list.id === id);
                if (listToRestore) {
                    listToRestore.archived = false;
                }

                modalCronologiaSpesa.classList.remove('active');
                window.renderShopping();
                return;
            }

            // Elimina definitivamente la lista dalla cronologia
            const deleteBtn = e.target.closest('.btn-delete');
            if (deleteBtn) {
                const id = parseInt(deleteBtn.getAttribute('data-id'));
                if (confirm("Eliminare definitivamente questa lista della spesa?")) {
                    window.shoppingLists = window.shoppingLists.filter(list => list.id !== id);
                    renderHistory();
                    if (typeof window.syncData === 'function') window.syncData('shopping_lists');
                    window.renderShoppingWidget();
                }
            }
        });
    }

    // Edit Item Modal Actions
    if (btnCloseModifica && modalModificaArticolo) {
        btnCloseModifica.addEventListener('click', () => {
            modalModificaArticolo.classList.remove('active');
        });
    }
    if (editItemForm && modalModificaArticolo) {
        editItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = parseInt(inputEditItemId.value);
            const activeList = window.getActiveList();
            if (activeList) {
                const item = activeList.items.find(i => i.id === id);
                if (item) {
                    item.text = inputEditItemName.value.trim();
                    item.category = selectEditItemCategory.value;
                    item.qty = parseInt(inputEditItemQty.value) || 1;
                    item.notes = inputEditItemNotes.value.trim();

                    modalModificaArticolo.classList.remove('active');
                    window.renderShopping();
                }
            }
        });
    }
});
