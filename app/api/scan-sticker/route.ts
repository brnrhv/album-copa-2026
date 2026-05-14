import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === "SUA_API_KEY_AQUI" || apiKey === "") {
      return NextResponse.json(
        { error: "Por favor, configure a GEMINI_API_KEY no arquivo .env.local para habilitar o scanner IA." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: "Nenhuma imagem enviada para processamento." },
        { status: 400 }
      );
    }

    // Convert the image to base64 so Gemini API can process it directly
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = imageFile.type || "image/jpeg";

    // Initialize Google Generative AI with the secure Server-Side API Key
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using gemini-1.5-flash: ultra fast, cost-efficient, multimodal
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { 
        responseMimeType: "application/json" 
      }
    });

    const prompt = `
You are a specialized assistant that identifies football sticker codes (like FIFA World Cup / Panini album).
Analyze the uploaded image and identify ALL visible unique sticker codes.
Focus closely on the top corners (usually top-right) and borders of the sticker where the code normally is written.

You must strictly return ONLY a valid JSON object matching this schema:
{
  "codes": ["BRA01", "ARG05"],
  "rawText": "summary of visible text read from the card",
  "confidence": "high" | "medium" | "low"
}

Guidelines for extraction:
1. Find all instances of sticker codes. These consist of 2 to 4 letters followed by 1 to 2 digits (e.g. BRA01, FWC10, MEX05, CIV19, CC04).
2. Normalize ALL detected codes:
   - Must be upper case (e.g., "bra" -> "BRA").
   - Remove all whitespace.
   - Numbers MUST ALWAYS be 2 digits (pad 1-digit numbers with a leading zero, e.g., 1 -> 01, 7 -> 07).
   - Conversion Examples: "bra 5" -> "BRA05", "FWC 3" -> "FWC03", "CC 2" -> "CC02", "MEX 14" -> "MEX14".
3. Look carefully at letters vs numbers. Some styles make "I" look like "1", "O" like "0". Double check the country context.
4. In "rawText", summarize important text you saw on the card (like the team name, player name, etc.).
5. In "confidence", rate how sure you are of the identified code(s).
`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    try {
      const parsed = JSON.parse(responseText);
      return NextResponse.json(parsed);
    } catch (parseErr) {
      console.error("Gemini response wasn't valid JSON:", responseText);
      return NextResponse.json(
        { 
          codes: [], 
          rawText: responseText, 
          confidence: "low",
          error: "Falha ao interpretar resposta da IA."
        }
      );
    }

  } catch (error: any) {
    console.error("Error calling Gemini API in server-side route:", error);
    return NextResponse.json(
      { error: error.message || "Ocorreu um erro de comunicação com o servidor da IA." },
      { status: 500 }
    );
  }
}
