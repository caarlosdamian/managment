import { useState } from "react";
import { useLoaderData } from "react-router";
import type { Route } from "./+types/pos";
import { connectDB } from "~/db/connection.server";
import { InventoryItem } from "~/db/models/inventory.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Point of Sale | Management" },
    { name: "description", content: "Process sales and manage transactions" },
  ];
}

// ─── Server Loader ────────────────────────────────────────
export async function loader() {
  await connectDB();
  const items = await InventoryItem.find({ showInPOS: true, price: { $gt: 0 } })
    .sort({ category: 1, name: 1 })
    .lean();

  return {
    products: items.map((item) => ({
      _id: item._id.toString(),
      name: item.name,
      price: item.price,
      category: item.category,
      emoji: item.emoji,
    })),
  };
}

// ─── Types ────────────────────────────────────────────────
interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
}

interface CartItem extends Product {
  quantity: number;
}

// ─── Component ────────────────────────────────────────────
export default function POS() {
  const { products } = useLoaderData<typeof loader>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);

  const categories = ["All", ...Array.from(new Set((products as Product[]).map((p) => p.category)))];

  const filteredProducts = (products as Product[]).filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item._id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    setShowCheckout(true);
    setTimeout(() => {
      setShowCheckout(false);
      setCart([]);
    }, 2000);
  };

  return (
    <div className="pos-layout" id="pos-page">
      {/* ── Product Panel ─────────────────────────── */}
      <div className="pos-products">
        <div className="pos-products-header">
          <div>
            <h1 className="page-title">Point of Sale</h1>
            <p className="page-subtitle">Select items to add to the order</p>
          </div>
        </div>

        {/* Search */}
        <div className="pos-search-bar" id="pos-search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pos-search-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pos-search-input"
          />
        </div>

        {/* Categories */}
        <div className="pos-categories" id="pos-categories">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`pos-category-btn ${activeCategory === cat ? "pos-category-btn--active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="pos-product-grid" id="pos-product-grid">
          {filteredProducts.map((product) => (
            <button
              key={product._id}
              className="pos-product-card"
              onClick={() => addToCart(product)}
              id={`product-${product._id}`}
            >
              <span className="pos-product-emoji">{product.emoji}</span>
              <span className="pos-product-name">{product.name}</span>
              <span className="pos-product-price">${product.price.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Cart Panel ────────────────────────────── */}
      <div className="pos-cart" id="pos-cart">
        <div className="pos-cart-header">
          <h2 className="pos-cart-title">Current Order</h2>
          <span className="pos-cart-badge">{totalItems}</span>
        </div>

        {cart.length === 0 ? (
          <div className="pos-cart-empty">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="pos-cart-empty-icon">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <p>No items in order</p>
            <span>Tap a product to add it</span>
          </div>
        ) : (
          <>
            <div className="pos-cart-items">
              {cart.map((item) => (
                <div key={item._id} className="pos-cart-item" id={`cart-item-${item._id}`}>
                  <div className="pos-cart-item-info">
                    <span className="pos-cart-item-emoji">{item.emoji}</span>
                    <div className="pos-cart-item-details">
                      <span className="pos-cart-item-name">{item.name}</span>
                      <span className="pos-cart-item-price">${item.price.toFixed(2)} each</span>
                    </div>
                  </div>
                  <div className="pos-cart-item-actions">
                    <div className="pos-qty-control">
                      <button className="pos-qty-btn" onClick={() => updateQuantity(item._id, -1)} aria-label="Decrease quantity">−</button>
                      <span className="pos-qty-value">{item.quantity}</span>
                      <button className="pos-qty-btn" onClick={() => updateQuantity(item._id, 1)} aria-label="Increase quantity">+</button>
                    </div>
                    <span className="pos-cart-item-total">${(item.price * item.quantity).toFixed(2)}</span>
                    <button className="pos-remove-btn" onClick={() => removeFromCart(item._id)} aria-label="Remove item">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pos-cart-footer">
              <div className="pos-cart-summary">
                <div className="pos-summary-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="pos-summary-row">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="pos-summary-row pos-summary-total">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                className={`pos-checkout-btn ${showCheckout ? "pos-checkout-btn--success" : ""}`}
                onClick={handleCheckout}
                disabled={showCheckout}
                id="pos-checkout"
              >
                {showCheckout ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Payment Successful!
                  </>
                ) : (
                  <>Charge ${total.toFixed(2)}</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
