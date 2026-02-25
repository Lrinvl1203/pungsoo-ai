import { buildMingongContext } from "../utils/fengshui";

export default function handler(req: any, res: any) {
    res.status(200).json({ message: "Utils loaded successfully", type: typeof buildMingongContext });
}
