// src/lib/stores.js
import { writable, get } from 'svelte/store';
import { uiStrings } from './utils/config.js';

const initialLang = 'en';

function createChatStore() {
	const { subscribe, set, update } = writable({
		currentLang: initialLang,
		dbSchema: null,
		conversationHistory: [], // Start with an empty history
		isModelRunning: false,
		dbStatus: { text: 'Initializing...', color: 'text-gray-600' },
        // QOL UPGRADE: Centralized error state
        error: null
	});

    // Initialize with a welcome message after the store is created
    setTimeout(() => {
        update(state => {
            const strings = uiStrings[state.currentLang];
            return {
                ...state,
                conversationHistory: [{ role: 'assistant', content: strings.initialMessage, type: 'text' }]
            };
        });
    }, 0);

	return {
		subscribe,
		set,
		update,
		addMessage: (role, content, type = 'text') => {
			update(state => ({
				...state,
                error: null, // Clear previous errors on new message
				conversationHistory: [...state.conversationHistory, { role, content, type }]
			}));
		},
		setLanguage: (lang) => {
			update(state => {
                const newStrings = uiStrings[lang];
                const newHistory = state.conversationHistory.map((msg, i) => {
                    // Replace initial message if it exists
                    if (i === 0 && msg.content === uiStrings[state.currentLang].initialMessage) {
                        return { ...msg, content: newStrings.initialMessage };
                    }
                    return msg;
                });
                return { ...state, currentLang: lang, conversationHistory: newHistory };
            });
		},
		setDbStatus: (text, color) => {
			update(state => ({ ...state, dbStatus: { text, color } }));
		},
        // QOL UPGRADE: Dedicated error action
        setError: (errorMessage) => {
            update(state => ({...state, isModelRunning: false, error: errorMessage }));
        },
		clearChat: () => {
			const currentLang = get(chatStore).currentLang;
			update(state => ({
				...state,
				conversationHistory: [{ role: 'assistant', content: uiStrings[currentLang].initialMessage, type: 'text' }],
                error: null
			}));
			localStorage.removeItem('chatHistory');
		}
	};
};

export const chatStore = createChatStore();