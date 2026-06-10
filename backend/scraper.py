from sqlalchemy import create_engine
from sqlalchemy import text
from dotenv import load_dotenv
import os

load_dotenv()

engine = create_engine(os.getenv("MYSQL_URL"))


products = [

{
"name": "iPhone 16",
"price": "79999",
"image": "https://picsum.photos/300",
"source": "Demo"
},

{
"name": "Samsung S25",
"price": "69999",
"image": "https://picsum.photos/301",
"source": "Demo"
}

]


try:

    with engine.begin() as conn:

        for item in products:

            conn.execute(

                text("""

                INSERT INTO products
                (
                name,
                price,
                image,
                source
                )

                VALUES
                (
                :name,
                :price,
                :image,
                :source
                )

                """),

                item

            )

    print("Saved To MySQL")


except Exception as e:

    print("ERROR:")
    print(e)