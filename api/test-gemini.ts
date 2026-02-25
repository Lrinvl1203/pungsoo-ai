import { GoogleGenerativeAI } from "@google/generative-ai";

export default function handler(req: any, res: any) {
    res.status(200).json({ message: "Google SDK loaded successfully", type: typeof GoogleGenerativeAI });
}
