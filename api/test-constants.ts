import { buildExternalSystemPrompt } from "../constants";

export default function handler(req: any, res: any) {
    res.status(200).json({ message: "Constants loaded successfully", type: typeof buildExternalSystemPrompt });
}
