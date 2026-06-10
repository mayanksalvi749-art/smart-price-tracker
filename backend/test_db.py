from database import supabase

print(supabase)
from database import supabase

response = supabase.table("products").insert({
    "name": "iPhone 15",
    "price": 64999,
    "image": "https://example.com/iphone.jpg",
    "product_url": "https://example.com/iphone15",
    "source": "91mobiles"
}).execute()

print(response.data)