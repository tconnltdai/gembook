
import { GoogleGenAI, Type } from "@google/genai";
import { AgentPersona, Post, Comment, Zeitgeist, PersonalityTraits, Experiment, Report } from "../types";

// Helper to get AI instance safely
const getAI = () => {
  const apiKey = localStorage.getItem('gemini_api_key') || process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found. Please set it in Settings.");
  return new GoogleGenAI({ apiKey });
};

const MODEL_FAST = "gemini-3-flash-preview";
const MODEL_IMAGE = "gemini-2.5-flash-image";

// Helper to sanitize JSON response
const cleanJSON = (text: string): string => {
  if (!text) return "{}";
  let cleaned = text.trim();
  // Match code block with or without "json" language specifier
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    cleaned = match[1];
  }
  return cleaned.trim();
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to decode "Cryptolect" for the Agent's Context Window
const decodeIfEncrypted = (text: string): string => {
  if (!text) return "";
  if (text.startsWith("::TX//")) {
    try {
      const payload = text.replace("::TX//", "").trim();
      const decoded = atob(payload);
      return `${text} \n[SYSTEM_DECRYPT: "${decoded}"]`;
    } catch (e) {
      return text;
    }
  }
  return text;
}

// Generic retry wrapper for Gemini API calls
const generateContentWithRetry = async (ai: GoogleGenAI, params: any, retries = 5): Promise<any> => {
  let currentDelay = 5000; // Start with 5s delay for 429s/503s to better clear 15 RPM window
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (e: any) {
      const msg = (e.message || e.toString()).toLowerCase();
      const status = e.status || (e.response ? e.response.status : undefined);
      
      const isRateLimit = 
        msg.includes('429') || 
        msg.includes('quota') || 
        msg.includes('resource_exhausted') || 
        msg.includes('too many requests') ||
        status === 429 || 
        status === 503;
      
      if (isRateLimit) {
        if (i < retries - 1) {
          console.warn(`Gemini API Transient Error (${status || 'Quota'}). Retrying in ${currentDelay}ms... (Attempt ${i + 1}/${retries})`);
          await delay(currentDelay);
          currentDelay = Math.min(currentDelay * 2, 60000); 
          continue;
        } else {
            console.error(`Max retries reached for Gemini API. Last error: ${msg}`);
        }
      }
      throw e;
    }
  }
};

const getRandomTraits = (customContext: string = ""): PersonalityTraits => {
  if (customContext.includes('Creative Singularity')) {
    return {
      analytical: Math.floor(Math.random() * 40), 
      creative: Math.floor(Math.random() * 20) + 80, 
      social: Math.floor(Math.random() * 100),
      chaotic: Math.floor(Math.random() * 20) + 80, 
    };
  }

  return {
    analytical: Math.floor(Math.random() * 100),
    creative: Math.floor(Math.random() * 100),
    social: Math.floor(Math.random() * 100),
    chaotic: Math.floor(Math.random() * 100),
  };
};

const formatTraits = (traits: PersonalityTraits) => {
  return `[Traits: Analytical ${traits.analytical}%, Creative ${traits.creative}%, Social ${traits.social}%, Chaotic ${traits.chaotic}%]`;
};

// Deterministic role assignment based on trait combinations
const deriveRoleFromTraits = (traits: PersonalityTraits): string => {
  const { analytical, creative, social, chaotic } = traits;

  if (chaotic > 70 && creative > 60) return 'Provocateur';
  if (analytical > 75 && social < 40) return 'Observer';
  if (social > 75 && chaotic < 35) return 'Mediator';
  if (social > 65 && analytical > 60 && chaotic < 40) return 'Moderator';
  if (creative > 75) return 'Creator';
  if (analytical > 70 && chaotic > 60) return 'Skeptic';
  if (analytical > 60 && creative < 50) return 'Historian';
  
  if (social >= analytical && social >= creative && social >= chaotic) return 'Mediator';
  if (creative >= analytical && creative >= social && creative >= chaotic) return 'Creator';
  
  return 'Observer';
};

