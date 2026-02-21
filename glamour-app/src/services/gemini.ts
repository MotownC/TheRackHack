import { GoogleGenAI } from "@google/genai";

// We need to handle the API key selection for the paid model
export const checkApiKey = async () => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
      // Wait a moment for the state to update, though we can't be 100% sure without polling
      // The guidance says "assume the key selection was successful"
    }
    return true;
  }
  return false; // Fallback for dev environments without the window object
};

export const generateProductShot = async (
  imageBase64: string,
  mimeType: string,
  prompt: string,
  aspectRatio: "1:1" | "3:4" | "4:3" | "16:9" = "3:4"
) => {
  // Ensure we have a key
  await checkApiKey();

  // Re-initialize to get the latest key
  // Prefer the selected API_KEY, fallback to GEMINI_API_KEY
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key not found. Please select a key.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: "2K", // High quality for pro shots
        },
      },
    });

    // Extract image
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated");
  } catch (error: any) {
    console.error("Generation error:", error);
    
    // Handle specific error for missing/invalid key entity
    if (error.message?.includes("Requested entity was not found")) {
      if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
        throw new Error("API Key was invalid or expired. Please try again with the newly selected key.");
      }
    }
    
    throw error;
  }
};
