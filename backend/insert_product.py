from database import supabase

# List of multiple products to insert into Supabase in bulk
products_to_insert = [
    {
        "name": "iPhone 16 Pro",
        "price": 119900,
        "image": "https://images.unsplash.com/photo-1695048133142-1a20484d2569",
        "product_url": "https://example.com/iphone16pro",
        "source": "Amazon"
    },
    {
        "name": "Samsung Galaxy S25 Ultra",
        "price": 129999,
        "image": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf",
        "product_url": "https://example.com/s25ultra",
        "source": "Flipkart"
    },
    {
        "name": "Sony WH-1000XM5",
        "price": 29999,
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        "product_url": "https://example.com/sonywh1000xm5",
        "source": "Croma"
    }
]

print("Inserting multiple products into Supabase...")
try:
    response = supabase.table("products").insert(products_to_insert).execute()
    print("Successfully inserted products:")
    for product in response.data:
        print(f"- ID: {product.get('id')} | Name: {product.get('name')} | Price: Rs.{product.get('price')}")
except Exception as e:
    print("Error inserting products:", e)