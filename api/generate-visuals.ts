
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { type, image, prompt, artStyle, solutions } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key not configured' });
    }

    const genAI = new GoogleGenAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

    try {
        let finalPrompt = "";
        let imagePart = null;

        if (type === 'to-be') {
            const itemsText = solutions.map((item: any) => `${item.item_name} (${item.placement_guide})`).join(", ");
            finalPrompt = `
        Modify this original room image. 
        Maintain EXACT camera angle and room structure. 
        Add these items naturally: ${itemsText}. 
        Style: Photo-realistic, interior design photography.
      `;
            imagePart = {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: image.split(',')[1] || image,
                },
            };
        } else {
            let styleKeywords = "";
            if (artStyle === 'buddhist') {
                styleKeywords = "Traditional Buddhist Art style, Thangka painting aesthetic, Zen spirituality, golden aura, intricate mandala patterns, temple atmosphere, divine and sacred look";
            } else if (artStyle === 'modern_buddhist') {
                styleKeywords = "Fusion of Modern Minimalist and Buddhist Art, sophisticated zen aesthetics, subtle golden lotus or mandala motifs in abstract geometry, contemporary spiritual art, clean lines, meditative atmosphere, gallery quality";
            } else {
                styleKeywords = "Modern Abstract Art style, minimalist, aesthetic, spiritual, 3D render, luxurious texture, cinematic lighting";
            }

            finalPrompt = `Create a high-quality portrait artistic talisman/digital art based on this concept: ${prompt}. 
      
      Design Style Instructions: ${styleKeywords}.
      
      The image must be suitable for a mobile wallpaper or framed wall art. High resolution, 8k.`;
        }

        const result = await model.generateContent(imagePart ? [imagePart, finalPrompt] : [finalPrompt]);
        const response = await result.response;

        // Find the inlineData part containing the image
        const part = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
        if (part) {
            return res.status(200).json({ image: `data:image/png;base64,${part.inlineData.data}` });
        }

        throw new Error("Image part not found in response");
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: error.message || 'Image generation failed' });
    }
}
