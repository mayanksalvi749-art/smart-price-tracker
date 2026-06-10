export default function ProductCard({ product, addToCart }) {
  return (
    <div className="border p-4 rounded-xl shadow">
      <img src={product.image} className="h-32 w-full object-cover" />

      <h2 className="text-lg font-bold">{product.name}</h2>
      <p>₹ {product.price}</p>

      <div className="flex gap-2 mt-2">
        <button
          onClick={() => addToCart(product)}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Add to Cart
        </button>

        <button
          onClick={() => alert("Buy Now: " + product.name)}
          className="bg-green-500 text-white px-3 py-1 rounded"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}