\<div align="center"\>  
\<h1\>🤖 Intelligent SQL Chatbot 🤖\</h1\>  
\<p\>  
\<strong\>Query your SQLite databases using natural language. No SQL required\!\</strong\>  
\</p\>  
\</div\>  
\<div align="center"\>  
\</div\>  
An intelligent, browser-based chatbot that allows you to query your local SQLite databases using natural language. No need to write complex SQL—just ask questions in plain English and get answers. The bot is also capable of general conversation, making it a versatile data assistant.  
\<div align="center"\>  
*(A screenshot of your application in action would be perfect here\!)*  
\</div\>

## **✨ Key Features**

* **Natural Language to SQL:** Converts plain English (or German) questions into valid SQLite queries.  
* **Smart Intent Classification:** Automatically detects whether you're asking a question about your data or just making small talk.  
* **General Conversation:** Engage in regular conversation when you're not querying the database.  
* **Intelligent Formatting:** Automatically displays results as a clean markdown table for lists of data or as a simple sentence for single-value answers.  
* **Self-Correcting AI:** If an initial SQL query fails, the AI attempts to correct it based on the error message.  
* **100% Browser-Based:** Your database file and API key are never uploaded. All processing happens securely in your browser using SQL.js.  
* **Multi-Language UI:** Switch between English and German on the fly.  
* **Modern Tech Stack:** Built with the latest web technologies for a fast and responsive experience.

## **🤖 How It Works**

The application uses a multi-step AI chain to process user input:

1. **Intent Classification:** The AI first determines if the user's message is a database\_query or general\_conversation.  
2. **Branching Logic:**  
   * If **general\_conversation**, the model generates a friendly, conversational response.  
   * If **database\_query**, the application proceeds to the next step.  
3. **Natural Language to SQL:** The model generates an SQLite query based on the user's question and the database schema.  
4. **Query Execution:** The generated SQL is executed against the loaded database file in the browser via SQL.js.  
5. **Intelligent Formatting & Final Answer:** The query results are sent back to the model, which formats them appropriately (table or text) and generates a final, user-friendly response.

## **🛠️ Tech Stack**

* **Framework:** [SvelteKit](https://kit.svelte.dev/)  
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)  
* **AI:** [OpenAI API](https://openai.com/) (using the gpt-5-nano model)  
* **In-Browser Database:** [SQL.js (SQLite compiled for the web)](https://sql.js.org/)  
* **Markdown Parsing:** [Marked.js](https://marked.js.org/) & [DOMPurify](https://github.com/cure53/DOMPurify)

## **🚀 Getting Started**

Follow these instructions to get a local copy up and running.

### **Prerequisites**

You need to have [Node.js](https://nodejs.org/) (version 18.x or higher) and npm installed on your machine.

### **Installation**

1. **Clone the repository:**  
   git clone \[https://github.com/your-username/your-repo-name.git\](https://github.com/your-username/your-repo-name.git)  
   cd your-repo-name

2. **Install dependencies:**  
   npm install

3. **Run the development server:**  
   npm run dev

4. Open your browser and navigate to http://localhost:5173 (or the address shown in your terminal).

### **Configuration**

1. **Get an OpenAI API Key:** You'll need an API key from the [OpenAI Platform](https://platform.openai.com/api-keys).  
2. **Launch the App:** Open the application in your browser.  
3. **Enter Your Key:** Paste your OpenAI API key into the input field at the top and click "Save".  
4. **Load a Database:** Use the file input to load a local .sqlite or .db file.  
5. **Start Chatting\!** Once the database is loaded successfully, you can start asking questions.

## **📄 License**

This project is licensed under the MIT License. See the LICENSE file for details.