import { GoogleGenAI, Type } from "@google/genai";

export interface Character {
  id: string;
  name: string;
  age: number;
  image: string;
  gender: string;
  keywords: string[];
  mbti: string;
  isDead: boolean;
  deathDay?: number;
  uid: string;
  skills: { name: string; level: number; description: string }[];
}

export interface Resources {
  oxygen: number;
  food: number;
  water: number;
  fuel: number;
  integrity?: number;
}

export interface Choice {
  scenario: string;
  options: { text: string; result: string }[];
  selectedOptionIndex: number;
}

export interface DayLog {
  day: number;
  events: { text: string; time: string }[];
  statusUpdates: { characterId: string; status: string; isDead?: boolean }[];
  isDanger?: boolean;
  dangerType?: string;
  dialogues?: { characterId: string; text: string; time: string }[];
  moodScore: number; // 0-100
  resourceChanges: Partial<Resources>;
  skillUnlocks?: { characterId: string; skillName: string; description: string }[];
  choice?: Choice;
}

export interface Ending {
  title: string;
  description: string;
  outcome: 'success' | 'failure' | 'mixed';
}

export async function generateDailySimulation(
  day: number,
  characters: Character[],
  previousLogs: DayLog[],
  currentResources: Resources
): Promise<DayLog> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  const aliveCharacters = characters.filter(c => !c.isDead);
  const dangerCount = previousLogs.filter(l => l.isDanger).length;
  
  // Logic for forced danger
  let forceDanger = false;
  if (day === 5) forceDanger = true;
  if (day > 15 && day % 10 === 0) forceDanger = true; // Periodic crises
  if (day > 50 && dangerCount < 2) forceDanger = true;
  if (day > 55 && dangerCount < 3) forceDanger = true;

  const prompt = `
    우주선 'DRIFTER' 호가 지구로 귀환하는 60일간의 여정 중 제 ${day}일차 상황입니다.
    현재 생존한 대원들: ${aliveCharacters.map(c => `${c.name}(${c.gender}, MBTI: ${c.mbti}, 성격: ${c.keywords.join(', ')})`).join(', ')}
    현재 자원 상태: 산소 ${currentResources.oxygen}%, 식량 ${currentResources.food}%, 식수 ${currentResources.water}%, 연료 ${currentResources.fuel}%
    
    이전 상황 요약: ${previousLogs.slice(-5).map(l => `Day ${l.day}: ${l.events.map(e => e.text).join(' ')}`).join('\n')}

    오늘 우주선에서 일어난 2-3가지의 상호작용과 사건을 한국어로 아주 간결하게 작성해주세요. 
    **중요 지침**: 
    1. **캐릭터 중심**: 각 대원의 MBTI, 성격 키워드, 보유 기술을 바탕으로 그들만이 할 법한 행동과 대사를 생성하세요. 대원들 간의 관계(우정, 갈등, 협력)가 드러나야 합니다.
    2. **다양성**: 기계적인 일상 반복이 아닌, 예상치 못한 창의적인 사건(예: 생일 파티, 사소한 오해, 기술적 발견, 철학적 토론 등)을 포함하세요.
    3. **자원 및 선체**: 매일 산소, 식량, 식수가 소모됩니다. 사건에 따라 선체 내구도(integrity)가 변동될 수 있습니다.
    4. **선택 상황(choice)**: 오늘 대원들이 직면한 도덕적, 전략적, 또는 생존을 위한 중요한 선택 상황을 생성하세요. 대원들이 어떤 옵션을 선택했는지, 그리고 그 선택이 가져온 즉각적인 결과를 묘사하세요.
    
    **필수 요구사항**: 
    1. 캐릭터들 간의 성격이 묻어나는 짧은 대사(dialogues)를 1-2개 포함하세요.
    2. 분위기 지수(moodScore): 0-100.
    3. 자원 변동(resourceChanges): 오늘 발생한 자원 변화량을 숫자로 표시하세요. (integrity 포함 가능)
    4. 기술 해제(skillUnlocks): 오늘 새롭게 배우거나 강화된 기술이 있다면 포함하세요.
    5. 선택(choice): { "scenario": "상황 설명", "options": [{ "text": "선택지 1", "result": "결과 1" }, ...], "selectedOptionIndex": 0 } 형식으로 포함하세요.

    **위험 요소**: ${forceDanger ? '오늘은 반드시 위험 상황(Crisis)이 발생해야 합니다.' : '약 15%의 확률로 위험 상황이 발생할 수 있습니다.'}
    위험 상황 종류: '외계 생명체 침입', '선체 중대 파손', '우주 해적 습격', '시스템 폭주', '전염병 발생', '대원 간의 심각한 내분', '블랙홀 근접'.
    **부상 및 사망**: 위험 상황(Crisis) 발생 시 대원들이 부상을 입거나(status: "부상"), 낮은 확률로 사망(isDead: true)할 수 있습니다. 이를 statusUpdates에 반영하세요. 사망은 매우 신중하게 결정해야 하며, 극적인 순간에만 발생시켜야 합니다.

    **응답 지침**:
    1. 반드시 한국어로 응답하세요.
    2. 응답은 매우 간결하고 임팩트 있어야 합니다.
    3. JSON 형식을 엄격히 준수하세요.

    응답은 반드시 다음 JSON 형식을 따라야 합니다:
    {
      "day": ${day},
      "events": [
        { "text": "사건 내용", "time": "08:30" }
      ],
      "statusUpdates": [
        { "characterId": "캐릭터ID", "status": "상태 메시지", "isDead": false }
      ],
      "isDanger": true/false,
      "dangerType": "위험 종류",
      "dialogues": [
        { "characterId": "캐릭터ID", "text": "대사", "time": "09:00" }
      ],
      "moodScore": 75,
      "resourceChanges": { "oxygen": -2, "food": -3, "water": -3, "integrity": -5 },
      "skillUnlocks": [
        { "characterId": "캐릭터ID", "skillName": "기술명", "description": "설명" }
      ],
      "choice": {
        "scenario": "상황 설명",
        "options": [
          { "text": "선택지 1", "result": "결과 1" },
          { "text": "선택지 2", "result": "결과 2" }
        ],
        "selectedOptionIndex": 0
      }
    }
  `;

  const generate = async () => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a simulation engine. Always output valid JSON. Be extremely concise. Do not include newlines or control characters inside JSON strings. Escape all special characters. Do not add trailing commas.",
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.NUMBER },
            events: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  time: { type: Type.STRING }
                },
                required: ["text", "time"]
              } 
            },
            statusUpdates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  characterId: { type: Type.STRING },
                  status: { type: Type.STRING },
                  isDead: { type: Type.BOOLEAN }
                },
                required: ["characterId", "status"]
              }
            },
            isDanger: { type: Type.BOOLEAN },
            dangerType: { type: Type.STRING },
            dialogues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  characterId: { type: Type.STRING },
                  text: { type: Type.STRING },
                  time: { type: Type.STRING }
                },
                required: ["characterId", "text", "time"]
              }
            },
            moodScore: { type: Type.NUMBER },
            resourceChanges: {
              type: Type.OBJECT,
              properties: {
                oxygen: { type: Type.NUMBER },
                food: { type: Type.NUMBER },
                water: { type: Type.NUMBER },
                fuel: { type: Type.NUMBER },
                integrity: { type: Type.NUMBER }
              }
            },
            skillUnlocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  characterId: { type: Type.STRING },
                  skillName: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["characterId", "skillName", "description"]
              }
            },
            choice: {
              type: Type.OBJECT,
              properties: {
                scenario: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      result: { type: Type.STRING }
                    },
                    required: ["text", "result"]
                  }
                },
                selectedOptionIndex: { type: Type.NUMBER }
              },
              required: ["scenario", "options", "selectedOptionIndex"]
            }
          },
          required: ["day", "events", "statusUpdates", "moodScore", "dialogues", "resourceChanges"]
        }
      }
    });

    let text = response.text || "{}";
    text = text.trim();
    if (text.startsWith("```json")) {
      text = text.replace(/```json\n?|```/g, "").trim();
    }
    
    // Attempt to fix common JSON malformations and truncation
    const cleanJson = (str: string) => {
      let cleaned = str.trim();
      try {
        // Remove trailing commas before closing braces/brackets
        cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
        
        // If it looks truncated (doesn't end with } or ]), try to close it
        if (!cleaned.endsWith('}') && !cleaned.endsWith(']')) {
          // This is a very basic attempt to close open structures
          const openBraces = (cleaned.match(/{/g) || []).length;
          const closeBraces = (cleaned.match(/}/g) || []).length;
          const openBrackets = (cleaned.match(/\[/g) || []).length;
          const closeBrackets = (cleaned.match(/]/g) || []).length;
          
          for (let i = 0; i < openBrackets - closeBrackets; i++) cleaned += ']';
          for (let i = 0; i < openBraces - closeBraces; i++) cleaned += '}';
        }
        return cleaned;
      } catch (e) {
        return cleaned;
      }
    };

    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn("JSON parse failed, attempting cleanup...", e);
      try {
        return JSON.parse(cleanJson(text));
      } catch (e2) {
        // If still failing, try to find the last valid JSON object start/end
        console.error("Cleanup failed, raw text:", text);
        throw e2;
      }
    }
  };

  try {
    let result;
    try {
      result = await generate();
    } catch (e) {
      console.warn("First simulation attempt failed, retrying after delay...", e);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
      result = await generate();
    }
    
    result.statusUpdates = (result.statusUpdates || []).map((update: any) => {
      const char = characters.find(c => c.name === update.characterId || c.id === update.characterId);
      return { ...update, characterId: char?.id || update.characterId };
    });

    result.dialogues = (result.dialogues || []).map((d: any) => {
      const char = characters.find(c => c.name === d.characterId || c.id === d.characterId);
      return { ...d, characterId: char?.id || d.characterId };
    });

    result.skillUnlocks = (result.skillUnlocks || []).map((s: any) => {
      const char = characters.find(c => c.name === s.characterId || c.id === s.characterId);
      return { ...s, characterId: char?.id || s.characterId };
    });

    return result;
  } catch (error) {
    console.error("Simulation generation failed after retries:", error);
    return {
      day,
      events: [{ text: "시스템 통신 오류 발생. 데이터 복구 중...", time: "00:00" }],
      statusUpdates: [],
      moodScore: 50,
      dialogues: [],
      resourceChanges: { oxygen: -1, food: -1, water: -1 }
    };
  }
}

