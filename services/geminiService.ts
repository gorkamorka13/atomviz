import { GoogleGenAI, Type } from "@google/genai";
import { OrbitalState, OrbitalDescription } from "../types";

export const getOrbitalExplanation = async (orbital: OrbitalState): Promise<OrbitalDescription> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Fournis une description physique brève et l'équation simplifiée de la fonction d'onde pour l'orbitale atomique définie par les nombres quantiques : n=${orbital.n}, l=${orbital.l}, m=${orbital.m} (nom: ${orbital.name}).
    
    Instructions:
    1. La "text" doit être en français, pédagogique, et expliquer la forme et les nœuds.
    2. La "equation" doit être une représentation mathématique simplifiée (ex: Ψ ∝ ...).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: 'Description textuelle de l\'orbitale en français.',
            },
            equation: {
              type: Type.STRING,
              description: 'Équation mathématique simplifiée de l\'orbitale.',
            },
          },
          required: ['text', 'equation'],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as OrbitalDescription;
    }
    
    throw new Error("Empty response from Gemini");

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback in case of error (e.g. invalid API key or network issue)
    return {
        text: "Impossible de récupérer la description via Gemini. Veuillez vérifier votre clé API ou votre connexion.",
        equation: "N/A"
    };
  }
};