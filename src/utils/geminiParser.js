/**
 * Gemini 2.5 Flash Structured Parser Client with Local Fallback
 */
import { getTodayISO } from './dates.js';
import { parseMeetingNotesLocal } from './localParser.js';

export async function parseMeetingNotesWithAI(text, apiKey) {
  const todayStr = getTodayISO();

  // If no API key provided, immediately use local fallback
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    const localTasks = parseMeetingNotesLocal(text);
    return {
      tasks: localTasks,
      sourceUsed: 'fallback',
      message: 'Extracted tasks using the local rule-based parser. (Add your Gemini API key in Settings for semantic reasoning).'
    };
  }

  const cleanKey = apiKey.trim();
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  const systemInstruction = `You extract actionable tasks from meeting notes. Return only tasks that are real commitments. Today's date is ${todayStr}. Resolve relative dates. Use enums exactly as specified.`;

  const promptBody = {
    contents: [
      {
        parts: [
          {
            text: `Extract structured work commitments from the following meeting conversation:\n\n${text}`
          }
        ]
      }
    ],
    systemInstruction: {
      parts: [
        {
          text: systemInstruction
        }
      ]
    },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          tasks: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                description: { type: 'STRING' },
                dueDate: { type: 'STRING' },
                requester: { type: 'STRING' },
                priority: {
                  type: 'STRING',
                  enum: ['High', 'Medium', 'Low']
                },
                effort: {
                  type: 'STRING',
                  enum: ['Small', 'Medium', 'Large']
                },
                status: {
                  type: 'STRING',
                  enum: ['To Do', 'In Progress', 'Done']
                }
              },
              required: ['title', 'description', 'dueDate', 'requester', 'priority', 'effort', 'status']
            }
          }
        },
        required: ['tasks']
      }
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': cleanKey
      },
      body: JSON.stringify(promptBody)
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const errorMsg = errorJson.error?.message || `HTTP ${response.status}`;
      console.warn(`[CommitDesk Gemini API] Request failed (${errorMsg}), dropping back to local parser.`);
      const fallbackTasks = parseMeetingNotesLocal(text);
      return {
        tasks: fallbackTasks,
        sourceUsed: 'fallback',
        message: `Gemini API returned (${errorMsg}). Extracted tasks using local parser.`
      };
    }

    const json = await response.json();
    const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Empty response payload from Gemini API');
    }

    const parsedData = JSON.parse(candidateText);
    const rawList = Array.isArray(parsedData.tasks) ? parsedData.tasks : [];

    // Sanitize and validate every task strictly against data model
    const sanitizedTasks = rawList.map((item, idx) => {
      const validPriority = ['High', 'Medium', 'Low'].includes(item.priority) ? item.priority : 'Medium';
      const validEffort = ['Small', 'Medium', 'Large'].includes(item.effort) ? item.effort : 'Medium';
      const validStatus = ['To Do', 'In Progress', 'Done'].includes(item.status) ? item.status : 'To Do';

      // Validate YYYY-MM-DD date format
      let validDueDate = item.dueDate;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(validDueDate || '')) {
        validDueDate = todayStr;
      }

      return {
        id: `COMMIT-${Date.now().toString().slice(-4)}${idx + 1}`,
        title: (item.title || 'Actionable Commitment').trim(),
        description: (item.description || item.title || '').trim(),
        dueDate: validDueDate,
        requester: (item.requester || 'Me').trim(),
        priority: validPriority,
        effort: validEffort,
        status: validStatus,
        source: 'Meeting',
        createdAt: todayStr
      };
    });

    return {
      tasks: sanitizedTasks,
      sourceUsed: 'gemini',
      message: `Extracted ${sanitizedTasks.length} task${sanitizedTasks.length === 1 ? '' : 's'} using Gemini 2.5 Flash.`
    };
  } catch (error) {
    console.error('[CommitDesk Gemini API] Parsing error:', error);
    const fallbackTasks = parseMeetingNotesLocal(text);
    return {
      tasks: fallbackTasks,
      sourceUsed: 'fallback',
      message: `Encountered network error (${error.message}). Extracted tasks using local parser.`
    };
  }
}
