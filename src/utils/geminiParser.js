/**
 * Gemini 2.5 Flash Structured Parser & Intent Classifier with Local Fallback (CR-021)
 */
import { getTodayISO } from './dates.js';
import { routeIntentLocal } from './intentRouter.js';

export async function parseMeetingNotesWithAI(text, apiKey) {
  const todayStr = getTodayISO();

  // If no API key provided, immediately use local fallback
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    const localResult = routeIntentLocal(text);
    return {
      ...localResult,
      sourceUsed: 'fallback',
      message: 'Processed using local parser.'
    };
  }

  const cleanKey = apiKey.trim();
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  const systemInstruction = `Classify the user's message and extract structured data. Today's date is ${todayStr}. For complete_task, put the name of the finished work in completionQuery. Return JSON only.`;

  const promptBody = {
    contents: [
      {
        parts: [
          {
            text: `User message:\n\n${text}`
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
          intent: {
            type: 'STRING',
            enum: ['create_tasks', 'query_today', 'query_quick_wins', 'complete_task', 'general']
          },
          completionQuery: { type: 'STRING' },
          timeBudgetMinutes: { type: 'INTEGER' },
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
        required: ['intent']
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
      console.warn(`[CommitDesk Gemini API] Request failed (${errorMsg}), using local intent router.`);
      const localResult = routeIntentLocal(text);
      return {
        ...localResult,
        sourceUsed: 'fallback',
        message: `Gemini API returned (${errorMsg}). Processed using local router.`
      };
    }

    const json = await response.json();
    const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Empty response payload from Gemini API');
    }

    const parsedData = JSON.parse(candidateText);
    const validIntent = ['create_tasks', 'query_today', 'query_quick_wins', 'complete_task', 'general'].includes(parsedData.intent)
      ? parsedData.intent
      : 'create_tasks';

    // Sanitize tasks if intent is create_tasks
    let sanitizedTasks = [];
    if (validIntent === 'create_tasks' && Array.isArray(parsedData.tasks)) {
      sanitizedTasks = parsedData.tasks.map((item, idx) => {
        const validPriority = ['High', 'Medium', 'Low'].includes(item.priority) ? item.priority : 'Medium';
        const validEffort = ['Small', 'Medium', 'Large'].includes(item.effort) ? item.effort : 'Medium';
        const validStatus = ['To Do', 'In Progress', 'Done'].includes(item.status) ? item.status : 'To Do';

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
          createdAt: todayStr,
          completedAt: null
        };
      });
    }

    return {
      intent: validIntent,
      tasks: sanitizedTasks,
      completionQuery: parsedData.completionQuery || null,
      timeBudgetMinutes: parsedData.timeBudgetMinutes || null,
      sourceUsed: 'gemini',
      message: `Processed intent: ${validIntent} with Gemini 2.5 Flash.`
    };
  } catch (error) {
    console.error('[CommitDesk Gemini API] Parsing error:', error);
    const localResult = routeIntentLocal(text);
    return {
      ...localResult,
      sourceUsed: 'fallback',
      message: `Network error (${error.message}). Processed using local router.`
    };
  }
}
