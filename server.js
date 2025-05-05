const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Конфигурация
const GREEN_API_URL = 'https://api.green-api.com';
const ID_INSTANCE = process.env.ID_INSTANCE;
const API_TOKEN = process.env.API_TOKEN_IN;
const PORT = process.env.PORT || 3000;

// Обработчик всех вебхуков
app.post('/webhook', async (req, res) => {
  try {
    console.log('Received webhook type:', req.body.typeWebhook);

    // Обработка статусов инстанса
    if (req.body.typeWebhook === 'stateInstanceChanged') {
      console.log('Instance state:', req.body.stateInstance);
      return res.status(200).send('State received');
    }

    // Обработка входящих сообщений
    if (req.body.typeWebhook === 'incomingMessageReceived') {
      const chatId = req.body.senderData?.chatId;
      const text = req.body.messageData?.textMessageData?.textMessage || '';

      if (!chatId) {
        throw new Error('Missing chatId in webhook');
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

      return res.status(200).send('OK');
    }

    // Неизвестный тип вебхука
    console.warn('Unknown webhook type:', req.body.typeWebhook);
    res.status(200).send('Ignored');

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal error');
  }
});

// Проверка здоровья
app.get('/health', (req, res) => {
  res.send('Server is healthy');
});

// Отправка сообщения
async function sendMessage(chatId, text) {
  try {
    const response = await axios.post(
      `${GREEN_API_URL}/waInstance${ID_INSTANCE}/SendMessage/${API_TOKEN}`,
      { chatId, message: text }
    );
    console.log('Message sent to', chatId);
  } catch (error) {
    console.error('Send error:', error.response?.data || error.message);
  }
}

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
});