import { fal } from "@fal-ai/client";

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { type, image, prompt, artStyle, solutions, zodiacObj } = req.body;
    const falKey = process.env.FAL_KEY;

    if (!falKey) {
        return res.status(500).json({ error: 'FAL_KEY not configured' });
    }

    // Configure fal client with the API key from environment
    fal.config({ credentials: falKey });

    try {
        let result: any;

        if (type === 'to-be') {
            const itemsText = solutions.map((item: any) => `${item.item_name} (${item.placement_guide})`).join(", ");
            const editPrompt = `
        Modify this original room image. 
        Maintain EXACT camera angle and room structure. 
        Add these items naturally: ${itemsText}. 
        Style: Photo-realistic, interior design photography.
      `;

            // For to-be, use Seedream edit model. 
            // image is expected to be a data URI (e.g. data:image/jpeg;base64,...) 
            // from the frontend. We pass it directly to image_urls.
            const imageUrlToEdit = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;

            result = await fal.subscribe("fal-ai/bytedance/seedream/v4.5/edit", {
                input: {
                    prompt: editPrompt,
                    image_urls: [imageUrlToEdit],
                    image_size: "landscape_4_3",
                    num_images: 1,
                    enable_safety_checker: true
                },
            });

        } else if (type === 'remedy') {
            let styleKeywords = "";
            if (artStyle === 'buddhist') {
                styleKeywords = "Traditional Buddhist Art style, Thangka painting aesthetic, Zen spirituality, golden aura, intricate mandala patterns, temple atmosphere, divine and sacred look";
            } else if (artStyle === 'modern_buddhist') {
                styleKeywords = "Fusion of Modern Minimalist and Buddhist Art, sophisticated zen aesthetics, subtle golden lotus or mandala motifs in abstract geometry, contemporary spiritual art, clean lines, meditative atmosphere, gallery quality";
            } else {
                styleKeywords = "Modern Abstract Art style, minimalist, aesthetic, spiritual, 3D render, luxurious texture, cinematic lighting";
            }

            const t2iPrompt = `Create a high-quality portrait artistic talisman/digital art based on this concept: ${prompt}. 
      
      Design Style Instructions: ${styleKeywords}.
      
      The image must be suitable for a mobile wallpaper or framed wall art. High resolution, 8k.`;

            result = await fal.subscribe("fal-ai/bytedance/seedream/v4.5/text-to-image", {
                input: {
                    prompt: t2iPrompt,
                    image_size: "portrait_3_4", // Or portrait_4_3 depending on what gives a standard mobile aspect
                    num_images: 1,
                    enable_safety_checker: true
                },
            });

        } else if (type === 'zodiac') {
            const t2iPrompt = `A full-body 3D low-poly geometric sculpture of a ${zodiacObj.animal} for modern interior decor. Placed in a majestic pose. Crafted from luxurious ${zodiacObj.material_and_color}. Special feature: ${zodiacObj.specific_pose_or_feature}. High-end minimalist art object photography, professional studio lighting with dramatic reflections, clean neutral background, 8k resolution, C4D Arnold render style, ready for 3D printing aesthetic.`;

            result = await fal.subscribe("fal-ai/bytedance/seedream/v4.5/text-to-image", {
                input: {
                    prompt: t2iPrompt,
                    image_size: "square_hd",
                    num_images: 1,
                    enable_safety_checker: true
                },
            });
        }

        if (result && result.data && result.data.images && result.data.images.length > 0) {
            // fal returns URL directly. We send it back as the 'image' field for frontend
            return res.status(200).json({ image: result.data.images[0].url });
        }

        throw new Error("Image not generated properly by fal.ai");
    } catch (error: any) {
        console.error("Fal.ai Generation Error:", error);
        return res.status(500).json({ error: error.message || 'Image generation failed via fal.ai' });
    }
}