export async function generateEnding(
  characters: Character[],
  logs: DayLog[]
): Promise<Ending> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  const aliveCount = characters.filter(c => !c.isDead).length;
  const totalCount = characters.length;
  const avgMood = logs.reduce((acc, l) => acc + l.moodScore, 0) / logs.length;

  const prompt = `
    우주선 'DRIFTER' 호의 60일간의 여정이 끝났습니다.
    최종 생존 인원: ${aliveCount} / ${totalCount}
    평균 분위기 지수: ${avgMood.toFixed(1)}
    
    주요 사건들:
    ${logs.filter(l => l.isDanger).map(l => `Day ${l.day}: ${l.dangerType}`).join(', ')}

    주요 선택과 행동들:
    ${logs.filter(l => l.choice).map(l => `Day ${l.day}: ${l.choice?.scenario} -> ${l.choice?.options[l.choice?.selectedOptionIndex].text}`).join('\n')}

    이 데이터를 바탕으로 여정의 결말을 한국어로 작성해주세요. 
    생존 인원, 분위기, 그리고 대원들이 내린 선택들에 따라 '성공(지구 무사 귀환)', '실패(지구 도달 전 전멸 또는 실종)', '혼합(일부 생존 및 상처뿐인 귀환)' 중 하나의 결과(outcome)를 선택하세요.
    엔딩은 대원들의 희생이나 영웅적 행동, 또는 비극적인 선택들이 어떻게 결말에 영향을 미쳤는지 구체적으로 묘사해야 합니다.

    응답 형식:
    {
      "title": "엔딩 제목",
      "description": "엔딩 상세 설명 (3-5문장)",
      "outcome": "success" | "failure" | "mixed"
    }
  `;

  const generate = async () => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a simulation engine. Always output valid JSON. Be extremely concise. Do not include newlines or control characters inside JSON strings. Escape all special characters. Do not add trailing commas.",
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            outcome: { type: Type.STRING, enum: ["success", "failure", "mixed"] }
          },
          required: ["title", "description", "outcome"]
        }
      }
    });

    let text = response.text || "{}";
    text = text.trim();
    if (text.startsWith("```json")) {
      text = text.replace(/```json\n?|```/g, "").trim();
    }
    
    const cleanJson = (str: string) => {
      let cleaned = str.trim();
      try {
        cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
        if (!cleaned.endsWith('}') && !cleaned.endsWith(']')) {
          const openBraces = (cleaned.match(/{/g) || []).length;
          const closeBraces = (cleaned.match(/}/g) || []).length;
          const openBrackets = (cleaned.match(/\[/g) || []).length;
          const closeBrackets = (cleaned.match(/]/g) || []).length;
          for (let i = 0; i < openBrackets - closeBrackets; i++) cleaned += ']';
          for (let i = 0; i < openBraces - closeBraces; i++) cleaned += '}';
        }
        return cleaned;
      } catch (e) {
        return cleaned;
      }
    };

    try {
      return JSON.parse(text);
    } catch (e) {
      return JSON.parse(cleanJson(text));
    }
  };

  try {
    try {
      return await generate();
    } catch (e) {
      console.warn("First ending attempt failed, retrying...", e);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await generate();
    }
  } catch (error) {
    console.error("Ending generation failed after retries:", error);
    return {
      title: "여정의 끝",
      description: "통신이 두절되어 정확한 결말을 알 수 없습니다. 하지만 여정은 끝났습니다.",
      outcome: "mixed"
    };
  }
}
