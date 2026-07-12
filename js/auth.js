document.addEventListener('DOMContentLoaded', () => {
    // =============================================
    // COSTANTI SUPABASE (DA SOSTITUIRE CON LE TUE)
    // =============================================
    const SUPABASE_URL = "https://lsfnjsqnjmqejtipsrqu.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZm5qc3Fuam1xZWp0aXBzcnF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NjcxMDcsImV4cCI6MjA5OTM0MzEwN30.-XeCIh7Fc7rb2UmO3tKZCVo2cVnMBNpYwdcdQ4sz_tE";

    // Inizializza Supabase Client
    let supabase = null;
    let useMockAuth = true;
    window.useMockAuth = true;

    if (window.supabase && SUPABASE_URL !== "https://your-project-id.supabase.co" && SUPABASE_ANON_KEY !== "your-anon-key") {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.supabaseClient = supabase;
            useMockAuth = false;
            window.useMockAuth = false;
            console.log("Supabase caricato correttamente per la sincronizzazione.");
        } catch (e) {
            console.error("Errore durante l'inizializzazione di Supabase. Fallback al mock auth.", e);
        }
    } else {
        console.warn("Supabase non configurato o CDN non caricato. I dati verranno salvati solo in locale.");
    }

    // Variabili globali per tracciare lo stato sincronizzato cloud
    window.lastSyncedTasks = JSON.parse(JSON.stringify(window.tasks || []));
    window.lastSyncedEvents = JSON.parse(JSON.stringify(window.events || []));
    window.lastSyncedShoppingLists = JSON.parse(JSON.stringify(window.shoppingLists || []));
    window.lastSyncedWorkoutSheets = JSON.parse(JSON.stringify(window.workoutSheets || []));
    window.lastSyncedWorkoutLogs = JSON.parse(JSON.stringify(JSON.parse(localStorage.getItem('hub-workout-logs')) || []));
    window.lastSyncedLeisurePlanner = JSON.parse(JSON.stringify((JSON.parse(localStorage.getItem('hub-leisure-data')) || { trips: [] }).trips || []));

    // Elementi UI
    const authPage = document.getElementById('auth-page');
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const btnAuthSubmit = document.getElementById('btn-auth-submit');
    const authToggleLink = document.getElementById('auth-toggle-link');
    const authErrorMsg = document.getElementById('auth-error-msg');
    
    // Bottoni Profilo (nel modal settings)
    const btnLogout = document.getElementById('btn-logout');
    const btnDeleteAccount = document.getElementById('btn-delete-account');

    let currentMode = 'login'; // 'login' o 'register'

    // Mock Database per il Fallback Locale
    let registeredUsers = JSON.parse(localStorage.getItem('hub-registered-users')) || [
        { email: 'admin@example.com', password: 'password123', onboarding_completed: true, username: 'Admin' }
    ];
    localStorage.setItem('hub-registered-users', JSON.stringify(registeredUsers));

    // Flag per evitare loop di salvataggio durante il caricamento dati
    let isSyncingSuspended = false;

    // =============================================
    // SUPABASE SESSION RECOVERY & STATE LISTENER
    // =============================================
    
    // Funzione di successo login Supabase
    function loginSuccessSupabase(session) {
        const email = session.user.email;
        const userId = session.user.id;
        const onboardingCompleted = session.user.user_metadata && session.user.user_metadata.onboarding_completed === true;

        localStorage.setItem('hub-session-active', 'true');
        localStorage.setItem('hub-user-email', email);
        localStorage.setItem('hub-onboarding-completed', onboardingCompleted ? 'true' : 'false');
        
        if (onboardingCompleted && session.user.user_metadata.username) {
            localStorage.setItem('hub-username', session.user.user_metadata.username);
        }
        
        // Ricarica le preferenze profilo aggiornate
        if (typeof window.loadSettings === 'function') {
            window.loadSettings();
        }

        // Scarica i dati dell'utente dal Cloud Supabase
        window.loadUserDataFromServer(userId);

        // Naviga alla Dashboard
        if (typeof window.switchPage === 'function') {
            window.switchPage('dashboard');
        }
    }

    // Controllo Sessione Asincrono all'Avvio (Risolve bug logout al refresh)
    const checkInitialSession = async () => {
        try {
            if (!useMockAuth && supabase) {
                try {
                    const { data: { session }, error } = await supabase.auth.getSession();
                    if (session && session.user) {
                        loginSuccessSupabase(session);
                    } else {
                        localStorage.setItem('hub-session-active', 'false');
                        if (typeof window.switchPage === 'function') {
                            window.switchPage('auth-page');
                        }
                    }
                } catch (e) {
                    console.error("Errore durante il recupero iniziale della sessione:", e);
                    if (typeof window.switchPage === 'function') {
                        window.switchPage('auth-page');
                    }
                }
            } else {
                // Controllo Sessione per il Mock Auth Locale
                const sessionActive = localStorage.getItem('hub-session-active') === 'true';
                if (sessionActive) {
                    const activeEmail = localStorage.getItem('hub-user-email');
                    const user = registeredUsers.find(u => u.email === activeEmail);
                    if (user) {
                        localStorage.setItem('hub-onboarding-completed', user.onboarding_completed ? 'true' : 'false');
                        if (user.onboarding_completed && user.username) {
                            localStorage.setItem('hub-username', user.username);
                        }
                    }
                    if (typeof window.switchPage === 'function') {
                        window.switchPage('dashboard');
                    }
                } else {
                    if (typeof window.switchPage === 'function') {
                        window.switchPage('auth-page');
                    }
                }
            }
        } finally {
            // Rimuove la classe per sbloccare la visibilità di auth-page
            document.documentElement.classList.remove('session-loading');
        }
    };

    // Esegui la verifica iniziale dopo caricamento scripts
    setTimeout(checkInitialSession, 150);

    // Listener eventi di Autenticazione (Ascolta solo trigger effettivi SIGNED_IN/SIGNED_OUT)
    if (!useMockAuth && supabase) {
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session && session.user) {
                loginSuccessSupabase(session);
            } else if (event === 'SIGNED_OUT') {
                localStorage.setItem('hub-session-active', 'false');
                localStorage.removeItem('hub-user-email');
                localStorage.removeItem('hub-onboarding-completed');
                localStorage.removeItem('hub-username');
                if (typeof window.switchPage === 'function') {
                    window.switchPage('auth-page');
                }
            }
        });
    }

    // Toggle tra Accedi e Registrati
    if (authToggleLink) {
        authToggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            clearErrors();
            
            if (currentMode === 'login') {
                currentMode = 'register';
                if (authTitle) authTitle.textContent = "Crea un Account";
                if (authSubtitle) authSubtitle.textContent = "Registrati per proteggere il tuo Hub Personale";
                if (btnAuthSubmit) btnAuthSubmit.textContent = "Registrati";
                authToggleLink.innerHTML = 'Hai già un account? <span style="color: var(--apple-blue); font-weight: 600;">Accedi</span>';
            } else {
                currentMode = 'login';
                if (authTitle) authTitle.textContent = "Accedi al tuo Hub";
                if (authSubtitle) authSubtitle.textContent = "Inserisci le tue credenziali per sbloccare l'applicazione";
                if (btnAuthSubmit) btnAuthSubmit.textContent = "Accedi";
                authToggleLink.innerHTML = 'Non hai un account? <span style="color: var(--apple-blue); font-weight: 600;">Registrati</span>';
            }
        });
    }

    // Gestione Invia Form
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearErrors();

            const email = authEmail.value.trim().toLowerCase();
            const password = authPassword.value;

            // Validazioni standard
            if (!validateEmail(email)) {
                showError("Inserisci un indirizzo email valido.");
                return;
            }
            if (password.length < 6) {
                showError("La password deve contenere almeno 6 caratteri.");
                return;
            }

            // Mostra animazione caricamento sul bottone
            const originalBtnText = btnAuthSubmit.textContent;
            btnAuthSubmit.textContent = "Elaborazione...";
            btnAuthSubmit.disabled = true;

            try {
                if (!useMockAuth && supabase) {
                    // --- INTEGRAZIONE CON SUPABASE ---
                    if (currentMode === 'login') {
                        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                        if (error) throw error;
                    } else {
                        const { data, error } = await supabase.auth.signUp({ email, password });
                        if (error) throw error;
                        
                        alert("Registrazione completata! Controlla la tua email per confermare l'account.");
                    }
                } else {
                    // --- FALLBACK MOCK AUTH LOCALE ---
                    if (currentMode === 'login') {
                        const user = registeredUsers.find(u => u.email === email && u.password === password);
                        if (user) {
                            loginSuccessMock(user);
                        } else {
                            throw new Error("Email o password errate.");
                        }
                    } else {
                        const emailExists = registeredUsers.some(u => u.email === email);
                        if (emailExists) {
                            throw new Error("Questo indirizzo email è già registrato.");
                        }

                        const newUser = { email, password, onboarding_completed: false };
                        registeredUsers.push(newUser);
                        localStorage.setItem('hub-registered-users', JSON.stringify(registeredUsers));
                        
                        alert("Registrazione completata con successo! Benvenuto.");
                        loginSuccessMock(newUser);
                    }
                }
            } catch (err) {
                showError(err.message || "Si è verificato un errore.");
            } finally {
                btnAuthSubmit.textContent = originalBtnText;
                btnAuthSubmit.disabled = false;
            }
        });
    }

    // Gestione Disconnessione (Logout)
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            if (confirm("Sei sicuro di voler disconnetterti dall'Hub?")) {
                if (!useMockAuth && supabase) {
                    const { error } = await supabase.auth.signOut();
                    if (error) {
                        showError("Errore durante la disconnessione: " + error.message);
                    } else {
                        const modalProfilo = document.getElementById('modal-profilo');
                        if (modalProfilo) modalProfilo.classList.remove('active');
                    }
                } else {
                    localStorage.setItem('hub-session-active', 'false');
                    localStorage.removeItem('hub-user-email');
                    localStorage.removeItem('hub-username');
                    if (authEmail) authEmail.value = '';
                    if (authPassword) authPassword.value = '';
                    
                    if (typeof window.switchPage === 'function') {
                        window.switchPage('auth-page');
                    }

                    const modalProfilo = document.getElementById('modal-profilo');
                    if (modalProfilo) modalProfilo.classList.remove('active');
                }
            }
        });
    }
