Intelligent SQL Chatbot

An intelligent, browser-based chatbot that allows you to query your local SQLite databases using natural language. No need to write complex SQL—just ask questions in plain English and get answers. The bot is also capable of general conversation, making it a versatile data assistant.

(A screenshot of your application in action would be perfect here!)
✨ Key Features

    Natural Language to SQL: Converts plain English (or German) questions into valid SQLite queries.

    Smart Intent Classification: Automatically detects whether you're asking a question about your data or just making small talk.

    General Conversation: Engage in regular conversation when you're not querying the database.

    Intelligent Formatting: Automatically displays results as a clean markdown table for lists of data or as a simple sentence for single-value answers.

    Self-Correcting AI: If an initial SQL query fails, the AI attempts to correct it based on the error message.

    100% Browser-Based: Your database file and API key are never uploaded. All processing happens securely in your browser using SQL.js.

    Multi-Language UI: Switch between English and German on the fly.

    Modern Tech Stack: Built with the latest web technologies for a fast and responsive experience.

🤖 How It Works

The application uses a multi-step AI chain to process user input:

    Intent Classification: The AI first determines if the user's message is a database_query or general_conversation.

    Branching Logic:

        If general_conversation, the model generates a friendly, conversational response.

        If database_query, the application proceeds to the next step.

    Natural Language to SQL: The model generates an SQLite query based on the user's question and the database schema.

    Query Execution: The generated SQL is executed against the loaded database file in the browser via SQL.js.

    Intelligent Formatting & Final Answer: The query results are sent back to the model, which formats them appropriately (table or text) and generates a final, user-friendly response.

🛠️ Tech Stack

    Framework: SvelteKit

    Styling: Tailwind CSS

    AI: OpenAI API (using the gpt-5-nano model)

    In-Browser Database: SQL.js (SQLite compiled for the web)

    Markdown Parsing: Marked.js & DOMPurify

🚀 Getting Started

Follow these instructions to get a local copy up and running.
Prerequisites

You need to have Node.js (version 18.x or higher) and npm installed on your machine.
Installation

    Clone the repository:

    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
    cd your-repo-name

    Install dependencies:

    npm install

    Run the development server:

    npm run dev

    Open your browser and navigate to http://localhost:5173 (or the address shown in your terminal).

Configuration

    Get an OpenAI API Key: You'll need an API key from the OpenAI Platform.

    Launch the App: Open the application in your browser.

    Enter Your Key: Paste your OpenAI API key into the input field at the top and click "Save".

    Load a Database: Use the file input to load a local .sqlite or .db file.

    Start Chatting! Once the database is loaded successfully, you can start asking questions.

📄 License

This project is licensed under the MIT License. See the LICENSE file for details.
