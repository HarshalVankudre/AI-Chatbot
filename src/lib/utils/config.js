export const SELECTED_MODEL = 'gpt-5';

export const uiStrings = {
    en: {
        title: "AI Cloud SQL Chatbot",
        subtitle: "Ask questions about your connected Cloud SQL database.",
        apiLabel: "Step 1: Configure API",
        save: "Save",
        dbLabel: "Database Status",
        inputPlaceholder: "Ask a question or type 'generate image of...'",
        initialMessage: "Hello! Once the database is connected, you can start asking questions.",
        keySaved: "API key saved!",
        keyMissing: "Please enter a valid API key.",
        dbPrompt: "Please wait for the database to connect before asking a question.",
        dbReading: "Connecting to Cloud SQL and fetching schema...",
        // This is a function that accepts the table names
        dbSuccess: (tables) => `Connected to Cloud SQL. Found tables: ${tables}. You can now ask questions.`,
        dbError: "Error: Could not connect to the Cloud SQL database. Check the server console for details.",
        intentClassification: "Classifying query...",
        sqlGenerating: "AI is generating an SQL query...",
        sqlExecuting: "Executing SQL query...",
        finalAnswer: "Generating a natural language answer...",
        clearChat: "Clear Chat",
        viewSchema: "View Schema",
        hideSchema: "Hide Schema",
        copy: "Copy",
        copied: "Copied!",
        sqlCorrection: "Original query failed. Attempting to self-correct...",
        // This MUST be a function to include the failed SQL in the message
        sqlCorrectionFailed: (sql) => `The self-correction also failed. The last attempted query was:\n${sql}`
    },
    de: {
        title: "KI Cloud SQL Chatbot",
        subtitle: "Stellen Sie Fragen zu Ihrer verbundenen Cloud SQL-Datenbank.",
        apiLabel: "Schritt 1: API Konfigurieren",
        save: "Speichern",
        dbLabel: "Datenbankstatus",
        inputPlaceholder: "Stellen Sie eine Frage oder geben Sie 'Bild von...' ein.",
        initialMessage: "Hallo! Sobald die Datenbank verbunden ist, können Sie Fragen stellen.",
        keySaved: "API-Schlüssel gespeichert!",
        keyMissing: "Bitte geben Sie einen gültigen API-Schlüssel ein.",
        dbPrompt: "Bitte warten Sie, bis die Datenbank verbunden ist, bevor Sie eine Frage stellen.",
        dbReading: "Verbinde mit Cloud SQL und rufe Schema ab...",
        // This is a function that accepts the table names
        dbSuccess: (tables) => `Mit Cloud SQL verbunden. Gefundene Tabellen: ${tables}. Sie können jetzt Fragen stellen.`,
        dbError: "Fehler: Verbindung zur Cloud SQL-Datenbank konnte nicht hergestellt werden. Überprüfen Sie die Serverkonsole für Details.",
        intentClassification: "Klassifiziere Anfrage...",
        sqlGenerating: "KI generiert eine SQL-Abfrage...",
        sqlExecuting: "Führe SQL-Abfrage aus...",
        finalAnswer: "Generiere eine natürlichsprachliche Antwort...",
        clearChat: "Chat leeren",
        viewSchema: "Schema anzeigen",
        hideSchema: "Schema ausblenden",
        copy: "Kopieren",
        copied: "Kopiert!",
        sqlCorrection: "Ursprüngliche Abfrage fehlgeschlagen. Versuche, sich selbst zu korrigieren...",
        // This MUST be a function to include the failed SQL in the message
        sqlCorrectionFailed: (sql) => `Die Selbstkorrektur ist ebenfalls fehlgeschlagen. Die letzte versuchte Abfrage war:\n${sql}`
    }
};