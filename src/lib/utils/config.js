export const SELECTED_MODEL = 'gpt-4-turbo'; // Using a more reliable model

export const uiStrings = {
    en: {
        title: "AI Cloud SQL Chatbot",
        subtitle: "Ask questions about your connected Cloud SQL database.",
        inputPlaceholder: "Ask about your data, or type 'generate image of...'",
        initialMessage: "Hello! I'm ready to answer questions about your database.",
        dbPrompt: "Please wait for the database to connect before asking a question.",
        dbReading: "Connecting to Cloud SQL and fetching schema...",
        dbSuccess: (tables) => `Connected! Found tables: ${tables}.`,
        dbError: "Error: Could not connect to the Cloud SQL database.",
        intentClassification: "Understanding your question...",
        sqlGenerating: "Generating SQL query...",
        sqlExecuting: "Running query on database...",
        finalAnswer: "Formatting the answer...",
        clearChat: "Clear Chat",
        viewSchema: "View Schema",
        hideSchema: "Hide Schema",
        copy: "Copy",
        copied: "Copied!",
        sqlCorrection: "The first query failed. I'll try to correct it...",
        sqlCorrectionFailed: (sql) => `The corrected query also failed. The last query was:\n\n${sql}`
    },
    de: {
        title: "KI Cloud SQL Chatbot",
        subtitle: "Stellen Sie Fragen zu Ihrer verbundenen Cloud SQL-Datenbank.",
        inputPlaceholder: "Fragen Sie nach Ihren Daten oder geben Sie 'Bild von...' ein.",
        initialMessage: "Hallo! Ich bin bereit, Fragen zu Ihrer Datenbank zu beantworten.",
        dbPrompt: "Bitte warten Sie, bis die Datenbank verbunden ist, bevor Sie eine Frage stellen.",
        dbReading: "Verbinde mit Cloud SQL und rufe Schema ab...",
        dbSuccess: (tables) => `Verbunden! Gefundene Tabellen: ${tables}.`,
        dbError: "Fehler: Verbindung zur Cloud SQL-Datenbank konnte nicht hergestellt werden.",
        intentClassification: "Verstehe Ihre Frage...",
        sqlGenerating: "Generiere SQL-Abfrage...",
        sqlExecuting: "Führe Abfrage in der Datenbank aus...",
        finalAnswer: "Formatiere die Antwort...",
        clearChat: "Chat leeren",
        viewSchema: "Schema anzeigen",
        hideSchema: "Schema ausblenden",
        copy: "Kopieren",
        copied: "Kopiert!",
        sqlCorrection: "Die erste Abfrage ist fehlgeschlagen. Ich versuche sie zu korrigieren...",
        sqlCorrectionFailed: (sql) => `Die korrigierte Abfrage ist ebenfalls fehlgeschlagen. Die letzte Abfrage war:\n\n${sql}`
    }
};