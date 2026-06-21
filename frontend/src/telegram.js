import axios from "axios";

const TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

export const sendTelegramAlert =
  async (message, imageUrl = null) => {

    try {
      let response;
      if (imageUrl && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))) {
        response = await axios.post(
          `https://api.telegram.org/bot${TOKEN}/sendPhoto`,
          {
            chat_id: CHAT_ID,
            photo: imageUrl,
            caption: message,
            parse_mode: "HTML",
          }
        );
      } else {
        response = await axios.post(
          `https://api.telegram.org/bot${TOKEN}/sendMessage`,
          {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: "HTML",
          }
        );
      }

      console.log(
        response.data
      );

      console.log(
        "Telegram Alert Sent 🚀"
      );

    } catch (error) {

      console.log(
        error.response?.data ||
        error.message
      );

      // Fallback to text message if photo sending fails
      if (imageUrl) {
        try {
          const fallbackResponse = await axios.post(
            `https://api.telegram.org/bot${TOKEN}/sendMessage`,
            {
              chat_id: CHAT_ID,
              text: message,
              parse_mode: "HTML",
            }
          );
          console.log(fallbackResponse.data);
          console.log("Telegram Alert Sent (Text fallback) 🚀");
          return;
        } catch (e) {
          console.log(e.response?.data || e.message);
        }
      }

      console.log(
        "Telegram Error ❌"
      );

    }

  };