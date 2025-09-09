import { writable, get } from 'svelte/store';
import { uiStrings } from './utils/config.js';

const initialLang = 'en';

const createChatStore = () => {
	const { subscribe, set, update } = writable({
		apiKey: '',
		currentLang: initialLang,
		db: null,
		dbSchema: '',
		sqlJs: null,
		// FIX: Changed role from 'ai' to 'assistant'
		conversationHistory: [{ role: 'assistant', content: uiStrings[initialLang].initialMessage, type: 'text' }],
		isModelRunning: false,
		dbStatus: { text: '', color: 'text-gray-600' }
	});

	const addMessage = (role, content, type = 'text') => {
		update(state => ({
			...state,
			conversationHistory: [...state.conversationHistory, { role, content, type }]
		}));
	};

	return {
		subscribe,
		set,
		update,
		addMessage,
		setLanguage: (lang) => {
			update(state => ({ ...state, currentLang: lang }));
		},
		setDbStatus: (text, color) => {
			update(state => ({ ...state, dbStatus: { text, color } }));
		},
		clearChat: () => {
			const currentLang = get(chatStore).currentLang;
			update(state => ({
				...state,
                // FIX: Changed role from 'ai' to 'assistant'
				conversationHistory: [{ role: 'assistant', content: uiStrings[currentLang].initialMessage, type: 'text' }]
			}));
			localStorage.removeItem('chatHistory');
		}
	};
};

export const chatStore = createChatStore();