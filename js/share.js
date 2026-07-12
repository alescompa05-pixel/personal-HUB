document.addEventListener('DOMContentLoaded', () => {
    const btnShareShopping = document.getElementById('btn-share-shopping');
    const btnShareWorkout = document.getElementById('btn-share-workout');
    const modalImport = document.getElementById('modal-import');
    const importTitle = document.getElementById('import-title');
    const importDescription = document.getElementById('import-description');
    const btnConfirmImport = document.getElementById('btn-confirm-import');
    const btnCancelImport = document.getElementById('btn-cancel-import');

    let pendingImport = null;

    // Helper per codificare in base64 URL-Safe
    function encodeData(data) {
        const jsonStr = JSON.stringify(data);
        return btoa(unescape(encodeURIComponent(jsonStr)));
    }

    // Helper per decodificare da base64 URL-Safe
    function decodeData(base64) {
        try {
            const jsonStr = decodeURIComponent(escape(atob(base64)));
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("Errore decodifica base64:", e);
            return null;
        }
    }

    // FUNZIONE CONDIVISIONE LISTA DELLA SPESA
    if (btnShareShopping) {
        btnShareShopping.addEventListener('click', async () => {
            if (typeof window.getActiveList !== 'function') return;
            const activeList = window.getActiveList();

            if (!activeList || activeList.items.length === 0) {
                alert("Non c'è nessuna lista della spesa attiva o con articoli da condividere!");
                return;
            }

            const shareData = {
                type: 'shopping',
                name: activeList.name,
                items: activeList.items.map(item => ({
                    text: item.text,
                    qty: item.qty,
                    category: item.category,
                    notes: item.notes || ''
                }))
            };

            const encoded = encodeData(shareData);
            const shareUrl = `${window.location.origin}${window.location.pathname}?share=shopping&data=${encoded}`;

            const shareTitle = `Lista spesa: ${shareData.name}`;
            const shareText = `Ecco la mia lista della spesa "${shareData.name}". Aprila nell'Hub:`;

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: shareTitle,
                        text: shareText,
                        url: shareUrl
                    });
                } catch (err) {
                    console.log("Condivisione annullata o non riuscita:", err);
                }
            } else {
                // Fallback: copia negli appunti per condivisione manuale (WhatsApp, ecc)
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert("Link di condivisione copiato negli appunti! Invialo su WhatsApp o dove preferisci.");
                }).catch(err => {
                    console.error("Errore copia link:", err);
                });
            }
        });
    }

    // FUNZIONE CONDIVISIONE SCHEDA ALLENAMENTO
    if (btnShareWorkout) {
        btnShareWorkout.addEventListener('click', async () => {
            if (!window.workoutSheets || !window.activeSheetId) {
                alert("Crea una scheda d'allenamento prima di condividerla!");
                return;
            }

            const activeSheet = window.workoutSheets.find(s => s.id === window.activeSheetId);
            if (!activeSheet || activeSheet.exercises.length === 0) {
                alert("La scheda corrente è vuota o inesistente!");
                return;
            }

            const shareData = {
                type: 'workout',
                name: activeSheet.name,
                exercises: activeSheet.exercises.map(ex => ({
                    name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                    weight: ex.weight,
                    notes: ex.notes || ''
                }))
            };

            const encoded = encodeData(shareData);
            const shareUrl = `${window.location.origin}${window.location.pathname}?share=workout&data=${encoded}`;

            const shareTitle = `Scheda palestra: ${shareData.name}`;
            const shareText = `Ecco la mia scheda di allenamento "${shareData.name}". Aprila nell'Hub:`;

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: shareTitle,
                        text: shareText,
                        url: shareUrl
                    });
                } catch (err) {
                    console.log("Condivisione annullata o non riuscita:", err);
                }
            } else {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert("Link di condivisione copiato negli appunti! Invialo su WhatsApp o dove preferisci.");
                }).catch(err => {
                    console.error("Errore copia link:", err);
                });
            }
        });
    }

    // CONTROLLO URL PER IMPORTAZIONE DATI CONDIVISI
    const urlParams = new URLSearchParams(window.location.search);
    const shareType = urlParams.get('share');
    const encodedData = urlParams.get('data');

    if (shareType && encodedData && modalImport) {
        const decoded = decodeData(encodedData);
        if (decoded) {
            pendingImport = decoded;
            
            if (decoded.type === 'shopping') {
                if (importTitle) importTitle.textContent = "Importa Lista Spesa";
                if (importDescription) {
                    importDescription.textContent = `Hai ricevuto la lista della spesa "${decoded.name}" contenente ${decoded.items.length} articoli. Vuoi aggiungerla alle tue liste?`;
                }
            } else if (decoded.type === 'workout') {
                if (importTitle) importTitle.textContent = "Importa Scheda Allenamento";
                if (importDescription) {
                    importDescription.textContent = `Hai ricevuto la scheda palestra "${decoded.name}" contenente ${decoded.exercises.length} esercizi. Vuoi aggiungerla alle tue schede?`;
                }
            }

            // Mostra il modal di importazione
            modalImport.classList.add('active');
        }
    }

    // AZIONI DEL MODAL DI IMPORTAZIONE
    if (btnCancelImport && modalImport) {
        btnCancelImport.addEventListener('click', () => {
            modalImport.classList.remove('active');
            pendingImport = null;
            // Pulisce l'URL senza ricaricare la pagina
            window.history.replaceState({}, document.title, window.location.pathname);
        });
    }

    if (btnConfirmImport && modalImport) {
        btnConfirmImport.addEventListener('click', () => {
            if (!pendingImport) return;

            const baseId = Date.now();

            if (pendingImport.type === 'shopping') {
                const newList = {
                    id: baseId,
                    name: pendingImport.name,
                    date: new Date().toLocaleDateString('it-IT'),
                    archived: false,
                    items: pendingImport.items.map((item, idx) => ({
                        id: baseId + idx,
                        text: item.text,
                        qty: item.qty || 1,
                        category: item.category || 'Alimentari',
                        notes: item.notes || '',
                        bought: false
                    }))
                };

                if (!window.shoppingLists) window.shoppingLists = [];
                
                // Rendi la vecchia lista attiva archiviata se ne esiste una attiva
                window.shoppingLists.forEach(l => {
                    if (!l.archived) l.archived = true;
                });

                window.shoppingLists.push(newList);
                localStorage.setItem('hub-shopping-lists', JSON.stringify(window.shoppingLists));

                if (typeof window.syncData === 'function') {
                    window.syncData('shopping_lists', 'upsert', newList);
                }

                if (typeof window.renderShopping === 'function') {
                    window.renderShopping();
                }

                if (typeof window.switchPage === 'function') {
                    window.switchPage('spesa');
                }

                alert(`Lista "${newList.name}" importata con successo!`);

            } else if (pendingImport.type === 'workout') {
                const newSheet = {
                    id: baseId,
                    name: pendingImport.name,
                    exercises: pendingImport.exercises.map((ex, idx) => ({
                        id: baseId + idx,
                        name: ex.name,
                        sets: ex.sets || 3,
                        reps: ex.reps || 10,
                        weight: ex.weight || 0,
                        notes: ex.notes || ''
                    }))
                };

                if (!window.workoutSheets) window.workoutSheets = [];
                window.workoutSheets.push(newSheet);
                window.activeSheetId = newSheet.id;

                localStorage.setItem('hub-workout-sheets', JSON.stringify(window.workoutSheets));

                if (typeof window.syncData === 'function') {
                    window.syncData('workout_sheets', 'upsert', newSheet);
                }

                if (typeof window.renderWorkoutSheets === 'function') {
                    window.renderWorkoutSheets();
                }
                if (typeof window.renderActiveWorkoutSheet === 'function') {
                    window.renderActiveWorkoutSheet();
                }

                if (typeof window.switchPage === 'function') {
                    window.switchPage('palestra');
                }

                alert(`Scheda "${newSheet.name}" importata con successo!`);
            }

            modalImport.classList.remove('active');
            pendingImport = null;
            // Pulisce l'URL senza ricaricare la pagina
            window.history.replaceState({}, document.title, window.location.pathname);
        });
    }

    // Chiudi cliccando fuori dall'overlay
    if (modalImport) {
        modalImport.addEventListener('click', (e) => {
            if (e.target === modalImport) {
                modalImport.classList.remove('active');
                pendingImport = null;
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        });
    }
});
