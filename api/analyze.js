import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64, mimeType } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "画像データがありません" });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `このバスケットボールのボックススコア画像を読み取って、以下のCSV形式で出力してください。

チーム,No,選手名,GS,PTS,3PM,3PA,2PM,2PA,FTM,FTA,OR,DR,AST,STL,BLK,TO,PF,MIN

ルール:
- GS（スターター）は1、ベンチは0
- TOTALSの行は含めない
- Team/Coachesの行は含めない
- ヘッダー行から始めてCSVのみ出力
- 余計な説明は不要`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: imageBase64,
        },
      },
    ]);

    const text = result.response.text();
    const csv = text.replace(/```csv\n?/g, "").replace(/```\n?/g, "").trim();
    res.status(200).json({ csv });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "画像の読み取りに失敗しました" });
  }
}