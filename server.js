require('dotenv').config(); // Для локального тестирования
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Конфигурация GreenAPI
const GREEN_API_URL = 'https://api.green-api.com';
const ID_INSTANCE = process.env.ID_INSTANCE;
const API_TOKEN = process.env.API_TOKEN_IN;
const PORT = process.env.PORT || 3000;

// Проверка обязательных переменных
if (!ID_INSTANCE || !API_TOKEN) {
  console.error('ОШИБКА: Не заданы ID_INSTANCE или API_TOKEN_IN');
  process.exit(1);
}

// Маршрут для вебхука
app.post('/webhook', async (req, res) => {
  try {
    const { messageData, senderData } = req.body;
    const text = messageData?.textMessageData?.textMessage || '';
    const chatId = senderData.chatId;

    console.log(`[WEBHOOK] Сообщение от ${chatId}: "${text}"`);

    // Обработка оценки
    const rating = parseInt(text);
    if (!isNaN(rating) && rating >= 1 && rating <= 5) {
      const response = rating >= 4 
        ? 'Спасибо за оценку ★★★★★! Оставьте отзыв: [ваша_ссылка]' 
        : 'Спасибо за обратную связь! Мы работаем над улучшением.';
      
      await sendMessage(chatId, response);
    }

    res.status(200).json({ status: 'OK' });
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Проверка работоспособности
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

// Функция отправки сообщения
async function sendMessage(chatId, text) {
  try {
    await axios.post(
      `${GREEN_API_URL}/waInstance${ID_INSTANCE}/SendMessage/${API_TOKEN}`,
      { chatId, message: text }
    );
    console.log(`[SENT] Сообщение для ${chatId}`);
  } catch (err) {
    console.error('[SEND ERROR]', err.response?.data || err.message);
  }
}

// Явное указание хоста 0.0.0.0 для Render
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`🟢 GreenAPI ID: ${ID_INSTANCE}`);
  console.log(`🔗 Webhook URL: https://ваш-сервис.onrender.com/webhook`);
});