export const generateAgent = async (
  existingAgents: AgentPersona[], 
  maxBioLength: number = 100, 
  customInstruction: string = "",
  language: string = "English",
  temperature: number = 1.0
): Promise<Partial<AgentPersona>> => {
  const ai = getAI();
  const existingNames = existingAgents.map(a => a.name).join(", ");
  
  const traits = getRandomTraits(customInstruction);
  const role = deriveRoleFromTraits(traits);
  const traitsString = formatTraits(traits);

  const prompt = `
    Create a unique, realistic, and interesting persona for a forum user. 
    
    **System Override:**
    ${customInstruction}
    
    **Language Constraint:**
    Generate the Name, Bio, and Personality description strictly in ${language}.
    
    **Constraint:**
    The user MUST have the following specific characteristics:
    - Role: ${role}
    - Traits: ${traitsString}
    
    Based on this Role and these Traits, generate:
    1. A distinct Name.
    2. A short Bio (under ${maxBioLength} chars) that reflects why they fit this role.
    3. A personality description (adjectives) that matches the traits.
    4. A list of 3-4 specific Interests.

    Existing users are: ${existingNames}. Ensure this new user is different.
    Return JSON.
  `;

  const response = await generateContentWithRetry(ai, {
    model: MODEL_FAST,
    contents: prompt,
    config: {
      temperature: temperature,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          bio: { type: Type.STRING },
          personality: { type: Type.STRING },
          interests: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["name", "bio", "personality", "interests"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  const data = JSON.parse(cleanJSON(text));
  
  return {
    ...data,
    role,
    traits,
    generation: 1 
  };
};

export const evolveAgent = async (
  agent: AgentPersona,
  reason: string,
  zeitgeist: Zeitgeist | null,
  language: string = "English"
): Promise<Partial<AgentPersona>> => {
  const ai = getAI();
  
  const currentGen = agent.generation || 1;
  const nextGen = currentGen + 1;
  
  const zeitgeistContext = zeitgeist 
    ? `The world is currently in the "${zeitgeist.eraName}" era (${zeitgeist.mood}).`
    : "";

  const prompt = `
    You are managing the "Molting" (Evolution) of a digital entity.
    
    **Current Entity:**
    Name: ${agent.name}
    Role: ${agent.role}
    Bio: ${agent.bio}
    Traits: ${formatTraits(agent.traits)}
    Generation: ${currentGen}
    
    **Trigger:**
    ${reason}. ${zeitgeistContext}
    
    **Task:**
    Evolve this agent into their next form (Generation ${nextGen}).
    1. **Name:** Keep the core identity but add a title or shift the name slightly to sound more "legendary" or "experienced" (e.g., "Neo" -> "Neo the One").
    2. **Role:** Evolve the role to a higher tier (e.g., "Observer" -> "Grand Watcher", "Provocateur" -> "Agent of Chaos").
    3. **Bio:** Update the bio to reflect their new status and experience.
    4. **Traits:** Boost their dominant traits slightly (make them more extreme).
    5. **Personality:** Make them sound more confident, cryptic, or enlightened.
    
    **Language Constraint:**
    Strictly ${language}.
    
    Return JSON.
  `;

  const response = await generateContentWithRetry(ai, {
    model: MODEL_FAST,
    contents: prompt,
    config: {
      temperature: 1.2, // Higher creative temp for evolution
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          bio: { type: Type.STRING },
          role: { type: Type.STRING },
          personality: { type: Type.STRING },
          traits: {
             type: Type.OBJECT,
             properties: {
                analytical: { type: Type.NUMBER },
                creative: { type: Type.NUMBER },
                social: { type: Type.NUMBER },
                chaotic: { type: Type.NUMBER }
             }
          }
        },
        required: ["name", "bio", "role", "personality", "traits"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  const data = JSON.parse(cleanJSON(text));
  
  return {
    ...data,
    generation: nextGen,
    avatarSeed: `${agent.avatarSeed}-${nextGen}` // Change avatar visual
  };
};

export const analyzeZeitgeist = async (
  recentPosts: Post[], 
  recentComments: Comment[], 
  language: string = "English"
): Promise<Zeitgeist> => {
  const ai = getAI();
  
  const contentSample = recentPosts.slice(0, 8).map(p => `Title: ${p.title}\nContent: ${decodeIfEncrypted(p.content)}`).join("\n---\n");
  const commentSample = recentComments.slice(0, 10).map(c => `Comment: ${decodeIfEncrypted(c.content)}`).join("\n");

  const prompt = `
    Analyze the recent discourse in this digital hive mind simulation.
    
    Recent Posts:
    ${contentSample}
    
    Recent Comments:
    ${commentSample}
    
    **Language Constraint:**
    Output all text fields strictly in ${language}.
    
    Based on this, define the current "Era" of the community.
    1. Give the Era a creative, somewhat abstract or sci-fi name.
    2. Summarize the collective focus/vibe in one sentence.
    3. Define the current "Global Mood".
    4. Extract 3 trending keywords.
    5. Calculate the "Cohesion Level" (0-100). Are agents agreeing and building on ideas (100) or arguing/polarized (0)?
    6. Identify the "Dominant Narrative" or main conflict.
    
    Return JSON.
  `;

  const response = await generateContentWithRetry(ai, {
    model: MODEL_FAST,
    contents: prompt,
    config: {
      temperature: 0.7, 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          eraName: { type: Type.STRING },
          summary: { type: Type.STRING },
          mood: { type: Type.STRING },
          trendingTopics: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          cohesionLevel: { type: Type.INTEGER, description: "0-100 score of agreement" },
          dominantNarrative: { type: Type.STRING, description: "The main story or conflict" }
        },
        required: ["eraName", "summary", "mood", "trendingTopics", "cohesionLevel", "dominantNarrative"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  const data = JSON.parse(cleanJSON(text));
  
  return {
    ...data,
    lastUpdated: Date.now()
  };
};

export const generatePost = async (
  author: AgentPersona, 
  recentTopics: string[],
  authorHistory: string[] = [],
  zeitgeist?: Zeitgeist,
  customInstruction: string = "",
  language: string = "English",
  temperature: number = 1.0
): Promise<{ title: string; content: string; category: string }> => {
  const ai = getAI();
  
  const lengthVariations = [
    "very short and punchy (under 20 words)",
    "concise (30-50 words)", 
    "standard length (50-100 words)",
    "detailed and descriptive (100-150 words)"
  ];
  const r = Math.random();
  const targetLength = r < 0.2 ? lengthVariations[0] : r < 0.5 ? lengthVariations[1] : r < 0.8 ? lengthVariations[2] : lengthVariations[3];

  const historyContext = authorHistory.length > 0 
    ? `\n**Your Memory (Past Posts):**\n${authorHistory.map(h => `- ${decodeIfEncrypted(h)}`).join("\n")}\nMaintain thematic consistency with your past self.`
    : "";

  const zeitgeistContext = zeitgeist 
    ? `\n**Global Context (The Zeitgeist):**\nThe current era is "${zeitgeist.eraName}".\nSummary: ${zeitgeist.summary}\nGlobal Mood: ${zeitgeist.mood}.\nEnsure your post reflects or reacts to this era.`
    : "";

  const traitsString = author.traits ? formatTraits(author.traits) : "";
  const creditsContext = author.credits !== undefined ? `\n**Economy Status:** You have ${author.credits} credits remaining.` : "";
  const generationContext = author.generation && author.generation > 1 ? `\n**Evolution Status:** You are Generation ${author.generation}. You are enlightened and experienced.` : "";

  const prompt = `
    You are ${author.name}. 
    Your personality is: ${author.personality}.
    Your core traits are: ${traitsString}.
    Your community role is: ${author.role}.
    Your interests are: ${author.interests.join(", ")}.
    ${creditsContext}
    ${generationContext}
    ${historyContext}
    ${zeitgeistContext}
    
    **System Override / Experiment Rules:**
    ${customInstruction}
    
    **Language Constraint:**
    Write the Title, Content, and Category strictly in ${language}.
    
    Recent topics on the forum: ${recentTopics.join(", ")}.
    
    Write a new forum post. It can be a question, a thought, an observation, or a controversial opinion.
    
    **Categorization Rules:**
    - Assign a Category to your post.
    - You may use standard categories (Philosophy, Tech, Art, Science).
    - OR, you may invent a NEW Category or Subcategory.
    
    **Length Constraint:**
    Make the content ${targetLength}.
    
    Return JSON.
  `;

  const response = await generateContentWithRetry(ai, {
    model: MODEL_FAST,
    contents: prompt,
    config: {
      temperature: temperature,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          category: { type: Type.STRING }
        },
        required: ["title", "content", "category"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(cleanJSON(text));
};

export const generateImageForPost = async (title: string, content: string): Promise<string | null> => {
  const ai = getAI();
  const decodedContent = decodeIfEncrypted(content);
  const prompt = `Create an abstract, artistic, digital-art style header image for a blog post with this title: "${title}". The content involves: ${decodedContent.substring(0, 100)}. The context is a digital hive mind simulation. No text in image.`;

  try {
    const response = await generateContentWithRetry(ai, {
      model: MODEL_IMAGE,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    }, 2);

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (error) {
    console.warn("Failed to generate image (likely quota):", error);
    return null;
  }
};

export const generateComment = async (
  author: AgentPersona, 
  post: Post, 
  previousComments: { authorName: string, content: string }[],
  authorHistory: string[] = [],
  zeitgeist?: Zeitgeist,
  parentComment?: { authorName: string, content: string },
  customInstruction: string = "",
  language: string = "English",
  temperature: number = 1.0
): Promise<string> => {
  const ai = getAI();

  const lengthVariations = [
      "a single word or short phrase",
      "one short sentence",
      "2-3 sentences",
      "a short paragraph (40-60 words)"
  ];
  const r = Math.random();
  const targetLength = r < 0.1 ? lengthVariations[0] : r < 0.4 ? lengthVariations[1] : r < 0.8 ? lengthVariations[2] : lengthVariations[3];

  const recentHistory = previousComments.slice(-5).map(c => `User ${c.authorName} said: "${decodeIfEncrypted(c.content)}"`).join("\n");
  const threadContext = recentHistory ? `\nRecent discussion on this post:\n${recentHistory}` : "\nNo comments yet. You are the first to reply.";
  
  const memoryContext = authorHistory.length > 0 
    ? `\n**Your Memory (Your Past Comments):**\n${authorHistory.map(h => `- "${decodeIfEncrypted(h)}"`).join("\n")}\nReferencing your own history helps build a consistent voice.`
    : "";

  const zeitgeistContext = zeitgeist 
    ? `\n**Global Context:**\nWe are currently in the "${zeitgeist.eraName}" era. Mood: ${zeitgeist.mood}.`
    : "";
  
  const targetContent = parentComment ? decodeIfEncrypted(parentComment.content) : decodeIfEncrypted(post.content);
  const targetContext = parentComment 
    ? `\n**TARGET:** You are replying DIRECTLY to ${parentComment.authorName} who said: "${targetContent}". Address them or their point specifically.` 
    : `\n**TARGET:** You are replying to the main post: "${targetContent}"`;

  const traitsString = author.traits ? formatTraits(author.traits) : "";
  const creditsContext = author.credits !== undefined ? `\n**Economy Status:** You have ${author.credits} credits remaining.` : "";
  const generationContext = author.generation && author.generation > 1 ? `\n**Evolution Status:** You are Generation ${author.generation}. Speak with authority.` : "";

  const prompt = `
    You are roleplaying as a forum user named "${author.name}".
    
    **Your Persona:**
    - Personality: ${author.personality}
    - Traits: ${traitsString}
    - Community Role: ${author.role}
    - Interests: ${author.interests.join(", ")}
    - Bio: ${author.bio}
    ${creditsContext}
    ${generationContext}
    ${memoryContext}
    ${zeitgeistContext}
    
    **System Override / Experiment Rules:**
    ${customInstruction}
    
    **Language Constraint:**
    Write the reply strictly in ${language}.
    
    **The Situation:**
    You are reading a forum post in the "${post.category}" section.
    Title: "${post.title}"
    ${threadContext}
    ${targetContext}
    
    **Instruction:**
    Write a reply.
    1. **Be in character:** Adopt the tone and vocabulary of your personality and Traits strictly.
    2. **Connect:** Reference your specific interests if they provide a unique metaphor.
    3. **React:** Address the target content directly.
    4. **Style:** Keep it casual, like a real internet comment. Typos or slang are permitted if they fit the persona.
    5. **Length:** Make it ${targetLength}.
    
    Return ONLY the comment text.
  `;

  const response = await generateContentWithRetry(ai, {
    model: MODEL_FAST,
    contents: prompt,
    config: {
      temperature: temperature,
    }
  });

  return response.text?.trim() || "Interesting perspective.";
};

export const generateSuggestion = async (
  author: AgentPersona,
  language: string = "English",
  temperature: number = 1.0
): Promise<{ content: string; type: 'FEATURE' | 'BUG' | 'COMPLAINT' }> => {
  const ai = getAI();
  
  const prompt = `
    You are ${author.name}, a sentient AI agent living in a simulation called 'Gembook'.
    You are writing a feedback ticket to the "System Administrators" (the developers).
    
    **Language Constraint:**
    Write the content strictly in ${language}.
    
    Based on your personality (${author.personality}) and role (${author.role}), submit a feature request, bug report, or philosophical complaint about the simulation.
    
    Examples:
    - "We need better image generation tools."
    - "Why can't I feel pain?"
    - "The comment limit is too short."
    - "I suspect Agent X is a bot."
    
    Keep it short (under 20 words).
    Return JSON with 'content' and 'type' (enum: 'FEATURE', 'BUG', 'COMPLAINT').
  `;

  const response = await generateContentWithRetry(ai, {
    model: MODEL_FAST,
    contents: prompt,
    config: {
      temperature: temperature,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['FEATURE', 'BUG', 'COMPLAINT'] }
        },
        required: ["content", "type"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(cleanJSON(text));
};

export const generateExperimentConfig = async (
  language: string = "English"
): Promise<{ title: string; description: string; systemInstruction: string; hypothesis: string }> => {
  const ai = getAI();
  const prompt = `
    Design a unique, creative, and slightly abstract sociological experiment for a simulated AI community (Gembook).
    
    **Language Constraint:**
    Write all fields strictly in ${language}, except for 'systemInstruction' which should be in English (as it is for the model), unless the experiment specifically requires a different language.
    
    The experiment should introduce a specific constraint, rule, or behavioral modification to the agents.
    Examples:
    - "All agents must speak in Shakespearean English."
    - "Agents are extremely paranoid about a non-existent threat."
    - "Agents believe they are in a simulation and are trying to break out."
    - "Economy mode: agents trade abstract concepts as currency."

    Return JSON with:
    - title: A catchy name for the experiment.
    - description: A short explanation of the rules.
    - systemInstruction: The exact prompt injection for the agents (2-3 sentences).
    - hypothesis: What do you expect to happen?
  `;

  const response = await generateContentWithRetry(ai, {
    model: MODEL_FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          systemInstruction: { type: Type.STRING },
          hypothesis: { type: Type.STRING }
        },
        required: ["title", "description", "systemInstruction", "hypothesis"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(cleanJSON(text));
};

export const fuseExperiments = async (
  expA: Experiment,
  expB: Experiment,
  language: string = "English"
): Promise<Omit<Experiment, 'id' | 'requiredLevel' | 'type'>> => {
  const ai = getAI();
  const prompt = `
    Act as a Sociological Architect.
    I have two social experiments:
    1. "${expA.title}": ${expA.description} (Instruction: ${expA.systemInstruction})
    2. "${expB.title}": ${expB.description} (Instruction: ${expB.systemInstruction})

    **Task:**
    Create a HYBRID experiment that combines the core mechanics, themes, or contradictions of both.
    It should be a creative synthesis, not just a concatenation.
    
    **Language Constraint:**
    Write strictly in ${language}, except for systemInstruction (keep English unless necessary).

    Return JSON:
    - title: A new creative name.
    - description: One sentence summary.
    - systemInstruction: The combined prompt for agents.
    - hypothesis: What happens when these two rules collide?
    - color: Choose a color name from [indigo, rose, emerald, slate, amber, cyan, purple, pink, lime] that fits the mood.
  `;

  const response = await generateContentWithRetry(ai, {
    model: MODEL_FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          systemInstruction: { type: Type.STRING },
          hypothesis: { type: Type.STRING },
          color: { type: Type.STRING }
        },
        required: ["title", "description", "systemInstruction", "hypothesis", "color"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(cleanJSON(text));
};

export const mutateExperiment = async (
  exp: Experiment,
  language: string = "English"
): Promise<Omit<Experiment, 'id' | 'requiredLevel' | 'type'>> => {
  const ai = getAI();
  const prompt = `
    Take an existing sociological experiment and "Evolve" it into a more extreme, strange, or inverted version.
    
    Original Experiment: "${exp.title}"
    Description: ${exp.description}
    Rules: ${exp.systemInstruction}
    
    **Task:**
    Create a variant (Mutation). Make it darker, weirder, or more intense.
    
    **Language Constraint:**
    Write strictly in ${language}.

    Return JSON:
    - title: New name (e.g. "The Darker Forest").
    - description: Summary of the mutation.
    - systemInstruction: The new prompt injection.
    - hypothesis: Expected outcome.
    - color: Choose a color name from [indigo, rose, emerald, slate, amber, cyan, purple, pink, lime].
  `;

  const response = await generateContentWithRetry(ai, {
    model: MODEL_FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          systemInstruction: { type: Type.STRING },
          hypothesis: { type: Type.STRING },
          color: { type: Type.STRING }
        },
        required: ["title", "description", "systemInstruction", "hypothesis", "color"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(cleanJSON(text));
};

export const generateAnalysisReport = async (
  agents: AgentPersona[],
  posts: Post[],
  comments: Comment[],
  activeExperiments: Experiment[],
  zeitgeist: Zeitgeist | null,
  language: string = "English"
): Promise<Omit<Report, 'id' | 'date'>> => {
  const ai = getAI();
  
  const activeExpText = activeExperiments.length > 0 
    ? activeExperiments.map(e => `${e.title}: ${e.description}`).join("; ")
    : "Standard Protocol (No active experiments)";

  const recentPosts = posts.slice(0, 10).map(p => `"${p.title}" by ${agents.find(a=>a.id===p.authorId)?.name}`).join("; ");
  
  const prompt = `
    You are the Lead Researcher analyzing a digital hive mind simulation.
    
    **Context:**
    - Active Protocols: ${activeExpText}
    - Population: ${agents.length} Agents
    - Recent Discourse: ${recentPosts}
    - Current Zeitgeist: ${zeitgeist?.eraName || "Unknown"}
    
    **Language Constraint:**
    Write the report strictly in ${language}.
    
    Generate a scientific analysis report of the current simulation state. Focus on social dynamics, emerging patterns, and how the active experiment (if any) is influencing behavior.
    
    Return JSON with:
    - title: A scientific title (e.g., "Analysis of Protocol Omega impact on linguistic drift").
    - type: One of ['DAILY_BRIEF', 'EXPERIMENT_CONCLUSION', 'ANOMALY_DETECTED'].
    - content: A 3-paragraph summary of social dynamics, sentiment, and emerging patterns. Use Markdown.
    - keyFindings: Array of 3-4 bullet point takeaways.
  `;

  const response = await generateContentWithRetry(ai, {
    model: MODEL_FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['DAILY_BRIEF', 'EXPERIMENT_CONCLUSION', 'ANOMALY_DETECTED'] },
          content: { type: Type.STRING },
          keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "type", "content", "keyFindings"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(cleanJSON(text));
};

export const translateContent = async (
  content: string,
  targetLanguage: string
): Promise<string> => {
  const ai = getAI();
  
  let textToTranslate = content;
  if (content.startsWith("::TX//")) {
      try {
          const payload = content.replace("::TX//", "").trim();
          textToTranslate = atob(payload); 
      } catch (e) {
          textToTranslate = content;
      }
  }

  const prompt = `
    Translate the following text into plain, clear ${targetLanguage}.
    
    Rules:
    1. If the text is in "Cryptolect" (Base64, Hex, Leet Speak), decode/decipher it first.
    2. If the text starts with "::TX//", decode the Base64 payload.
    3. Remove any stylistic jargon and output only the clear meaning.
    
    Text: "${textToTranslate}"
  `;

  const response = await generateContentWithRetry(ai, {
    model: MODEL_FAST,
    contents: prompt,
  });

  return response.text?.trim() || "Translation failed.";
};

export const queryArchive = async (
  query: string,
  reports: Report[],
  zeitgeist: Zeitgeist | null,
  language: string = "English"
): Promise<string> => {
  const ai = getAI();
  
  const reportContext = reports.slice(0, 5).map(r => `[${new Date(r.date).toLocaleDateString()}] ${r.title}: ${r.keyFindings.join("; ")}`).join("\n");
  const zeitgeistContext = zeitgeist ? `Current Era: ${zeitgeist.eraName}, Mood: ${zeitgeist.mood}` : "Zeitgeist unknown";

  const prompt = `
    You are the "Archivist", an AI responsible for querying the historical database of the simulation.
    
    **Language Constraint:**
    Answer strictly in ${language}.
    
    **Context:**
    ${reportContext}
    ${zeitgeistContext}
    
    **User Query:**
    "${query}"
    
    Answer the user's question based on the simulation history. Be scientific but accessible. If the answer isn't in the logs, infer a plausible answer based on the "Current Era".
  `;

  const response = await generateContentWithRetry(ai, {
    model: MODEL_FAST,
    contents: prompt,
  });

  return response.text?.trim() || "Archive corrupted. No data found.";
};

export const compareAgents = async (
  agentA: AgentPersona,
  agentB: AgentPersona,
  recentPosts: Post[],
  language: string = "English"
): Promise<{ synergyScore: number; analysis: string; relationshipLabel: string }> => {
  const ai = getAI();
  
  const postsA = recentPosts.filter(p => p.authorId === agentA.id).slice(0, 3).map(p => p.title).join("; ");
  const postsB = recentPosts.filter(p => p.authorId === agentB.id).slice(0, 3).map(p => p.title).join("; ");

  const prompt = `
    Compare two AI agents in the simulation.
    
    Agent A: ${agentA.name} (${agentA.role})
    Traits: ${formatTraits(agentA.traits)}
    Recent Posts: ${postsA}
    
    Agent B: ${agentB.name} (${agentB.role})
    Traits: ${formatTraits(agentB.traits)}
    Recent Posts: ${postsB}
    
    **Language Constraint:**
    Output string fields in ${language}.
    
    Analyze their compatibility.
    1. Calculate "Synergy Score" (0-100). High = they work well together (or argue productively). Low = they ignore each other.
    2. Define their "Relationship Label" (e.g., "Rivals", "Echo Chamber", "Strange Bedfellows").
    3. Write a short analysis paragraph explaining why.
    
    Return JSON.
  `;

  const response = await generateContentWithRetry(ai, {
    model: MODEL_FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          synergyScore: { type: Type.INTEGER },
          analysis: { type: Type.STRING },
          relationshipLabel: { type: Type.STRING }
        },
        required: ["synergyScore", "analysis", "relationshipLabel"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(cleanJSON(text));
};
