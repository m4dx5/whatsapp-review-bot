// 1. Инициализация Express
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express(); // ← Этой строки не хватало!

// 2. Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// 3. Конфигурация GreenAPI
const GREEN_API_URL = 'https://api.green-api.com';
const ID_INSTANCE = process.env.ID_INSTANCE;
const API_TOKEN = process.env.API_TOKEN_IN;
const PORT = process.env.PORT || 3000;

// 4. Проверка переменных окружения
if (!ID_INSTANCE || !API_TOKEN) {
  console.error('ERROR: Missing GreenAPI credentials');
  process.exit(1);
}

// 5. Обработчик вебхука
app.post('/webhook', async (req, res) => {
  try {
    console.log('Received webhook:', JSON.stringify(req.body, null, 2));

    if (req.body.typeWebhook !== 'incomingMessageReceived') {
      return res.status(200).send('Not a message');
    }

    const chatId = req.body.senderData?.chatId;
    const text = req.body.messageData?.textMessageData?.textMessage || '';

    if (!chatId) {
      return res.status(400).send('Missing chatId');
    }

    console.log(`Message from ${chatId}: "${text}"`);

    // Обработка оценки 1-5
    const rating = parseInt(text);
    if (!isNaN(rating) && rating >= 1 && rating <= 5) {
      const response = rating >= 4 
        ? 'Спасибо за высокую оценку! Оставьте отзыв: [ссылка]' 
        : 'Спасибо за обратную связь!';
      
      await sendMessage(chatId, response);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal error');
  }
});

// 6. Проверка здоровья
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

// 7. Функция отправки сообщения
async function sendMessage(chatId, text) {
  try {
    await axios.post(
      `${GREEN_API_URL}/waInstance${ID_INSTANCE}/SendMessage/${API_TOKEN}`,
      { chatId, message: text }
    );
    console.log('Message sent to', chatId);
  } catch (error) {
    console.error('Send error:', error.response?.data || error.message);
  }
}

// 8. Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server started on port ${PORT}`);
});