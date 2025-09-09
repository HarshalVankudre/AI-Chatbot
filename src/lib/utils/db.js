import { chatStore } from '../stores.js';
import { uiStrings } from './config.js';

let sqlJsInstance = null;

export async function loadSqlJs() {
	const state = chatStore.setDbStatus(uiStrings['en'].dbLoading, 'text-orange-500');
	try {
		sqlJsInstance = await window.initSqlJs({
			locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
		});
		chatStore.update(s => ({ ...s, sqlJs: sqlJsInstance }));
	} catch (e) {
		console.error('Failed to load sql.js', e);
	}
}

function extractDbSchema(database) {
	const schemaRes = database.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
	if (schemaRes.length === 0 || !schemaRes[0] || schemaRes[0].values.length === 0) {
		throw new Error('No tables found in the database.');
	}
	const schema = schemaRes[0].values.map(row => row[0]).join('\n\n');
	const tableNames = schemaRes[0].values.map(row => {
		const match = row[0].match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:`|'|"|\[)?(\w+)(?:`|'|"|\])?\s*\(/i);
		return match ? match[1] : 'unknown_table';
	}).join(', ');
	return { schema, tableNames };
}

export function handleDbFileChange(event) {
	const file = event.target.files[0];
	if (!file) return;

	let currentLang;
	chatStore.subscribe(s => currentLang = s.currentLang)();
	chatStore.setDbStatus(uiStrings[currentLang].dbReading, 'text-orange-500');

	const reader = new FileReader();
	reader.onload = e => {
		try {
			const Uints = new Uint8Array(e.target.result);
			const db = new sqlJsInstance.Database(Uints);
			const { schema, tableNames } = extractDbSchema(db);

			chatStore.update(s => ({ ...s, db, dbSchema: schema }));
			chatStore.setDbStatus(uiStrings[currentLang].dbSuccess(file.name, tableNames), 'text-green-600');
		} catch (error) {
			console.error('DATABASE LOAD FAILED:', error);
			chatStore.update(s => ({ ...s, db: null, dbSchema: '' }));
			chatStore.setDbStatus(uiStrings[currentLang].dbError, 'text-red-600');
		}
	};
	reader.readAsArrayBuffer(file);
}