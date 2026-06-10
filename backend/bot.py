from dotenv import load_dotenv
import os
import requests

load_dotenv()

def send_telegram_message(name, price, link):
    bot_token = os.getenv("BOT_TOKEN")
    chat_id = os.getenv("CHAT_ID")

    message = f"""
🛒 Product Alert!

📱 Name: {name}
💰 Price: ₹{price}
🔗 Link: {link}
"""

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

    requests.post(url, data={
        "chat_id": chat_id,
        "text": message
    })