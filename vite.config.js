import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        chatbot: resolve(__dirname, 'chatbot.html'),
        fakenews: resolve(__dirname, 'fakenews.html'),
        quiz: resolve(__dirname, 'quiz.html'),
        simulator: resolve(__dirname, 'simulator.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        learning: resolve(__dirname, 'learning.html'),
        login: resolve(__dirname, 'login.html')
      }
    }
  }
});
