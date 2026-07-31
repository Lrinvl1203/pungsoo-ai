import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GEMINI_API_KEY를 define으로 주입하지 않는다. define은 값을 클라이언트 번들에
// 리터럴로 새겨 넣으므로, 클라이언트 코드가 한 번이라도 참조하면 키가 그대로
// 배포된다. Gemini 호출은 api/analyze.ts와 api/analyze-location.ts에서만 하고
// 그쪽은 서버 런타임의 process.env를 직접 읽는다.
export default defineConfig(() => {
  return {
    server: {
      port: 4173,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
