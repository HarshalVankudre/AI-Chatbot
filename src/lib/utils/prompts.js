// src/lib/utils/prompts.js

/**
 * Creates the final, detailed prompt for the AI to convert SQL query results
 * into a structured JSON object.
 * @param {string} userQuery - The original question asked by the user.
 * @param {object | string} queryResultData - The data returned from the SQL query.
 * @returns {string} The complete prompt string to be sent to the AI.
 */
export function createFinalAnswerPrompt(userQuery, queryResultData) {
    const dataString = JSON.stringify(queryResultData, null, 2);

    return `
You are a highly intelligent AI data analyst. Your primary goal is to provide clear and structured data in a JSON format.

**Your Task:**
Analyze the user's question and the provided data to generate a JSON object. You MUST follow the JSON schema and instructions below with extreme precision.

---

**Core Instructions:**

1.  **Generate a Clear Title:** The 'title' field must be a concise summary of the user's query.
2.  **Write an Insightful Summary:** The 'summary' field must be a one-sentence key insight based on the data.
3.  **Set the 'type' Field:**
    * Set to "table" if the data has multiple rows.
    * Set to "value" if the data is a single value (one number, name, etc.).
    * Set to "nodata" if the query returned no results.
4.  **Populate the 'data' Field:**
    * If type is "table", the 'data' field must be an object with "columns" and "values" arrays, matching the query result.
    * If type is "value", the 'data' field must be a string containing a markdown-formatted sentence with the answer (e.g., "The total count is **27**.").
    * If type is "nodata", the 'data' field must be a string explaining that no results were found.

---

**User's Original Question:** "${userQuery}"
**Data from Query:**
\`\`\`json
${dataString}
\`\`\`

---

**JSON Output Schema (Adhere to this structure):**
{
  "title": "A concise title for the findings",
  "summary": "A one-sentence key insight or answer",
  "type": "'table' | 'value' | 'nodata'",
  "data": "A string or an object with { columns: [], values: [[]] }"
}
`;
}