const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Конфигурация GreenAPI
const GREEN_API_URL = 'https://api.green-api.com';
const ID_INSTANCE = process.env.ID_INSTANCE;
const API_TOKEN = process.env.API_TOKEN_IN;
const PORT = process.env.PORT || 3000;

// Проверка переменных окружения
if (!ID_INSTANCE || !API_TOKEN) {
  console.error('ERROR: Missing GreenAPI credentials');
  process.exit(1);
}

// Обработчик вебхука
app.post('/webhook', async (req, res) => {
  try {
    console.log('Received webhook:', JSON.stringify(req.body, null, 2));

    // Проверка структуры входящих данных
    if (!req.body || !req.body.senderData || !req.body.messageData) {
      console.error('Invalid webhook structure');
      return res.status(400).json({ error: 'Invalid request structure' });
    }

    const { chatId } = req.body.senderData;
    const text = req.body.messageData.textMessageData?.textMessage || '';

    console.log(`Message from ${chatId}: ${text}`);

    // Обработка оценки
    const rating = parseInt(text);
    if (!isNaN(rating) && rating >= 1 && rating <= 5) {
      const response = rating >= 4 
        ? 'Спасибо за высокую оценку! Оставьте отзыв: [ссылка]'
        : 'Спасибо за обратную связь!';
      
      await sendMessage(chatId, response);
    }

    res.status(200).json({ status: 'OK' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Проверка работоспособности
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

// Функция отправки сообщения
async function sendMessage(chatId, text) {
  try {
    const response = await axios.post(
      `${GREEN_API_URL}/waInstance${ID_INSTANCE}/SendMessage/${API_TOKEN}`,
      { chatId, message: text }
    );
    console.log('Message sent:', response.data);
  } catch (error) {
    console.error('Send message error:', error.response?.data || error.message);
  }
}

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});