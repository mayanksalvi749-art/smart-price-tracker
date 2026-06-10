import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Register from "./pages/Register";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/CartPage";

function App() {

  const [cart, setCart] = useState([]);

  const addToCart = (product) => {

    const existing = cart.find(
      (item) => item.id === product.id
    );

    if (existing) {

      setCart(
        cart.map((item) =>
          item.id === product.id
            ? {
              ...item,
              quantity: item.quantity + 1,
            }
            : item
        )
      );

    } else {

      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
        },
      ]);
    }
  };

  const removeFromCart = (id) => {

    setCart(cart.filter((item) => item.id !== id));
  };

  const increaseQty = (id) => {

    setCart(
      cart.map((item) =>
        item.id === id
          ? {
            ...item,
            quantity: item.quantity + 1,
          }
          : item
      )
    );
  };

  const decreaseQty = (id) => {

    setCart(
      cart.map((item) =>
        item.id === id
          ? {
            ...item,
            quantity:
              item.quantity > 1
                ? item.quantity - 1
                : 1,
          }
          : item
      )
    );
  };

  const checkoutCart = () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      alert("Please log in to checkout.");
      return false;
    }

    const order = {
      id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      items: [...cart],
      total: cart.reduce((total, item) => {
        const numericPrice = Number(item.price.replace(/[₹,]/g, ""));
        return total + numericPrice * item.quantity;
      }, 0),
      status: "Booked",
    };

    // Add order to currentUser's orders list
    const updatedUser = {
      ...currentUser,
      orders: [...(currentUser.orders || []), order]
    };

    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    // Update users list in localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = users.map((u) => u.email === updatedUser.email ? updatedUser : u);
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    setCart([]);
    return true;
  };

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={
            <Dashboard
              addToCart={addToCart}
              cart={cart}
            />
          }
        />

        <Route
          path="/product"
          element={<ProductDetails />}
        />

        <Route
          path="/cart"
          element={
            <Cart
              cart={cart}
              removeFromCart={removeFromCart}
              increaseQty={increaseQty}
              decreaseQty={decreaseQty}
              checkoutCart={checkoutCart}
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;