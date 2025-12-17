/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Type } from "@google/genai";
import { ClinicAnalysis, Grid, RoomType } from "../types";
import { ROOMS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = 'gemini-2.5-flash';

// @google/genai-schema-fix
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: "A score from 0-100 evaluating the clinical workflow efficiency.",
    },
    feedback: {
      type: Type.STRING,
      description: "A 2-sentence summary of the layout's strengths and weaknesses from a dental architect's perspective.",
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3 specific actionable improvements (e.g., 'Move sterilization closer to operatories').",
    },
  },
  required: ['score', 'feedback', 'suggestions'],
};

export const analyzeClinicLayout = async (grid: Grid): Promise<ClinicAnalysis | null> => {
  // @google/genai-api-key-fix: API key is handled by env var, no explicit check needed.

  // 1. Serialize grid to a simple format for AI
  const roomCounts: Record<string, number> = {};
  const simplifiedGrid: string[][] = grid.map(row => 
    row.map(tile => {
      roomCounts[tile.roomType] = (roomCounts[tile.roomType] || 0) + 1;
      return tile.roomType === RoomType.None ? '.' : tile.roomType.substring(0, 3);
    })
  );

  const context = `
    You are an expert Dental Clinic Architect. Evaluate this floor plan grid.
    Grid Layout (ASCII-ish representation):
    ${simplifiedGrid.map(row => row.join(' ')).join('\n')}

    Room Count Summary:
    ${JSON.stringify(roomCounts)}

    Key Architectural Rules for Dental Clinics:
    1. Sterilization (Ste) should be central to Operatories (Ope) for workflow.
    2. Waiting Room (Wai) must be adjacent to Reception (Rec).
    3. X-Ray (XRa) should be easily accessible from Operatories.
    4. Staff Room (Sta) should be somewhat separated from patient areas.
  `;

  const prompt = `Analyze the provided layout. Assign an efficiency score (0-100). Provide specific feedback and 3 suggestions. Return JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `${context}\n${prompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.4, // Lower temp for more analytical/consistent results
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ClinicAnalysis;
    }
  } catch (error) {
    console.error("Error analyzing layout:", error);
  }
  return null;
};