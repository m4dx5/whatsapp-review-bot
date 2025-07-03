require('dotenv').config(); // Для локального тестирования
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

// Инициализация приложения
const app = express();
app.use(bodyParser.json());

// Конфигурация GreenAPI
const GREEN_API_URL = 'https://api.green-api.com';
const ID_INSTANCE = process.env.ID_INSTANCE;
const API_TOKEN = process.env.API_TOKEN_IN;
const PORT = process.env.PORT || 3000;

// Проверка конфигурации
if (!ID_INSTANCE || !API_TOKEN) {
  console.error('❌ Ошибка: Не заданы обязательные переменные окружения');
  console.error('Проверьте наличие в Render:');
  console.error('1. ID_INSTANCE');
  console.error('2. API_TOKEN_IN');
  process.exit(1);
}

console.log('✅ Конфигурация загружена:');
console.log('ID_INSTANCE:', ID_INSTANCE);
console.log('API_TOKEN:', '***' + API_TOKEN.slice(-4));
console.log('PORT:', PORT);

// Обработчик входящих сообщений
app.post('/webhook', async (req, res) => {
  try {
    console.log('\n📩 Получен вебхук:', JSON.stringify(req.body, null, 2));

    // Проверка типа вебхука
    if (req.body.typeWebhook !== 'incomingMessageReceived') {
      console.log('⚡ Игнорируем вебхук типа:', req.body.typeWebhook);
      return res.status(200).json({ status: 'ignored' });
    }

    // Извлечение данных сообщения
    const chatId = req.body.senderData?.chatId;
    const messageType = req.body.messageData?.typeMessage;
    let text = '';

    // Определение текста сообщения
    switch (messageType) {
      case 'textMessage':
        text = req.body.messageData.textMessageData?.textMessage || '';
        break;
      case 'extendedTextMessage':
        text = req.body.messageData.extendedTextMessageData?.text || '';
        break;
      default:
        console.log('⚠️ Неподдерживаемый тип сообщения:', messageType);
        return res.status(200).json({ status: 'unsupported_type' });
    }

    console.log(`✉️ Сообщение от ${chatId}: "${text}"`);

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
        responseMessage = `🔧 Добрый день! Благодарим вас за доверие и визит в наш шинный центр. Нам очень важно знать, насколько вам понравился сервис!\n\nПожалуйста, оставьте отзыв о нашей работе:\n👉 Яндекс: https://goo.su/EpDmq\n👉 2ГИС: https://goo.su/Ur3h\n\nС заботой,\n📞 Контакт для связи: +7(992)555-57-70`;
      }
      
      // Отправка ответа
      await sendWhatsAppMessage(chatId, responseMessage);
    }

    res.status(200).json({ status: 'processed' });
  } catch (error) {
    console.error('🔥 Ошибка обработки вебхука:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Проверка работоспособности
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'WhatsApp Review Bot',
    version: '1.0.1',
    timestamp: new Date().toISOString()
  });
});

// Функция отправки сообщения
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
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 5000 // Таймаут 5 секунд
      }
    );
    
    console.log('📤 Сообщение отправлено:', {
      to: chatId,
      messageId: response.data.idMessage,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  } catch (error) {
    console.error('💥 Ошибка отправки сообщения:', {
      error: error.response?.data || error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Обработка ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Необработанное исключение:', reason);
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 WhatsApp Review Bot запущен`);
  console.log(`🔗 URL вебхука: https://ваш-сервис.onrender.com/webhook`);
  console.log(`🔄 Порт: ${PORT}`);
  console.log(`📞 ID инстанса: ${ID_INSTANCE}`);
  console.log(`⏱️ ${new Date().toLocaleString()}`);
});
