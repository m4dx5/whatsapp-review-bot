const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

// Инициализация приложения
const app = express();
app.use(bodyParser.json());

// Конфигурация GreenAPI
const GREEN_API_URL = 'https://api.green-api.com';
const ID_INSTANCE = process.env.ID_INSTANCE || '1103220109'; // Ваш ID из GreenAPI
const API_TOKEN = process.env.API_TOKEN_IN || 'ваш_api_токен'; // Ваш API токен
const PORT = process.env.PORT || 3000;

// Проверка конфигурации
console.log('Конфигурация бота:');
console.log('ID_INSTANCE:', ID_INSTANCE);
console.log('API_TOKEN:', API_TOKEN ? '***' + API_TOKEN.slice(-4) : 'не задан');

// Обработчик входящих сообщений
app.post('/webhook', async (req, res) => {
  try {
    console.log('\nПолучен вебхук:', JSON.stringify(req.body, null, 2));

    // Проверка типа вебхука
    if (req.body.typeWebhook !== 'incomingMessageReceived') {
      console.log('Игнорируем вебхук типа:', req.body.typeWebhook);
      return res.status(200).json({ status: 'ignored' });
    }

    // Извлечение данных сообщения
    const chatId = req.body.senderData?.chatId;
    const messageType = req.body.messageData?.typeMessage;
    let text = '';

    // Определение текста сообщения в зависимости от типа
    switch (messageType) {
      case 'textMessage':
        text = req.body.messageData.textMessageData?.textMessage || '';
        break;
      case 'extendedTextMessage':
        text = req.body.messageData.extendedTextMessageData?.text || '';
        break;
      default:
        console.log('Неподдерживаемый тип сообщения:', messageType);
        return res.status(200).json({ status: 'unsupported_type' });
    }

    console.log(`Сообщение от ${chatId}: "${text}"`);

    // Обработка оценки (1-5)
    const rating = parseInt(text.trim());
    if (!isNaN(rating) && rating >= 1 && rating <= 5) {
      let responseMessage;
      
      // Ответ для оценок 1-3
      if (rating <= 3) {
        responseMessage = 'Спасибо за вашу оценку! Мы учтем ваше мнение для улучшения сервиса.';
      } 
      // Ответ для оценок 4-5
      else {
        responseMessage = 'Благодарим за высокую оценку! Пожалуйста, оставьте отзыв: https://example.com/review';
      }
      
      // Отправка ответа
      await sendWhatsAppMessage(chatId, responseMessage);
    }

    res.status(200).json({ status: 'processed' });
  } catch (error) {
    console.error('Ошибка обработки вебхука:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Проверка работоспособности
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'WhatsApp Review Bot',
    version: '1.0.0'
  });
});

// Функция отправки сообщения через GreenAPI
async function sendWhatsAppMessage(chatId, message) {
  try {
    const response = await axios.post(
      `${GREEN_API_URL}/waInstance${ID_INSTANCE}/SendMessage/${API_TOKEN}`,
      {
        chatId: chatId,
        message: message
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Сообщение отправлено:', {
      chatId: chatId,
      messageId: response.data.idMessage
    });
    
    return response.data;
  } catch (error) {
    console.error('Ошибка отправки сообщения:', {
      chatId: chatId,
      error: error.response?.data || error.message
    });
    throw error;
  }
}

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ WhatsApp Review Bot запущен`);
  console.log(`🔗 URL вебхука: https://ваш-сервис.onrender.com/webhook`);
  console.log(`🔄 Порт: ${PORT}`);
  console.log(`📞 ID инстанса: ${ID_INSTANCE}`);
});