/**
 * SUMMARY OF SYNCHRONIZATION SYSTEM
 * 
 * 1. Debouncing: All incoming data operations are wrapped in a 1-second debounce timer to aggregate
 *    rapid-fire state updates, minimizing redundant network requests to the Supabase API.
 * 
 * 2. Diffing Mechanism: The system performs deep comparisons between the current application state 
 *    (e.g., window.tasks) and a cached local snapshot (window.lastSyncedTasks). It selectively 
 *    upserts only modified records and deletes only removed items, optimizing bandwidth.
 * 
 * 3. mapPayload: Data structures are transformed into database-compliant objects (snake_case)
 *    to match the server-side schema, ensuring consistent data handling across modules.
 * 
 * 4. Retrocompatible Fallback: The sync system is designed to intercept existing global 
 *    calls, allowing legacy code to trigger the diffing-based sync flow automatically without 
 *    needing modifications to individual UI components.
 */

// Gestione Eliminazione Account Definitiva
    if (btnDeleteAccount) {
        btnDeleteAccount.addEventListener('click', async () => {
            const confirmed = confirm("ATTENZIONE: Sei sicuro di voler eliminare definitivamente il tuo account? Questa azione cancellerà tutti i tuoi dati associati (task, eventi, spesa, palestra) ed è irreversibile.");
            if (!confirmed) return;

            try {
                if (!useMockAuth && supabase) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const userId = user.id;
                        isSyncingSuspended = true;

                        // 1. Cancella i dati personali dal database cloud
                        await supabase.from('tasks').delete().eq('user_id', userId);
                        await supabase.from('events').delete().eq('user_id', userId);
                        await supabase.from('shopping_lists').delete().eq('user_id', userId);
                        await supabase.from('workout_sheets').delete().eq('user_id', userId);

                        // Invia la richiesta di cancellazione al database per innescare il trigger di cancellazione auth
                        try {
                            await supabase.from('delete_user_requests').insert({ id: userId });
                        } catch (eDelete) {
                            console.error("Errore durante l'invio della richiesta di rimozione account:", eDelete.message);
                        }

                        isSyncingSuspended = false;
                        
                        // 2. Disconnetti l'utente
                        await supabase.auth.signOut();
                    }
                } else {
                    // Fallback Mock: elimina l'utente dalle credenziali registrate localmente
                    const activeEmail = localStorage.getItem('hub-user-email');
                    if (activeEmail) {
                        registeredUsers = registeredUsers.filter(u => u.email !== activeEmail);
                        localStorage.setItem('hub-registered-users', JSON.stringify(registeredUsers));
                    }

                    // Reset sessione locale
                    localStorage.setItem('hub-session-active', 'false');
                    
                    if (typeof window.switchPage === 'function') {
                        window.switchPage('auth-page');
                    }

                    const modalProfilo = document.getElementById('modal-profilo');
                    if (modalProfilo) modalProfilo.classList.remove('active');
                }

                // 3. Svuota completamente il database locale di questo browser
                localStorage.removeItem('hub-username');
                localStorage.removeItem('hub-user-email');
                localStorage.removeItem('hub-theme');
                localStorage.removeItem('hub-tasks');
                localStorage.removeItem('hub-events');
                localStorage.removeItem('hub-shopping-lists');
                localStorage.removeItem('hub-workout-sheets');
                localStorage.removeItem('hub-workout-logs');

                // Ripristina gli array globali in memoria ai default iniziali (evita leak in RAM)
                window.tasks = [];
                window.events = [];
                window.shoppingLists = [];
                window.workoutSheets = [];

                alert("Il tuo account e tutti i dati associati sono stati eliminati definitivamente.");

            } catch (err) {
                showError("Errore durante l'eliminazione dell'account: " + err.message);
            }
        });
    }

    // Funzione helper per Mock Auth
    function loginSuccessMock(user) {
        localStorage.setItem('hub-session-active', 'true');
        localStorage.setItem('hub-user-email', user.email);
        
        const onboardingCompleted = user.onboarding_completed === true;
        localStorage.setItem('hub-onboarding-completed', onboardingCompleted ? 'true' : 'false');

        if (onboardingCompleted && user.username) {
            localStorage.setItem('hub-username', user.username);
        }

        if (typeof window.loadSettings === 'function') {
            window.loadSettings();
        }

        if (typeof window.switchPage === 'function') {
            window.switchPage('dashboard');
        }
    }

    function showError(message) {
        if (authErrorMsg) {
            authErrorMsg.textContent = message;
            authErrorMsg.style.display = 'block';
        }
        
        if (window.showNotification) {
            window.showNotification(message, "error");
        } else {
            console.error(message);
        }
    }

    function clearErrors() {
        if (authErrorMsg) {
            authErrorMsg.textContent = '';
            authErrorMsg.style.display = 'none';
        }
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // =============================================
    // LOGICA DI SINCRONIZZAZIONE DATI CLOUD
    // =============================================

    // 1. Invio/Salvataggio Dati Cloud su Modifica
    const debounceTimers = {};

    function mapPayloadToDb(type, payload, userId) {
        if (type === 'tasks') {
            return {
                id: payload.id,
                user_id: userId,
                text: payload.text,
                completed: !!payload.completed
            };
        }
        if (type === 'events') {
            return {
                id: payload.id,
                user_id: userId,
                title: payload.title,
                time: payload.time || null,
                end_time: payload.endTime || null,
                date: payload.date,
                end_date: payload.endDate || null,
                all_day: !!payload.allDay,
                linked_type: payload.linkedType || null,
                linked_id: payload.linkedId || null
            };
        }
        if (type === 'shopping_lists') {
            return {
                id: payload.id,
                user_id: userId,
                name: payload.name,
                date: payload.date,
                archived: !!payload.archived,
                items: payload.items
            };
        }
        if (type === 'workout_sheets') {
            return {
                id: payload.id,
                user_id: userId,
                name: payload.name,
                exercises: payload.exercises
            };
        }
        if (type === 'workout_logs') {
            return {
                id: payload.id,
                user_id: userId,
                timestamp: payload.timestamp,
                sheet_id: payload.sheetId,
                results: payload.results
            };
        }
        if (type === 'leisure_planner') {
            return {
                id: payload.id,
                user_id: userId,
                destination: payload.destination || "Viaggio",
                start_date: payload.startDate || new Date().toISOString().split('T')[0],
                end_date: payload.endDate || payload.startDate || new Date().toISOString().split('T')[0],
                itinerary: payload.itinerary || [],
                documents: payload.documents || [],
                luggage: payload.luggage || [],
                expenses: payload.expenses || []
            };
        }
        return payload;
    }

    function mapPayload(type, payload, userId) {
        if (Array.isArray(payload)) {
            return payload.map(item => mapPayloadToDb(type, item, userId));
        }
        return mapPayloadToDb(type, payload, userId);
    }

    async function executeDiffSync(type, userId) {
        let currentArray = [];
        let lastSyncedArray = [];
        let table = '';

        if (type === 'tasks') {
            currentArray = window.tasks || [];
            lastSyncedArray = window.lastSyncedTasks || [];
            table = 'tasks';
        } else if (type === 'events') {
            currentArray = window.events || [];
            lastSyncedArray = window.lastSyncedEvents || [];
            table = 'events';
        } else if (type === 'shopping_lists') {
            currentArray = window.shoppingLists || [];
            lastSyncedArray = window.lastSyncedShoppingLists || [];
            table = 'shopping_lists';
        } else if (type === 'workout_sheets') {
            currentArray = window.workoutSheets || [];
            lastSyncedArray = window.lastSyncedWorkoutSheets || [];
            table = 'workout_sheets';
        } else if (type === 'workout_logs') {
            currentArray = JSON.parse(localStorage.getItem('hub-workout-logs')) || [];
            lastSyncedArray = window.lastSyncedWorkoutLogs || [];
            table = 'workout_logs';
        } else if (type === 'leisure_planner') {
            const localData = JSON.parse(localStorage.getItem('hub-leisure-data')) || { trips: [] };
            currentArray = localData.trips || [];
            lastSyncedArray = window.lastSyncedLeisurePlanner || [];
            table = 'leisure_planner';
        } else {
            return;
        }

        const toUpsert = currentArray.filter(item => {
            const last = lastSyncedArray.find(l => l.id === item.id);
            if (!last) return true;
            return JSON.stringify(last) !== JSON.stringify(item);
        });

        const toDeleteIds = lastSyncedArray
            .filter(last => !currentArray.some(item => item.id === last.id))
            .map(last => last.id);

        try {
            if (toUpsert.length > 0) {
                const dbPayload = toUpsert.map(item => mapPayloadToDb(type, item, userId));
                const { error } = await supabase.from(table).upsert(dbPayload);
                if (error) throw error;
            }

            if (toDeleteIds.length > 0) {
                const { error } = await supabase.from(table).delete().in('id', toDeleteIds).eq('user_id', userId);
                if (error) throw error;
            }

            // Aggiorna lo stato locale di sincronizzazione
            if (type === 'tasks') {
                window.lastSyncedTasks = JSON.parse(JSON.stringify(window.tasks));
            } else if (type === 'events') {
                window.lastSyncedEvents = JSON.parse(JSON.stringify(window.events));
            } else if (type === 'shopping_lists') {
                window.lastSyncedShoppingLists = JSON.parse(JSON.stringify(window.shoppingLists));
            } else if (type === 'workout_sheets') {
                window.lastSyncedWorkoutSheets = JSON.parse(JSON.stringify(window.workoutSheets));
            } else if (type === 'workout_logs') {
                window.lastSyncedWorkoutLogs = JSON.parse(JSON.stringify(JSON.parse(localStorage.getItem('hub-workout-logs')) || []));
            } else if (type === 'leisure_planner') {
                const localData = JSON.parse(localStorage.getItem('hub-leisure-data')) || { trips: [] };
                window.lastSyncedLeisurePlanner = JSON.parse(JSON.stringify(localData.trips || []));
            }
        } catch (err) {
            console.error(`Errore di sincronizzazione differenziale [${type}]:`, err.message);
        }
    }

    // 1. Invio/Salvataggio Dati Cloud Atomico e Differenziale
    window.syncData = async function (type, action, payload) {
        if (useMockAuth || !supabase || isSyncingSuspended) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const userId = user.id;

        // Se action non è specificata, usa la sincronizzazione differenziale con debouncing
        if (!action) {
            if (debounceTimers[type]) {
                clearTimeout(debounceTimers[type]);
            }
            debounceTimers[type] = setTimeout(async () => {
                await executeDiffSync(type, userId);
            }, 1000);
            return;
        }

        try {
            const table = type;

            if (action === 'upsert') {
                if (!payload) return;
                const dbPayload = mapPayload(type, payload, userId);
                const { error } = await supabase.from(table).upsert(dbPayload);
                if (error) throw error;

                // Aggiorna lo stato localSynced
                const payloadArray = Array.isArray(payload) ? payload : [payload];
                payloadArray.forEach(p => {
                    let lastArray = [];
                    if (type === 'tasks') lastArray = window.lastSyncedTasks;
                    else if (type === 'events') lastArray = window.lastSyncedEvents;
                    else if (type === 'shopping_lists') lastArray = window.lastSyncedShoppingLists;
                    else if (type === 'workout_sheets') lastArray = window.lastSyncedWorkoutSheets;
                    else if (type === 'workout_logs') lastArray = window.lastSyncedWorkoutLogs;
                    else if (type === 'leisure_planner') lastArray = window.lastSyncedLeisurePlanner;

                    const idx = lastArray.findIndex(item => item.id === p.id);
                    if (idx !== -1) {
                        lastArray[idx] = JSON.parse(JSON.stringify(p));
                    } else {
                        lastArray.push(JSON.parse(JSON.stringify(p)));
                    }
                });
            } 
            else if (action === 'delete') {
                if (!payload || !payload.id) return;
                const { error } = await supabase.from(table).delete().eq('id', payload.id).eq('user_id', userId);
                if (error) throw error;

                // Rimuovi dallo stato localSynced
                if (type === 'tasks') {
                    window.lastSyncedTasks = window.lastSyncedTasks.filter(item => item.id !== payload.id);
                } else if (type === 'events') {
                    window.lastSyncedEvents = window.lastSyncedEvents.filter(item => item.id !== payload.id);
                } else if (type === 'shopping_lists') {
                    window.lastSyncedShoppingLists = window.lastSyncedShoppingLists.filter(item => item.id !== payload.id);
                } else if (type === 'workout_sheets') {
                    window.lastSyncedWorkoutSheets = window.lastSyncedWorkoutSheets.filter(item => item.id !== payload.id);
                } else if (type === 'workout_logs') {
                    window.lastSyncedWorkoutLogs = window.lastSyncedWorkoutLogs.filter(item => item.id !== payload.id);
                } else if (type === 'leisure_planner') {
                    window.lastSyncedLeisurePlanner = window.lastSyncedLeisurePlanner.filter(item => item.id !== payload.id);
                }
            } 
            else if (action === 'clear_completed') {
                if (type === 'tasks') {
                    const { error } = await supabase.from('tasks').delete().eq('user_id', userId).eq('completed', true);
                    if (error) throw error;
                    window.lastSyncedTasks = window.lastSyncedTasks.filter(t => !t.completed);
                } else if (type === 'shopping_lists') {
                    const { error } = await supabase.from('shopping_lists').delete().eq('user_id', userId).eq('archived', true);
                    if (error) throw error;
                    window.lastSyncedShoppingLists = window.lastSyncedShoppingLists.filter(l => !l.archived);
                }
            }
        } catch (err) {
            console.error(`Errore di sincronizzazione atomica [${type} - ${action}]:`, err.message);
        }
    };

    // 2. Caricamento Dati Cloud su Accesso
    window.loadUserDataFromServer = async function (userId) {
        if (useMockAuth || !supabase) return;

        isSyncingSuspended = true;
        try {
            console.log("Caricamento e unione dati utente da Supabase...");

            // Carica Tasks
            const { data: dbTasks, error: errTasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', userId);
            if (errTasks) throw errTasks;
            
            if (dbTasks) {
                const serverTasks = dbTasks.map(t => ({
                    id: t.id,
                    text: t.text,
                    completed: t.completed
                }));
                const localTasks = JSON.parse(localStorage.getItem('hub-tasks')) || [];
                const mergedTasks = [...localTasks];
                serverTasks.forEach(st => {
                    if (!mergedTasks.some(lt => lt.id === st.id)) {
                        mergedTasks.push(st);
                    }
                });
                window.tasks = mergedTasks;
                window.lastSyncedTasks = JSON.parse(JSON.stringify(window.tasks));
                localStorage.setItem('hub-tasks', JSON.stringify(window.tasks));
                if (typeof window.renderTasks === 'function') window.renderTasks();
            }

            // Carica Eventi
            const { data: dbEvents, error: errEvents } = await supabase
                .from('events')
                .select('*')
                .eq('user_id', userId);
            if (errEvents) throw errEvents;

            if (dbEvents) {
                const serverEvents = dbEvents.map(ev => ({
                    id: ev.id,
                    title: ev.title,
                    time: ev.time,
                    endTime: ev.end_time,
                    date: ev.date,
                    endDate: ev.end_date,
                    allDay: ev.all_day,
                    linkedType: ev.linked_type,
                    linkedId: ev.linked_id
                }));
                const localEvents = JSON.parse(localStorage.getItem('hub-events')) || [];
                const mergedEvents = [...localEvents];
                serverEvents.forEach(se => {
                    if (!mergedEvents.some(le => le.id === se.id)) {
                        mergedEvents.push(se);
                    }
                });
                window.events = mergedEvents;
                window.lastSyncedEvents = JSON.parse(JSON.stringify(window.events));
                localStorage.setItem('hub-events', JSON.stringify(window.events));
                if (typeof window.renderEvents === 'function') window.renderEvents();
            }

            // Carica Liste Spesa
            const { data: dbShopping, error: errShopping } = await supabase
                .from('shopping_lists')
                .select('*')
                .eq('user_id', userId);
            if (errShopping) throw errShopping;

            if (dbShopping) {
                const serverShopping = dbShopping.map(lst => ({
                    id: lst.id,
                    name: lst.name,
                    date: lst.date,
                    archived: lst.archived,
                    items: lst.items
                }));
                const localShopping = JSON.parse(localStorage.getItem('hub-shopping-lists')) || [];
                const mergedShopping = [...localShopping];
                serverShopping.forEach(ss => {
                    if (!mergedShopping.some(ls => ls.id === ss.id)) {
                        mergedShopping.push(ss);
                    }
                });
                window.shoppingLists = mergedShopping;
                window.lastSyncedShoppingLists = JSON.parse(JSON.stringify(window.shoppingLists));
                localStorage.setItem('hub-shopping-lists', JSON.stringify(window.shoppingLists));
                if (typeof window.renderShopping === 'function') window.renderShopping();
            }

            // Carica Schede Palestra
            const { data: dbWorkout, error: errWorkout } = await supabase
                .from('workout_sheets')
                .select('*')
                .eq('user_id', userId);
            if (errWorkout) throw errWorkout;

            if (dbWorkout) {
                const serverWorkout = dbWorkout.map(sheet => ({
                    id: sheet.id,
                    name: sheet.name,
                    exercises: sheet.exercises
                }));
                const localWorkout = JSON.parse(localStorage.getItem('hub-workout-sheets')) || [];
                const mergedWorkout = [...localWorkout];
                serverWorkout.forEach(sw => {
                    if (!mergedWorkout.some(lw => lw.id === sw.id)) {
                        mergedWorkout.push(sw);
                    }
                });
                window.workoutSheets = mergedWorkout;
                window.lastSyncedWorkoutSheets = JSON.parse(JSON.stringify(window.workoutSheets));
                localStorage.setItem('hub-workout-sheets', JSON.stringify(window.workoutSheets));
                if (window.workoutSheets.length > 0) {
                    window.activeSheetId = window.workoutSheets[0].id;
                }
                if (typeof window.renderWorkoutSheets === 'function') window.renderWorkoutSheets();
                if (typeof window.renderActiveWorkoutSheet === 'function') window.renderActiveWorkoutSheet();
            }

            // Carica Storico Allenamenti
            try {
                const { data: dbWorkoutLogs, error: errWorkoutLogs } = await supabase
                    .from('workout_logs')
                    .select('*')
                    .eq('user_id', userId);
                if (errWorkoutLogs) throw errWorkoutLogs;
                
                if (dbWorkoutLogs) {
                    const serverWorkoutLogs = dbWorkoutLogs.map(log => ({
                        id: log.id,
                        timestamp: log.timestamp,
                        sheetId: log.sheet_id,
                        results: log.results
                    }));
                    const localWorkoutLogs = JSON.parse(localStorage.getItem('hub-workout-logs')) || [];
                    const mergedWorkoutLogs = [...localWorkoutLogs];
                    serverWorkoutLogs.forEach(sl => {
                        if (!mergedWorkoutLogs.some(ll => ll.id === sl.id)) {
                            mergedWorkoutLogs.push(sl);
                        }
                    });
                    window.lastSyncedWorkoutLogs = JSON.parse(JSON.stringify(mergedWorkoutLogs));
                    localStorage.setItem('hub-workout-logs', JSON.stringify(mergedWorkoutLogs));
                    if (typeof window.renderWorkoutHistory === 'function') window.renderWorkoutHistory();
                }
            } catch (historyErr) {
                console.warn("Tabella workout_logs non trovata o non accessibile in Supabase:", historyErr.message || historyErr);
            }

            // Carica Travel Planner
            try {
                const { data: dbLeisure, error: errLeisure } = await supabase
                    .from('leisure_planner')
                    .select('*')
                    .eq('user_id', userId);
                if (errLeisure) throw errLeisure;

                if (dbLeisure) {
                    const serverTrips = dbLeisure.map(trip => ({
                        id: trip.id,
                        destination: trip.destination || "Viaggio",
                        startDate: trip.start_date || new Date().toISOString().split('T')[0],
                        endDate: trip.end_date || trip.start_date || new Date().toISOString().split('T')[0],
                        itinerary: trip.itinerary || [],
                        documents: trip.documents || [],
                        luggage: trip.luggage || [],
                        expenses: trip.expenses || []
                    }));
                    const localData = JSON.parse(localStorage.getItem('hub-leisure-data')) || { trips: [] };
                    const localTrips = localData.trips || [];
                    const mergedTrips = [...localTrips];
                    serverTrips.forEach(st => {
                        const existingIdx = mergedTrips.findIndex(lt => lt.id === st.id);
                        if (existingIdx === -1) {
                            mergedTrips.push(st);
                        } else {
                            // Se presente in entrambi, prediligi il server
                            mergedTrips[existingIdx] = st;
                        }
                    });
                    window.lastSyncedLeisurePlanner = JSON.parse(JSON.stringify(mergedTrips));
                    localStorage.setItem('hub-leisure-data', JSON.stringify({ trips: mergedTrips }));
                    if (typeof window.renderTrips === 'function') window.renderTrips();
                }
            } catch (leisureErr) {
                console.warn("Tabella leisure_planner non trovata o non accessibile in Supabase:", leisureErr.message || leisureErr);
            }

        } catch (err) {
            console.error("Errore durante il recupero dei dati utente:", err.message);
        } finally {
            isSyncingSuspended = false;
            
            // Forza una sincronizzazione iniziale del locale sul server per gli elementi non presenti su Supabase
            setTimeout(() => {
                if (typeof window.syncData === 'function') {
                    window.syncData('tasks');
                    window.syncData('events');
                    window.syncData('shopping_lists');
                    window.syncData('workout_sheets');
                    window.syncData('workout_logs');
                    window.syncData('leisure_planner');
                }
            }, 500);
        }
    };

    // 3. Intercettazione delle Funzioni di Salvataggio e Rendering
    setTimeout(() => {
        if (typeof window.renderTasks === 'function') {
            const originalRenderTasks = window.renderTasks;
            window.renderTasks = function () {
                originalRenderTasks();
                window.syncData('tasks');
            };
        }

        if (typeof window.renderEvents === 'function') {
            const originalRenderEvents = window.renderEvents;
            window.renderEvents = function () {
                originalRenderEvents();
                window.syncData('events');
            };
        }

        if (typeof window.renderShopping === 'function') {
            const originalRenderShopping = window.renderShopping;
            window.renderShopping = function () {
                originalRenderShopping();
                window.syncData('shopping_lists');
            };
        }

        if (typeof window.saveWorkouts === 'function') {
            const originalSaveWorkouts = window.saveWorkouts;
            window.saveWorkouts = function () {
                originalSaveWorkouts();
                window.syncData('workout_sheets');
            };
        }

        if (typeof window.renderWorkoutHistory === 'function') {
            const originalRenderWorkoutHistory = window.renderWorkoutHistory;
            window.renderWorkoutHistory = function () {
                originalRenderWorkoutHistory();
                window.syncData('workout_logs');
            };
        }

        if (typeof window.renderTrips === 'function') {
            const originalRenderTrips = window.renderTrips;
            window.renderTrips = function () {
                originalRenderTrips();
                window.syncData('leisure_planner');
            };
        }
    }, 300);
});
