/* Telegram relay configuration.
   Fill these in with your own bot token and chat id. */
const botToken = "";
const chatId = "";

/* Published on window so js/store.js can read them without a hard import. */
window.botToken = botToken;
window.chatId = chatId;

export { botToken, chatId };
