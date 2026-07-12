// Gli array globali vengono inizializzati vuoti; verranno popolati da Supabase al login.
// La modalità mock (non loggata) usa dati di default solo in-memory senza persistenza.
window.defaultTasks = [
    { id: 1, text: "Comprare il latte", completed: true },
    { id: 2, text: "Allenamento palestra", completed: false },
    { id: 3, text: "Studiare sviluppo web", completed: false }
];
window.tasks = [];

window.defaultEvents = [
    { id: 1, time: "14:30", title: "Riunione Team", date: new Date().toISOString().split('T')[0], linkedType: null, linkedId: null },
    { id: 2, time: "18:00", title: "Spesa supermercato", date: new Date().toISOString().split('T')[0], linkedType: null, linkedId: null }
];
window.events = [];

// Strutture dati globali condivise (in-memory, fonte di verità Supabase)
window.shoppingLists = window.shoppingLists || [];
window.workoutSheets = window.workoutSheets || [];
window.workoutLogs = window.workoutLogs || [];
window.leisureData = window.leisureData || { trips: [] };

document.addEventListener('DOMContentLoaded', () => {
    // 1. IMPOSTAZIONI E PREFERENZE (LOCAL STORAGE)
    const greetingElement = document.getElementById('greeting');
    const dateElement = document.getElementById('current-date');
    const weatherPillText = document.getElementById('weather-pill-text');
    const weatherPillIcon = document.getElementById('weather-pill-icon');
    const navbarAvatar = document.getElementById('navbar-avatar');

    // Elementi pagina Impostazioni e Modal
    const btnProfile = document.getElementById('btn-profile');
    const modalProfilo = document.getElementById('modal-profilo');
    const btnCloseProfile = document.getElementById('btn-close-profile');
    const inputUsername = document.getElementById('input-username');
    const selectAvatar = document.getElementById('select-avatar');
    const selectTheme = document.getElementById('select-theme');
    const rangeBlur = document.getElementById('range-blur');
    const valBlur = document.getElementById('val-blur');
    const selectUnit = document.getElementById('select-unit');
    const btnSaveSettings = document.getElementById('btn-save-settings');

    // Elementi Preview
    const avatarPreview = document.getElementById('avatar-preview');
    const previewName = document.getElementById('preview-name');
    const previewThemeSub = document.getElementById('preview-theme-sub');

    // Valori Iniziali / Di Default
    const defaultSettings = {
        username: '',
        avatar: 'blue',
        theme: 'light',
        blur: '40',
        unit: 'C'
    };

    // Funzione per caricare le impostazioni
    window.loadSettings = function() {
        const username = localStorage.getItem('hub-username') || defaultSettings.username;
        const sessionActive = localStorage.getItem('hub-session-active') === 'true';

        const settings = {
            username: username,
            avatar: localStorage.getItem('hub-avatar') || defaultSettings.avatar,
            theme: localStorage.getItem('hub-theme') || defaultSettings.theme,
            blur: localStorage.getItem('hub-blur') || defaultSettings.blur,
            unit: localStorage.getItem('hub-unit') || defaultSettings.unit
        };

        // Popola i campi del form
        if (inputUsername) inputUsername.value = settings.username;
        if (selectAvatar) selectAvatar.value = settings.avatar;
        if (selectTheme) selectTheme.value = settings.theme;
        if (rangeBlur) rangeBlur.value = settings.blur;
        if (valBlur) valBlur.textContent = `${settings.blur}px`;
        if (selectUnit) selectUnit.value = settings.unit;

        // Popola i checkbox dei widget attivi
        const activeWidgets = {
            weather: localStorage.getItem('hub-widget-weather') !== 'false',
            tasks: localStorage.getItem('hub-widget-tasks') !== 'false',
            events: localStorage.getItem('hub-widget-events') !== 'false',
            shopping: localStorage.getItem('hub-widget-shopping') !== 'false',
            workout: localStorage.getItem('hub-widget-workout') !== 'false'
        };

        const toggleWeather = document.getElementById('toggle-weather');
        const toggleTasks = document.getElementById('toggle-tasks');
        const toggleEvents = document.getElementById('toggle-events');
        const toggleShopping = document.getElementById('toggle-shopping');
        const toggleWorkout = document.getElementById('toggle-workout');

        if (toggleWeather) toggleWeather.checked = activeWidgets.weather;
        if (toggleTasks) toggleTasks.checked = activeWidgets.tasks;
        if (toggleEvents) toggleEvents.checked = activeWidgets.events;
        if (toggleShopping) toggleShopping.checked = activeWidgets.shopping;
        if (toggleWorkout) toggleWorkout.checked = activeWidgets.workout;

        // Applica le impostazioni
        applySettings(settings);
        applyActiveWidgets(activeWidgets);

        // Se l'utente è loggato ma non ha completato l'onboarding guidato, mostra il modal
        const onboardingCompleted = localStorage.getItem('hub-onboarding-completed') === 'true';
        const sessionActive = !window.useMockAuth ? !!window.supabaseClient : localStorage.getItem('hub-session-active') === 'true';
        if (sessionActive && !onboardingCompleted) {
            const modalOnboarding = document.getElementById('modal-onboarding');
            if (modalOnboarding) {
                const step1 = document.getElementById('onboarding-step-1');
                const step2 = document.getElementById('onboarding-step-2');
                if (step1) step1.style.display = 'block';
                if (step2) step2.style.display = 'none';
                
                modalOnboarding.classList.add('active');
            }
        }
    }

    // Funzione per applicare le impostazioni alla UI
    function applySettings(settings) {
        // 1. Saluto personalizzato
        const now = new Date();
        const ora = now.getHours();
        let salutoBase = "Buonasera";
        if (ora >= 5 && ora < 12) {
            salutoBase = "Buongiorno";
        } else if (ora >= 12 && ora < 18) {
            salutoBase = "Buon pomeriggio";
        }

        if (greetingElement) {
            if (settings.username) {
                greetingElement.textContent = `${salutoBase}, ${settings.username}`;
                if (previewName) previewName.textContent = settings.username;
            } else {
                greetingElement.textContent = salutoBase;
                if (previewName) previewName.textContent = "Utente";
            }
        }

        // 2. Avatar (Gradient astratto con iniziale del nome o icona)
        const initials = settings.username ? settings.username.trim().charAt(0).toUpperCase() : '';

        let gradient = 'linear-gradient(135deg, #85a1c1, #3d6a97)'; // default blue
        switch (settings.avatar) {
            case 'green': gradient = 'linear-gradient(135deg, #8ce8a5, #2ebd59)'; break;
            case 'purple': gradient = 'linear-gradient(135deg, #c79cf2, #7a3dbf)'; break;
            case 'orange': gradient = 'linear-gradient(135deg, #ffd07d, #e67e22)'; break;
            case 'pink': gradient = 'linear-gradient(135deg, #ff9cf2, #d83bbf)'; break;
        }

        if (navbarAvatar) {
            navbarAvatar.style.background = gradient;
            navbarAvatar.style.color = '#fff';
            navbarAvatar.style.fontWeight = 'bold';
            navbarAvatar.textContent = initials || '👤';
        }

        if (avatarPreview) {
            avatarPreview.style.background = gradient;
            avatarPreview.style.color = '#fff';
            avatarPreview.style.fontWeight = 'bold';
            avatarPreview.style.fontSize = '2rem';
            avatarPreview.textContent = initials || '👤';
        }

        // 3. Tema
        document.body.className = '';
        if (settings.theme !== 'light') {
            document.body.classList.add(`theme-${settings.theme}`);
        }
        if (previewThemeSub) {
            previewThemeSub.textContent = settings.theme.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }

        // 4. Blur
        document.documentElement.style.setProperty('--glass-blur', `blur(${settings.blur}px) saturate(180%)`);

        // 5. Temperatura e sincro con modal dettagli
        if (weatherPillText) {
            const currentTempC = window.currentTempC !== undefined ? window.currentTempC : 22;
            const desc = window.currentWeatherDesc !== undefined ? window.currentWeatherDesc : 'Sereno';
            const emoji = window.currentWeatherEmoji !== undefined ? window.currentWeatherEmoji : '☀️';
            
            if (weatherPillIcon) weatherPillIcon.textContent = emoji;
            
            if (settings.unit === 'F') {
                const tempF = Math.round((currentTempC * 9/5) + 32);
                weatherPillText.textContent = `${tempF}°F ${desc}`;
            } else {
                weatherPillText.textContent = `${currentTempC}°C ${desc}`;
            }
        }
    }

    // Funzione per impostare la visibilità dei widget nella Dashboard
    function applyActiveWidgets(activeWidgets) {
        const weatherWidget = document.getElementById('weather-pill');
        const tasksWidget = document.getElementById('tasks-pill');
        const eventsWidget = document.getElementById('events-pill');
        const shoppingWidget = document.getElementById('shopping-pill');
        const workoutWidget = document.getElementById('workout-pill');

        if (weatherWidget) weatherWidget.style.display = activeWidgets.weather ? 'flex' : 'none';
        if (tasksWidget) tasksWidget.style.display = activeWidgets.tasks ? 'flex' : 'none';
        if (eventsWidget) eventsWidget.style.display = activeWidgets.events ? 'flex' : 'none';
        if (shoppingWidget) shoppingWidget.style.display = activeWidgets.shopping ? 'flex' : 'none';
        if (workoutWidget) workoutWidget.style.display = activeWidgets.workout ? 'flex' : 'none';
    }

    // Event Listeners per Impostazioni
    if (btnProfile && modalProfilo) {
        btnProfile.addEventListener('click', () => {
            window.loadSettings();
            modalProfilo.classList.add('active');
        });
    }

    if (btnCloseProfile && modalProfilo) {
        btnCloseProfile.addEventListener('click', () => {
            modalProfilo.classList.remove('active');
        });
    }

    if (modalProfilo) {
        modalProfilo.addEventListener('click', (e) => {
            if (e.target === modalProfilo) {
                modalProfilo.classList.remove('active');
            }
        });
    }

    if (rangeBlur && valBlur) {
        rangeBlur.addEventListener('input', function() {
            valBlur.textContent = `${this.value}px`;
        });
    }

    if (btnSaveSettings && modalProfilo) {
        btnSaveSettings.addEventListener('click', (e) => {
            e.preventDefault();

            // Salva opzioni principali
            localStorage.setItem('hub-username', inputUsername.value.trim());
            localStorage.setItem('hub-avatar', selectAvatar.value);
            localStorage.setItem('hub-theme', selectTheme.value);
            localStorage.setItem('hub-blur', rangeBlur.value);
            localStorage.setItem('hub-unit', selectUnit.value);

            // Salva preferenze widget
            const toggleWeather = document.getElementById('toggle-weather');
            const toggleTasks = document.getElementById('toggle-tasks');
            const toggleEvents = document.getElementById('toggle-events');
            const toggleShopping = document.getElementById('toggle-shopping');
            const toggleWorkout = document.getElementById('toggle-workout');

            localStorage.setItem('hub-widget-weather', toggleWeather ? toggleWeather.checked : 'true');
            localStorage.setItem('hub-widget-tasks', toggleTasks ? toggleTasks.checked : 'true');
            localStorage.setItem('hub-widget-events', toggleEvents ? toggleEvents.checked : 'true');
            localStorage.setItem('hub-widget-shopping', toggleShopping ? toggleShopping.checked : 'true');
            localStorage.setItem('hub-widget-workout', toggleWorkout ? toggleWorkout.checked : 'true');

            // Feedback Bottone
            btnSaveSettings.style.background = "#34c759";
            btnSaveSettings.style.color = "#fff";
            btnSaveSettings.textContent = "✓ Salvato!";

            setTimeout(() => {
                window.loadSettings();

                // Aggiorna meteo con eventuale nuova unità di misura
                if (typeof window.loadWeatherForCity === 'function') {
                    const savedCity = localStorage.getItem('hub-weather-city') || 'Milano';
                    window.loadWeatherForCity(savedCity);
                }

                btnSaveSettings.textContent = "Salva Impostazioni";
                btnSaveSettings.style.background = "";
                btnSaveSettings.style.color = "";
                modalProfilo.classList.remove('active');
            }, 800);
        });
    }

    // --- GESTIONE SUBMIT ONBOARDING ---
    const onboardingForm = document.getElementById('onboarding-form');
    const onboardingUsername = document.getElementById('onboarding-username');
    const onboardingTheme = document.getElementById('onboarding-theme');

    function initializeDefaultData() {
        // Inizializza i dati di default in-memory (NON in localStorage).
        // Per gli utenti Supabase i dati vengono caricati dal cloud; questi default
        // sono usati solo nella modalità mock (non loggata).
        if (window.tasks.length === 0) {
            window.tasks = window.defaultTasks;
        }

        if (window.events.length === 0) {
            window.events = window.defaultEvents;
        }

        if (!window.shoppingLists || window.shoppingLists.length === 0) {
            window.shoppingLists = [{
                id: Date.now(),
                name: "Spesa Settimanale",
                date: new Date().toLocaleDateString('it-IT'),
                archived: false,
                items: [
                    { id: 1, text: "Pane fresco", category: "Alimentari", qty: 1, notes: "Di grano duro", bought: false },
                    { id: 2, text: "Latte di mandorla", category: "Bevande", qty: 2, notes: "Senza zuccheri", bought: false },
                    { id: 3, text: "Detersivo piatti", category: "Casa", qty: 1, notes: "Ecologico", bought: true }
                ]
            }];
        }

        if (!window.workoutSheets || window.workoutSheets.length === 0) {
            window.workoutSheets = [{
                id: Date.now(),
                name: "Scheda Full Body",
                exercises: [
                    {
                        id: 1,
                        name: "Squat con bilanciere",
                        sets: [
                            { id: 1, weight: 60, reps: 8, completed: false },
                            { id: 2, weight: 60, reps: 8, completed: false },
                            { id: 3, weight: 60, reps: 8, completed: false }
                        ],
                        rest: "90s"
                    },
                    {
                        id: 2,
                        name: "Spinte manubri panca piana",
                        sets: [
                            { id: 1, weight: 20, reps: 10, completed: false },
                            { id: 2, weight: 20, reps: 10, completed: false }
                        ],
                        rest: "60s"
                    }
                ]
            }];
            window.activeSheetId = window.workoutSheets[0].id;
        }
    }

    // Gestione pulsanti di scorrimento del Wizard di Onboarding
    const btnOnboardingNext = document.getElementById('btn-onboarding-next');
    const btnOnboardingBack = document.getElementById('btn-onboarding-back');
    const onboardingStep1 = document.getElementById('onboarding-step-1');
    const onboardingStep2 = document.getElementById('onboarding-step-2');

    if (btnOnboardingNext) {
        btnOnboardingNext.addEventListener('click', () => {
            if (onboardingStep1) onboardingStep1.style.display = 'none';
            if (onboardingStep2) onboardingStep2.style.display = 'block';
        });
    }

    if (btnOnboardingBack) {
        btnOnboardingBack.addEventListener('click', () => {
            if (onboardingStep2) onboardingStep2.style.display = 'none';
            if (onboardingStep1) onboardingStep1.style.display = 'block';
        });
    }

    if (onboardingForm) {
        onboardingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = onboardingUsername ? onboardingUsername.value.trim() : '';
            const theme = onboardingTheme ? onboardingTheme.value : 'light';

            if (name) {
                // Salva dati inseriti localmente
                localStorage.setItem('hub-username', name);
                localStorage.setItem('hub-theme', theme);
                localStorage.setItem('hub-onboarding-completed', 'true');

                // Applica immediatamente il tema alla UI
                document.body.className = '';
                if (theme !== 'light') {
                    document.body.classList.add(`theme-${theme}`);
                }

                // Inizializza i dati di default se vuoti
                initializeDefaultData();

                // Aggiorna lo stato di onboarding completato nel database corretto
                const useMockAuth = window.useMockAuth !== false;
                const activeEmail = localStorage.getItem('hub-user-email');

                if (useMockAuth) {
                    // Aggiorna database mock locale
                    let registeredUsers = JSON.parse(localStorage.getItem('hub-registered-users')) || [];
                    const userIndex = registeredUsers.findIndex(u => u.email === activeEmail);
                    if (userIndex !== -1) {
                        registeredUsers[userIndex].onboarding_completed = true;
                        registeredUsers[userIndex].username = name;
                        localStorage.setItem('hub-registered-users', JSON.stringify(registeredUsers));
                    }
                } else if (window.supabaseClient) {
                    // Aggiorna metadati utente sul cloud Supabase
                    try {
                        const { error } = await window.supabaseClient.auth.updateUser({
                            data: { onboarding_completed: true, username: name }
                        });
                        if (error) throw error;
                    } catch (err) {
                        console.error("Errore durante l'aggiornamento metadati cloud:", err.message);
                    }
                }

                // Effetto dissolvenza per chiudere il modal
                const modalOnboarding = document.getElementById('modal-onboarding');
                if (modalOnboarding) {
                    modalOnboarding.style.opacity = '0';
                    modalOnboarding.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        modalOnboarding.classList.remove('active');
                        modalOnboarding.style.opacity = '';
                        modalOnboarding.style.transform = '';
                    }, 400);
                }

                // Aggiorna ed esegui i render di tutte le app per riflettere i default
                window.loadSettings();
                
                if (typeof window.renderTasks === 'function') window.renderTasks();
                if (typeof window.renderEvents === 'function') window.renderEvents();
                if (typeof window.renderShopping === 'function') window.renderShopping();
                if (typeof window.renderWorkoutSheets === 'function') window.renderWorkoutSheets();
                if (typeof window.renderActiveWorkoutSheet === 'function') window.renderActiveWorkoutSheet();

                // Sincronizza i dati con Supabase se loggato sul cloud
                if (typeof window.syncData === 'function') {
                    window.syncData('tasks');
                    window.syncData('events');
                    window.syncData('shopping_lists');
                    window.syncData('workout_sheets');
                }
            }
        });
    }
});
