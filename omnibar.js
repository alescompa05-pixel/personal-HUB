document.addEventListener('DOMContentLoaded', () => {
    // =============================================
    // OMNIBAR / COMMAND PALETTE AVANZATA
    // =============================================
    const omnibar = document.getElementById('omnibar-input');
    const suggestionsBox = document.getElementById('omnibar-suggestions-box');
    
    // Sinonimi intenti
    const intentSynonyms = {
        spesa: ["compra", "prendi", "supermercato", "spesa", "alimentari", "articoli", "carrello", "comperare"],
        task: ["ricordami", "nota", "promemoria", "fare", "task", "chiamare", "ricorda", "doveri", "checklist", "scrivi", "ricordati"],
        focus: ["blocco", "riunione", "appuntamento", "ore", "calendario", "impegno", "blocca", "focus", "sessione", "studiare", "lavorare", "ore"],
        allenamento: ["allenamento", "palestra", "workout", "allenarmi", "allenare", "esercizi", "scheda", "sport"],
        navigazione: ["apri", "vai", "portami", "mostra", "pagina", "naviga", "sezione", "schermata"]
    };

    // Stopwords da ripulire per estrarre l'entità
    const stopwords = [
        "il", "lo", "la", "i", "gli", "le", "un", "una", "uno", "dei", "degli", "delle",
        "di", "a", "da", "in", "con", "su", "per", "tra", "fra", "al", "allo", "alla", "ai", "agli", "alle",
        "dal", "dallo", "dalla", "dai", "dagli", "dalle", "nel", "nello", "nella", "nei", "negli", "nelle",
        "sul", "sullo", "sulla", "sui", "sugli", "sulle", "voglio", "devo", "inserisci", "aggiungi", "metti",
        "ricordami", "nota", "promemoria", "crea", "pianifica", "segna", "per favore", "favore", "grazie",
        "vorrei", "comprare", "prendere", "fare", "ricordati", "aprire", "mostrare", "andare", "portami",
        "a", "o", "e", "favore", "per", "oggi"
    ];

    // Cronologia dei comandi (salvata in localStorage)
    window.commandHistory = JSON.parse(localStorage.getItem('hub-omnibar-history')) || [];
    let historyPointer = -1;

    // Indice del suggerimento selezionato da tastiera
    let activeSuggestionIndex = -1;
    let currentSuggestionsList = [];

    // Funzione di pulizia testo
    function cleanText(text) {
        let clean = text.replace(/[.,!?]/g, '');
        const words = clean.split(/\s+/);
        const filtered = words.filter(word => !stopwords.includes(word.toLowerCase()));
        let result = filtered.join(' ').trim();
        if (!result) return text.trim();
        return result;
    }

    // Algoritmo di scoring per l'intento
    function detectIntent(text) {
        const clean = text.replace(/[.,!?]/g, '').toLowerCase();
        const words = clean.split(/\s+/);
        
        const scores = {
            spesa: 0,
            task: 0,
            focus: 0,
            allenamento: 0,
            navigazione: 0
        };

        words.forEach(word => {
            Object.keys(intentSynonyms).forEach(intent => {
                if (intentSynonyms[intent].includes(word)) {
                    scores[intent] += 1;
                }
            });
        });

        let maxScore = -1;
        let bestIntent = 'generic';

        Object.keys(scores).forEach(intent => {
            if (scores[intent] > maxScore && scores[intent] > 0) {
                maxScore = scores[intent];
                bestIntent = intent;
            }
        });

        // Se l'input inizia esplicitamente con parole chiave forti, forza quell'intento
        const wordsOriginal = text.toLowerCase().split(/\s+/);
        const firstWord = wordsOriginal[0];
        if (firstWord === 'blocco') return 'focus';
        if (firstWord === 'compra' || firstWord === 'spesa') return 'spesa';
        if (firstWord === 'task' || firstWord === 'ricordami') return 'task';
        if (firstWord === 'vai' || firstWord === 'apri') return 'navigazione';

        return bestIntent;
    }

    // Parser temporale RegEx
    function parseTimeExpression(text) {
        let start = null;
        let end = null;
        let textWithoutTime = text;

        // 1. Range orario standard: "15:30-17:00", "15.30 - 17.00", "dalle 15:30 alle 17:00"
        const rangeRegex = /(?:dalle\s+)?(\d{1,2})[:\.](\d{2})\s*(?:-|alle)\s*(\d{1,2})[:\.](\d{2})/i;
        const rangeMatch = text.match(rangeRegex);
        
        if (rangeMatch) {
            start = `${rangeMatch[1].padStart(2, '0')}:${rangeMatch[2]}`;
            end = `${rangeMatch[3].padStart(2, '0')}:${rangeMatch[4]}`;
            textWithoutTime = text.replace(rangeRegex, '').trim();
        } else {
            // 2. Durate relative: "per 2 ore", "per 45 minuti", "per 1 ora"
            const durationRegex = /per\s+(\d+)\s*(ore|ora|h|minuti|min|m)/i;
            const durationMatch = text.match(durationRegex);
            
            if (durationMatch) {
                const val = parseInt(durationMatch[1]);
                const unit = durationMatch[2].toLowerCase();
                
                const now = new Date();
                const startH = now.getHours();
                const startM = now.getMinutes();
                start = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
                
                let totalMin = val;
                if (unit.startsWith('or') || unit === 'h') {
                    totalMin = val * 60;
                }
                
                const endDate = new Date(now.getTime() + totalMin * 60000);
                end = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
                textWithoutTime = text.replace(durationRegex, '').trim();
            } else {
                // 3. Orario singolo: "alle 17:30", "ore 18.00"
                const singleTimeRegex = /(?:alle|verso le|ore)\s+(\d{1,2})[:\.](\d{2})/i;
                const singleTimeMatch = text.match(singleTimeRegex);
                if (singleTimeMatch) {
                    start = `${singleTimeMatch[1].padStart(2, '0')}:${singleTimeMatch[2]}`;
                    const h = parseInt(singleTimeMatch[1]);
                    const m = parseInt(singleTimeMatch[2]);
                    end = `${((h + 1) % 24).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    textWithoutTime = text.replace(singleTimeRegex, '').trim();
                }
            }
        }

        return { start, end, cleanText: textWithoutTime };
    }

    // Mostra suggerimenti dell'omnibar
    window.renderSuggestions = function(query) {
        if (!suggestionsBox) return;
        
        if (!query) {
            // Se l'input è vuoto, mostriamo gli ultimi 3 comandi eseguiti come cronologia
            if (window.commandHistory.length > 0) {
                suggestionsBox.innerHTML = '';
                const items = window.commandHistory.slice(-3).reverse();
                
                const titleLi = document.createElement('div');
                titleLi.style.cssText = "font-size: 0.68rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; padding: 6px 14px; opacity: 0.7;";
                titleLi.textContent = "Cronologia Recente";
                suggestionsBox.appendChild(titleLi);

                items.forEach(cmd => {
                    const li = document.createElement('div');
                    li.className = 'suggestion-item';
                    li.innerHTML = `
                        <div class="suggestion-item-left">
                            <span class="suggestion-item-icon">🕒</span>
                            <span class="suggestion-item-text">${cmd}</span>
                        </div>
                        <span class="suggestion-item-hint">Premi invio</span>
                    `;
                    li.addEventListener('click', () => {
                        if (omnibar) {
                            omnibar.value = cmd;
                            window.renderSuggestions(cmd);
                            omnibar.focus();
                        }
                    });
                    suggestionsBox.appendChild(li);
                });
                suggestionsBox.style.display = 'flex';
                currentSuggestionsList = items.map(cmd => ({ type: 'history', value: cmd }));
            } else {
                suggestionsBox.style.display = 'none';
                currentSuggestionsList = [];
            }
            activeSuggestionIndex = -1;
            return;
        }

        suggestionsBox.innerHTML = '';
        const intent = detectIntent(query);
        const timeParsed = parseTimeExpression(query);
        const entityRaw = timeParsed.cleanText;
        const entityClean = cleanText(entityRaw);

        const list = [];

        // Genera suggerimenti predittivi basati sull'intento rilevato
        if (intent === 'navigazione') {
            const pages = [
                { id: 'casa', name: 'Dashboard Casa (Spesa)', icon: '🏠', hint: 'Navigazione' },
                { id: 'sport', name: 'Palestra / Schede Allenamento', icon: '🏋️', hint: 'Navigazione' },
                { id: 'tempo-libero', name: 'Tempo Libero / Relax', icon: '🛋️', hint: 'Navigazione' },
                { id: 'produttivita', name: 'Produttività', icon: '💼', hint: 'Navigazione' },
                { id: 'calendario', name: 'Calendario Intelligente', icon: '📅', hint: 'Navigazione' },
                { id: 'focus-day', name: 'Giornata Focus / Time blocking', icon: '⏱️', hint: 'Navigazione' }
            ];

            const qLower = entityClean.toLowerCase();
            const filtered = pages.filter(p => p.name.toLowerCase().includes(qLower) || p.id.includes(qLower));
            
            filtered.forEach(p => {
                list.push({
                    type: 'nav',
                    value: p.id,
                    text: `Vai a ${p.name}`,
                    icon: p.icon,
                    hint: p.hint
                });
            });
        } else if (intent === 'spesa') {
            list.push({
                type: 'spesa',
                value: entityClean,
                text: `Aggiungi "${entityClean}" alla lista della spesa`,
                icon: '🛒',
                hint: 'Spesa'
            });
        } else if (intent === 'task') {
            list.push({
                type: 'task',
                value: entityClean,
                text: `Crea promemoria: "${entityClean}"`,
                icon: '✅',
                hint: 'Task'
            });
        } else if (intent === 'focus') {
            let start = timeParsed.start || '09:00';
            let end = timeParsed.end || '10:00';
            list.push({
                type: 'focus',
                value: { title: entityClean, start, end },
                text: `Crea blocco "${entityClean}" (${start} - ${end})`,
                icon: '📅',
                hint: 'Time Block'
            });
        } else if (intent === 'allenamento') {
            list.push({
                type: 'allenamento',
                value: null,
                text: `Avvia scheda palestra attiva`,
                icon: '🏋️',
                hint: 'Allenamento'
            });
        }

        // Genera sempre delle opzioni alternative universali
        if (intent !== 'spesa' && entityClean.length > 2) {
            list.push({
                type: 'spesa',
                value: entityClean,
                text: `Aggiungi "${entityClean}" alla spesa`,
                icon: '🛒',
                hint: 'Spesa'
            });
        }
        if (intent !== 'task' && entityClean.length > 2) {
            list.push({
                type: 'task',
                value: entityClean,
                text: `Crea promemoria: "${entityClean}"`,
                icon: '✅',
                hint: 'Task'
            });
        }
        if (intent !== 'focus' && entityClean.length > 2) {
            let start = timeParsed.start || '09:00';
            let end = timeParsed.end || '10:00';
            list.push({
                type: 'focus',
                value: { title: entityClean, start, end },
                text: `Crea blocco "${entityClean}" (${start} - ${end})`,
                icon: '📅',
                hint: 'Time Block'
            });
        }

        const itemsToRender = list.slice(0, 5);
        currentSuggestionsList = itemsToRender;

        if (itemsToRender.length === 0) {
            suggestionsBox.style.display = 'none';
            return;
        }

        itemsToRender.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
                <div class="suggestion-item-left">
                    <span class="suggestion-item-icon">${item.icon}</span>
                    <span class="suggestion-item-text">${item.text}</span>
                </div>
                <span class="suggestion-item-hint">${item.hint}</span>
            `;
            div.addEventListener('click', () => {
                executeSuggestion(item);
                if (omnibar) {
                    omnibar.value = '';
                    suggestionsBox.style.display = 'none';
                    omnibar.blur();
                }
            });
            suggestionsBox.appendChild(div);
        });

        suggestionsBox.style.display = 'flex';
        activeSuggestionIndex = -1;
    }

    function executeSuggestion(item) {
        if (item.type === 'history') {
            window.gestisciComando(item.value.toLowerCase(), item.value);
            return;
        }

        saveCommandToHistory(item.text);

        if (item.type === 'nav') {
            window.switchPage(item.value);
        } else if (item.type === 'spesa') {
            const activeList = window.getActiveList();
            if (!activeList) {
                alert("Devi prima creare una Lista della Spesa!");
                return;
            }
            activeList.items.push({
                id: Date.now(),
                text: item.value.charAt(0).toUpperCase() + item.value.slice(1),
                category: "Altro",
                qty: 1,
                notes: "Aggiunto dall'assistente",
                bought: false
            });
            if (typeof window.renderShopping === 'function') window.renderShopping();
            alert(`🛒 Ho aggiunto "${item.value}" alla lista della spesa!`);
        } else if (item.type === 'task') {
            window.tasks.push({
                id: Date.now(),
                text: item.value.charAt(0).toUpperCase() + item.value.slice(1),
                completed: false
            });
            if (typeof window.renderTasks === 'function') window.renderTasks();
            alert(`✅ Ti ricorderò di "${item.value}".`);
        } else if (item.type === 'focus') {
            window.events.push({
                id: Date.now(),
                title: item.value.title.charAt(0).toUpperCase() + item.value.title.slice(1),
                time: item.value.start,
                endTime: item.value.end,
                date: new Date().toISOString().split('T')[0],
                linkedType: null,
                linkedId: null,
                allDay: false
            });
            if (typeof window.renderEvents === 'function') window.renderEvents();
            
            const calPage = document.getElementById('focus-day');
            if (calPage && calPage.classList.contains('active')) {
                if (typeof window.renderFocusTimelineBlocks === 'function') window.renderFocusTimelineBlocks();
                if (typeof window.renderFocusStatistics === 'function') window.renderFocusStatistics();
            }
            
            alert(`📅 Blocco "${item.value.title}" inserito dalle ${item.value.start} alle ${item.value.end}!`);
            window.switchPage('focus-day');
        } else if (item.type === 'allenamento') {
            const activeSheet = window.workoutSheets.find(s => s.id === window.activeSheetId);
            if (!activeSheet || activeSheet.exercises.length === 0) {
                window.switchPage('sport');
                alert("Andiamo in palestra! Ma prima seleziona una scheda.");
                return;
            }
            window.switchPage('sport');
            const modalWorkoutSession = document.getElementById('modal-workout-session');
            if (modalWorkoutSession) modalWorkoutSession.classList.add('active');
        }
    }

    function saveCommandToHistory(cmdText) {
        window.commandHistory = window.commandHistory.filter(c => c !== cmdText);
        window.commandHistory.push(cmdText);
        if (window.commandHistory.length > 10) window.commandHistory.shift();
        localStorage.setItem('hub-omnibar-history', JSON.stringify(window.commandHistory));
        historyPointer = -1;
    }

    // Listener eventi su Omnibar
    if (omnibar) {
        omnibar.addEventListener('input', function() {
            window.renderSuggestions(this.value.trim());
        });

        omnibar.addEventListener('focus', function() {
            window.renderSuggestions(this.value.trim());
        });

        omnibar.addEventListener('keydown', function(e) {
            const isSuggestionsVisible = suggestionsBox && suggestionsBox.style.display === 'flex';

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (isSuggestionsVisible && currentSuggestionsList.length > 0) {
                    activeSuggestionIndex = (activeSuggestionIndex + 1) % currentSuggestionsList.length;
                    highlightSuggestion();
                } else if (window.commandHistory.length > 0) {
                    if (historyPointer === -1) historyPointer = window.commandHistory.length;
                    historyPointer = (historyPointer + 1) % window.commandHistory.length;
                    this.value = window.commandHistory[historyPointer];
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (isSuggestionsVisible && currentSuggestionsList.length > 0) {
                    activeSuggestionIndex = (activeSuggestionIndex - 1 + currentSuggestionsList.length) % currentSuggestionsList.length;
                    highlightSuggestion();
                } else if (window.commandHistory.length > 0) {
                    if (historyPointer === -1) historyPointer = window.commandHistory.length;
                    historyPointer = (historyPointer - 1 + window.commandHistory.length) % window.commandHistory.length;
                    this.value = window.commandHistory[historyPointer];
                }
            } else if (e.key === 'Escape') {
                if (isSuggestionsVisible) {
                    suggestionsBox.style.display = 'none';
                    activeSuggestionIndex = -1;
                }
                this.blur();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (isSuggestionsVisible && activeSuggestionIndex >= 0) {
                    executeSuggestion(currentSuggestionsList[activeSuggestionIndex]);
                    this.value = '';
                    suggestionsBox.style.display = 'none';
                    this.blur();
                } else {
                    const val = this.value.trim();
                    if (val) {
                        window.gestisciComando(val.toLowerCase(), val);
                        this.value = '';
                        if (suggestionsBox) suggestionsBox.style.display = 'none';
                        this.blur();
                    }
                }
            }
        });
    }

    function highlightSuggestion() {
        if (!suggestionsBox) return;
        const items = suggestionsBox.querySelectorAll('.suggestion-item');
        items.forEach((item, idx) => {
            if (idx === activeSuggestionIndex) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (omnibar && suggestionsBox && !e.target.closest('.search-bar')) {
            suggestionsBox.style.display = 'none';
            activeSuggestionIndex = -1;
        }
    });

    window.gestisciComando = function(cmdLower, cmdOriginal) {
        saveCommandToHistory(cmdOriginal);
        
        const cleanCmd = cmdLower.replace(/[.,!?]/g, '');
        const intent = detectIntent(cmdLower);
        const timeParsed = parseTimeExpression(cmdOriginal);
        const entityClean = cleanText(timeParsed.cleanText);

        if (intent === 'focus') {
            let start = timeParsed.start || '09:00';
            let end = timeParsed.end || '10:00';
            
            window.events.push({
                id: Date.now(),
                title: entityClean.charAt(0).toUpperCase() + entityClean.slice(1),
                time: start,
                endTime: end,
                date: new Date().toISOString().split('T')[0],
                linkedType: null,
                linkedId: null,
                allDay: false
            });
            
            if (typeof window.renderEvents === 'function') window.renderEvents();
            
            const calPage = document.getElementById('focus-day');
            if (calPage && calPage.classList.contains('active')) {
                if (typeof window.renderFocusTimelineBlocks === 'function') window.renderFocusTimelineBlocks();
                if (typeof window.renderFocusStatistics === 'function') window.renderFocusStatistics();
            }
            
            alert(`📅 Blocco "${entityClean}" inserito dalle ${start} alle ${end}!`);
            window.switchPage('focus-day');
            return;
        }

        if (intent === 'spesa') {
            const activeList = window.getActiveList();
            if (!activeList) {
                alert("Devi prima creare una Lista della Spesa!");
                return;
            }

            activeList.items.push({
                id: Date.now(),
                text: entityClean.charAt(0).toUpperCase() + entityClean.slice(1),
                category: "Altro",
                qty: 1,
                notes: "Aggiunto dall'assistente",
                bought: false
            });
            if (typeof window.renderShopping === 'function') window.renderShopping();
            alert(`🛒 Ho aggiunto "${entityClean}" alla lista della spesa!`);
            return;
        }

        if (intent === 'task') {
            window.tasks.push({
                id: Date.now(),
                text: entityClean.charAt(0).toUpperCase() + entityClean.slice(1),
                completed: false
            });
            if (typeof window.renderTasks === 'function') window.renderTasks();
            alert(`✅ Ti ricorderò di "${entityClean}".`);
            return;
        }

        if (intent === 'allenamento') {
            const activeSheet = window.workoutSheets.find(s => s.id === window.activeSheetId);
            if (!activeSheet || activeSheet.exercises.length === 0) {
                window.switchPage('sport');
                alert("Andiamo in palestra! Ma prima seleziona una scheda.");
                return;
            }
            window.switchPage('sport');
            const modalWorkoutSession = document.getElementById('modal-workout-session');
            if (modalWorkoutSession) modalWorkoutSession.classList.add('active');
            return;
        }

        if (intent === 'navigazione') {
            if (cleanCmd.includes('casa') || cleanCmd.includes('spesa')) window.switchPage('casa');
            else if (cleanCmd.includes('sport') || cleanCmd.includes('palestra') || cleanCmd.includes('schede')) window.switchPage('sport');
            else if (cleanCmd.includes('relax') || cleanCmd.includes('tempo libero')) window.switchPage('tempo-libero');
            else if (cleanCmd.includes('produttiv')) window.switchPage('produttivita');
            else if (cleanCmd.includes('calendario')) window.switchPage('calendario');
            else if (cleanCmd.includes('focus')) window.switchPage('focus-day');
            else window.switchPage('dashboard');
            return;
        }

        alert(`Non ho capito il comando "${cmdOriginal}". Prova con: "compra latte", "ricordami di studiare", "blocco 15:00-17:00 palestra" oppure "vai a calendario".`);
    }

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
            e.preventDefault();
            e.stopPropagation();
            if (omnibar) {
                const activePage = document.querySelector('.page.active');
                if (activePage && activePage.id !== 'dashboard') {
                    window.switchPage('dashboard');
                }
                
                setTimeout(() => {
                    omnibar.focus();
                    omnibar.select();
                    if (typeof window.renderSuggestions === 'function') {
                        window.renderSuggestions('');
                    }
                }, 50);
            }
        }
    });
});
