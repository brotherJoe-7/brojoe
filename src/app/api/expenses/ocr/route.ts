import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Convert base64 data URL to the format Gemini expects
    const base64Data = imageBase64.split(',')[1];
    const mimeTypeMatch = imageBase64.match(/data:([^;]+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
    
    const prompt = `You are an OCR and receipt extraction assistant. Extract the following details from the receipt image: 
    - amount: total amount as a number (e.g. 15.50)
    - vendor: name of the store or vendor (e.g. KFC, Shell)
    - date: date of the receipt in YYYY-MM-DD format
    - category: suggest one of [transport, food, supplies, accommodation, communication, miscellaneous]
    Return ONLY a valid JSON object with these keys. If a field cannot be found, return null for it. DO NOT wrap in markdown formatting like \`\`\`json.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType
        }
      }
    ]);

    const responseText = result.response.text().trim();
    let data;
    try {
      // Remove any potential markdown wrapping
      const cleaned = responseText.replace(/^```json\n?/, '').replace(/```$/, '').trim();
      data = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse AI response', responseText);
      data = {};
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
