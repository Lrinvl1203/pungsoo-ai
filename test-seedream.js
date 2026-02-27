import { fal } from "@fal-ai/client";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const falKey = process.env.FAL_KEY;
fal.config({ credentials: falKey });

async function testSeedreamOnly() {
    console.log("🚀 Seedream(Fal.ai) 이미지 생성 단독 테스트 시작...");
    console.log("👉 프롬프트: 'A beautiful golden Buddha statue, modern zen style, 8k resolution'");

    try {
        const startTime = Date.now();
        const result = await fal.subscribe("fal-ai/bytedance/seedream/v4.5/text-to-image", {
            input: {
                prompt: "A beautiful golden Buddha statue, modern zen style, 8k resolution",
                image_size: "portrait_4_3",
                num_images: 1,
            },
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const images = result?.data?.images || result?.images;

        if (images && images.length > 0) {
            console.log(`\n✅ 성공! (${duration}초 소요)`);
            console.log("🎉 생성된 이미지 URL을 브라우저에서 열어보세요:");
            console.log("\x1b[36m%s\x1b[0m", images[0].url); // 하늘색으로 URL 강조
        } else {
            console.log("\n❌ 알 수 없는 에러: 성공 응답은 왔지만 이미지 URL이 없습니다.");
        }
    } catch (e) {
        console.error("\n❌ 실패! 에러 상세 내용:");
        if (e.status === 403) {
            console.error("여전히 잔액 부족(Forbidden) 처리가 되고 있습니다. 결제 반영에 시간이 조금 걸릴 수 있습니다.");
        } else {
            console.error(e.message || e);
        }
    }
}

testSeedreamOnly();
