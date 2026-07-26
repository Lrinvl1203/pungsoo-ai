import { fal } from "@fal-ai/client";
import { buildRemedyArtPrompt } from "../utils/remedyArt.js";

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 3000): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            const is503 = err?.status === 503 || err?.message?.includes('503');
            if (is503 && attempt < retries) {
                console.warn(`fal.ai 503, retry ${attempt}/${retries} after ${delayMs}ms`);
                await new Promise(r => setTimeout(r, delayMs * attempt));
                continue;
            }
            throw err;
        }
    }
    throw new Error('Max retries exceeded');
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { type, image, prompt, solutions, zodiacObj, imageSize, remedyContext } = req.body;
    const falKey = process.env.FAL_KEY;

    if (!falKey) {
        console.error("FAL_KEY is missing from environment variables!");
        return res.status(500).json({ error: 'FAL_KEY not configured. Please add FAL_KEY to Vercel Environment Variables.' });
    }
    if (!['to-be', 'remedy', 'zodiac'].includes(type)) {
        return res.status(400).json({ error: 'type must be one of to-be, remedy, or zodiac.' });
    }
    if (type === 'to-be' && (!image || !Array.isArray(solutions))) {
        return res.status(400).json({ error: 'image and solutions are required for to-be generation.' });
    }
    if (type === 'remedy' && !prompt && !remedyContext?.remedyArt) {
        return res.status(400).json({ error: 'prompt or remedyContext is required for remedy generation.' });
    }
    if (type === 'zodiac' && !zodiacObj?.animal) {
        return res.status(400).json({ error: 'zodiacObj is required for zodiac generation.' });
    }

    // Configure fal client with the API key from environment
    fal.config({ credentials: falKey });

    try {
        let result: any;

        if (type === 'to-be') {
            const itemsText = solutions.map((item: any) => `${item.item_name} (${item.placement_guide})`).join(", ");
            const editPrompt = `Look at Figure 1. Modify this room image by adding these interior items naturally into the scene: ${itemsText}. Maintain the EXACT same camera angle, room structure, walls, floor, and existing furniture. Only add the new items in appropriate locations. Style: Photo-realistic interior design photography, natural lighting.`;

            // Upload image to fal storage first to avoid Vercel 4.5MB body size limit
            const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
            const uploadedUrl = await fal.storage.upload(blob);
            console.log("Uploaded image to fal storage:", uploadedUrl);

            result = await withRetry(() => fal.subscribe("fal-ai/bytedance/seedream/v4.5/edit", {
                input: {
                    prompt: editPrompt,
                    image_urls: [uploadedUrl],
                    image_size: "landscape_4_3",
                    num_images: 1,
                    enable_safety_checker: true
                },
            }));

        } else if (type === 'remedy') {
            const { prompt: t2iPrompt, profile } = buildRemedyArtPrompt({
                ...remedyContext,
                remedyArt: remedyContext?.remedyArt || {
                    deficiency: 'earth',
                    solution_keyword: prompt,
                    image_generation_prompt: prompt,
                },
            });

            let finalImageSize: any = "portrait_4_3"; // Default

            if (imageSize) {
                if (imageSize.preset === 'custom' && imageSize.customWidth && imageSize.customHeight) {
                    finalImageSize = {
                        width: imageSize.customWidth,
                        height: imageSize.customHeight
                    };
                } else if (imageSize.preset !== 'custom') {
                    // Map presets to Fal AI predefined sizes
                    switch (imageSize.preset) {
                        case '1:1': finalImageSize = "square_hd"; break;
                        case '9:16': finalImageSize = "portrait_16_9"; break;
                        case '16:9': finalImageSize = "landscape_16_9"; break;
                        case '4:3': finalImageSize = "landscape_4_3"; break;
                        case '3:4': finalImageSize = "portrait_4_3"; break;
                        default: finalImageSize = "portrait_4_3";
                    }
                }
            }

            result = await withRetry(() => fal.subscribe("fal-ai/bytedance/seedream/v4.5/text-to-image", {
                input: {
                    prompt: t2iPrompt,
                    image_size: finalImageSize,
                    num_images: 1,
                    enable_safety_checker: true
                },
            }));

            if (result && typeof result === 'object') {
                result.remedyArtProfile = profile;
            }

        } else if (type === 'zodiac') {
            const t2iPrompt = `A full-body 3D low-poly geometric sculpture of a ${zodiacObj.animal} for modern interior decor. Placed in a majestic pose. Crafted from luxurious ${zodiacObj.material_and_color}. Special feature: ${zodiacObj.specific_pose_or_feature}. High-end minimalist art object photography, professional studio lighting with dramatic reflections, clean neutral background, 8k resolution, C4D Arnold render style, ready for 3D printing aesthetic.`;

            result = await withRetry(() => fal.subscribe("fal-ai/bytedance/seedream/v4.5/text-to-image", {
                input: {
                    prompt: t2iPrompt,
                    image_size: "square_hd",
                    num_images: 1,
                    enable_safety_checker: true
                },
            }));
        }

        console.log("Fal.ai raw result keys:", result ? Object.keys(result) : "null");

        // Handle both possible response structures: result.data.images or result.images
        const images = result?.data?.images || result?.images;

        if (images && images.length > 0) {
            return res.status(200).json({
                image: images[0].url,
                remedyArtProfile: type === 'remedy' ? result?.remedyArtProfile : undefined,
            });
        }

        console.error("Fal.ai unexpected result structure:", JSON.stringify(result).slice(0, 500));
        throw new Error("Image not generated properly by fal.ai");
    } catch (error: any) {
        console.error("Fal.ai Generation Error:", error?.message || error);
        console.error("Error details:", JSON.stringify({
            type,
            hasImage: !!image,
            errorName: error?.name,
            errorBody: error?.body,
            errorStatus: error?.status
        }));
        return res.status(500).json({ error: error.message || 'Image generation failed via fal.ai' });
    }
}

