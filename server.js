app.post('/webhook', async (req, res) => {
  try {
    console.log('Raw webhook:', JSON.stringify(req.body, null, 2));

    if (req.body.typeWebhook !== 'incomingMessageReceived') {
      return res.status(200).send('Not a message');
    }

    const chatId = req.body.senderData?.chatId;
    const messageType = req.body.messageData?.typeMessage;
    let text = '';

    // Обработка разных типов сообщений
    switch (messageType) {
      case 'textMessage':
        text = req.body.messageData.textMessageData?.textMessage || '';
        break;
      case 'extendedTextMessage':
        text = req.body.messageData.extendedTextMessageData?.text || '';
        break;
      case 'reactionMessage':
        text = '[Reaction] ' + req.body.messageData.reactionMessageData?.text || '';
        break;
      default:
        console.log('Unhandled message type:', messageType);
        return res.status(200).send('Unsupported message type');
    }

    console.log(`Message from ${chatId} (${messageType}): "${text}"`);

    // Только для текстовых сообщений
    if (['textMessage', 'extendedTextMessage'].includes(messageType)) {
      const rating = parseInt(text);
      if (!isNaN(rating) && rating >= 1 && rating <= 5) {
        const response = rating >= 4 
          ? 'Спасибо за высокую оценку! Оставьте отзыв: [ссылка]' 
          : 'Спасибо за обратную связь!';
        await sendMessage(chatId, response);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal error');
  }
});