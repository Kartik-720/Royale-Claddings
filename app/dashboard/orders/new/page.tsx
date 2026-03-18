"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Product, CartItem } from "@/types";
import { formatINR, getCategoryColor } from "@/lib/utils";

const CATEGORIES = [
  "ALL", "SOFFIT", "PERFORATION", "ROOF SOFFIT SV26", "FRONTO", "WELO",
  "MAX 3", "LINERIO", "VOLOS SOFFIT", "VOLOS WELO", "LVT FLOORING",
  "LVT WALL", "SPC FLOORING", "SPC FLOORING NEW", "SPC FLOORING HB",
  "TRIMS", "VOLOS TRIMS", "OTHER TRIMS", "CEILING",
];

type Step = "cart" | "checkout" | "confirm";

export default function NewOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("cart");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Checkout form
  const [piType, setPiType] = useState<"DELHI" | "OUTSIDE">("DELHI");
  const [billToName, setBillToName] = useState("");
  const [billToAddress, setBillToAddress] = useState("");
  const [shipToName, setShipToName] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [remarks, setRemarks] = useState("");
  const [deductStock, setDeductStock] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "ALL") params.set("category", category);
    if (debouncedSearch) params.set("search", debouncedSearch);
    const res = await fetch(`/api/inventory?${params}`);
    setProducts(await res.json());
    setLoading(false);
  }, [category, debouncedSearch]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const grouped = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  const addToCart = (product: Product) => {
    setAddingToCart(product.id);
    const existing = cart.find(c => c.productId === product.id);
    if (existing) {
      setCart(prev => prev.map(c => c.productId === product.id
        ? { ...c, planks: c.planks + 1, sqft: parseFloat(((c.planks + 1) * product.sqftPerPlank).toFixed(2)), amount: parseFloat(((c.planks + 1) * product.sqftPerPlank * c.rate).toFixed(2)) }
        : c
      ));
    } else {
      const desc = `${product.code} - ${product.colour}${product.variant ? ` (${product.variant})` : ""}${product.mtrs ? ` ${product.mtrs}M` : ""}`;
      setCart(prev => [...prev, {
        productId: product.id,
        description: desc,
        planks: 1,
        sqft: product.sqftPerPlank || 0,
        rate: 0,
        amount: 0,
        product,
      }]);
    }
    setTimeout(() => setAddingToCart(null), 500);
    setShowCart(true);
  };

  const removeFromCart = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  const updateCartItem = (idx: number, field: keyof CartItem, value: string | number) => {
    setCart(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      if (field === "planks" || field === "rate" || field === "sqft") {
        const planks = field === "planks" ? Number(value) : item.planks;
        const sqftPerPlank = item.product?.sqftPerPlank || 0;
        const sqft = field === "sqft" ? Number(value) : (sqftPerPlank > 0 ? planks * sqftPerPlank : item.sqft);
        const rate = field === "rate" ? Number(value) : item.rate;
        updated.sqft = parseFloat(sqft.toFixed(2));
        updated.amount = parseFloat((sqft * rate).toFixed(2));
        if (field === "planks" && sqftPerPlank > 0) updated.sqft = parseFloat((planks * sqftPerPlank).toFixed(2));
      }
      return updated;
    }));
  };

  const addCustomItem = () => {
    setCart(prev => [...prev, {
      productId: null,
      description: "",
      planks: 0,
      sqft: 0,
      rate: 0,
      amount: 0,
    }]);
  };

  const totalAmount = cart.reduce((s, c) => s + c.amount, 0);
  const gstLabel = piType === "DELHI" ? "CGST 9% + SGST 9%" : "IGST 18%";
  const gstAmount = parseFloat((totalAmount * 0.18).toFixed(2));
  const grandTotal = parseFloat((totalAmount + gstAmount).toFixed(2));

  const submitOrder = async () => {
    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        piType,
        billToName,
        billToAddress,
        shipToName,
        shipToAddress,
        customerGstin,
        totalAmount,
        gstAmount,
        grandTotal,
        remarks,
        deductStock,
        items: cart.map(c => ({
          productId: c.productId,
          description: c.description,
          planks: c.planks,
          sqft: c.sqft,
          rate: c.rate,
          amount: c.amount,
        })),
      }),
    });
    const order = await res.json();
    router.push(`/dashboard/orders/${order.id}`);
  };

  if (step === "checkout" || step === "confirm") {
    return (
      <div className="p-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setStep("cart")} className="text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/>
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-500 text-sm">{cart.length} items · {formatINR(grandTotal)} total</p>
          </div>
        </div>

        {/* PI Type */}
        <div className="card p-5 mb-5">
          <h3 className="font-semibold text-gray-900 mb-4">Invoice Type</h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: "DELHI", label: "Delhi Region", sub: "CGST + SGST @ 9% each", icon: "🏙️" },
              { value: "OUTSIDE", label: "Outside Delhi", sub: "IGST @ 18%", icon: "🌏" },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setPiType(opt.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  piType === opt.value
                    ? "border-brand-gold bg-amber-50"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200"
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <p className="font-semibold text-gray-900 mt-1.5">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Bill To / Ship To */}
        <div className="card p-5 mb-5">
          <h3 className="font-semibold text-gray-900 mb-4">Customer Details</h3>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bill To</p>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name / Company</label>
                <input value={billToName} onChange={e => setBillToName(e.target.value)} className="input" placeholder="M/s. Company Name"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                <textarea value={billToAddress} onChange={e => setBillToAddress(e.target.value)} rows={3} className="input resize-none" placeholder="Full address..."/>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ship To</p>
                <button
                  type="button"
                  onClick={() => { setShipToName(billToName); setShipToAddress(billToAddress); }}
                  className="text-xs text-brand-gold hover:underline font-medium"
                >
                  Same as Bill To
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name / Company</label>
                <input value={shipToName} onChange={e => setShipToName(e.target.value)} className="input" placeholder="Same as bill to"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                <textarea value={shipToAddress} onChange={e => setShipToAddress(e.target.value)} rows={3} className="input resize-none" placeholder="Delivery address..."/>
              </div>
            </div>
          </div>

          {piType === "OUTSIDE" && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Customer GSTIN</label>
              <input value={customerGstin} onChange={e => setCustomerGstin(e.target.value)} className="input max-w-sm" placeholder="22AAAAA0000A1Z5"/>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">Remarks</label>
            <input value={remarks} onChange={e => setRemarks(e.target.value)} className="input" placeholder="Optional notes..."/>
          </div>
        </div>

        {/* Cart Summary */}
        <div className="card p-5 mb-5">
          <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-right">Planks</th>
                <th className="text-right">Sq Ft</th>
                <th className="text-right">Rate (₹/sqft)</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, idx) => (
                <tr key={idx}>
                  <td className="text-sm">{item.description}</td>
                  <td className="text-right tabular-nums">{item.planks}</td>
                  <td className="text-right tabular-nums">{item.sqft.toFixed(2)}</td>
                  <td className="text-right tabular-nums">{formatINR(item.rate)}</td>
                  <td className="text-right tabular-nums font-medium">{formatINR(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 ml-auto max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-medium">{formatINR(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{gstLabel}</span>
              <span className="font-medium">{formatINR(gstAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2">
              <span>Grand Total</span>
              <span className="text-brand-gold">{formatINR(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Stock Deduction */}
        <div className="card p-5 mb-6">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="deduct"
              checked={deductStock}
              onChange={e => setDeductStock(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-brand-gold"
            />
            <div>
              <label htmlFor="deduct" className="font-medium text-gray-900 cursor-pointer">
                Deduct from inventory after saving
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                This will reduce the stock quantities for all items in this order. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep("cart")} className="btn-secondary px-6">
            Back to Cart
          </button>
          <button
            onClick={submitOrder}
            disabled={submitting || !billToName || cart.length === 0}
            className="btn-primary px-8 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Creating PI...
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Create Proforma Invoice
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Cart step (main order page)
  return (
    <div className="flex h-full">
      {/* Main product area */}
      <div className={`flex-1 overflow-auto p-8 transition-all ${showCart && cart.length > 0 ? "pr-4" : ""}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
            <p className="text-gray-500 text-sm mt-1">Browse inventory and add items to cart</p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative flex items-center gap-2 btn-primary"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
              </svg>
              Cart
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {cart.length}
              </span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            />
          </div>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white min-w-[180px]"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="card">
                <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <span className={`badge ${getCategoryColor(cat)}`}>{cat}</span>
                  <span className="text-xs text-gray-400">{items.length} items</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Colour</th>
                        <th>Variant</th>
                        <th className="text-right">Mtrs</th>
                        <th className="text-right">Sq Ft/Plank</th>
                        <th className="text-right">Boxes</th>
                        <th className="text-right">Sq Ft</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(p => {
                        const inCart = cart.find(c => c.productId === p.id);
                        return (
                          <tr key={p.id}>
                            <td className="font-mono text-xs font-medium">{p.code}</td>
                            <td className="font-medium">{p.colour}</td>
                            <td className="text-gray-500">{p.variant}</td>
                            <td className="text-right tabular-nums">{p.mtrs > 0 ? p.mtrs : "—"}</td>
                            <td className="text-right tabular-nums">{p.sqftPerPlank > 0 ? p.sqftPerPlank : "—"}</td>
                            <td className="text-right tabular-nums font-medium">{p.boxes}</td>
                            <td className="text-right tabular-nums">{p.totalSqft > 0 ? p.totalSqft.toFixed(1) : "—"}</td>
                            <td>
                              <button
                                onClick={() => addToCart(p)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                  addingToCart === p.id
                                    ? "bg-green-500 text-white"
                                    : inCart
                                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                    : "bg-gray-100 text-gray-700 hover:bg-brand-gold hover:text-white"
                                }`}
                              >
                                {addingToCart === p.id ? "✓ Added" : inCart ? `In Cart (${inCart.planks})` : "+ Add"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Panel */}
      {showCart && cart.length > 0 && (
        <div className="w-[420px] flex-shrink-0 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden slide-in">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Cart ({cart.length})</h2>
            <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {item.productId ? (
                      <p className="text-xs font-medium text-gray-900 leading-tight">{item.description}</p>
                    ) : (
                      <input
                        value={item.description}
                        onChange={e => updateCartItem(idx, "description", e.target.value)}
                        placeholder="Custom item description..."
                        className="input py-1 text-xs w-full"
                      />
                    )}
                  </div>
                  <button onClick={() => removeFromCart(idx)} className="text-gray-300 hover:text-red-400 flex-shrink-0 mt-0.5">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Planks</label>
                    <input
                      type="number"
                      value={item.planks}
                      onChange={e => updateCartItem(idx, "planks", parseInt(e.target.value) || 0)}
                      className="input py-1 text-xs text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Sq Ft</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.sqft}
                      onChange={e => updateCartItem(idx, "sqft", parseFloat(e.target.value) || 0)}
                      className="input py-1 text-xs text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Rate (₹/ft²)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={e => updateCartItem(idx, "rate", parseFloat(e.target.value) || 0)}
                      className="input py-1 text-xs text-right"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-gray-400">Amount</span>
                  <span className="text-sm font-bold text-gray-900">{formatINR(item.amount)}</span>
                </div>
              </div>
            ))}

            <button
              onClick={addCustomItem}
              className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-brand-gold hover:text-brand-gold transition-colors flex items-center justify-center gap-1"
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Custom Item
            </button>
          </div>

          {/* Cart footer */}
          <div className="border-t border-gray-100 p-4 bg-white">
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatINR(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">GST (18%)</span>
                <span>{formatINR(gstAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-1.5 border-t border-gray-100">
                <span>Total</span>
                <span className="text-brand-gold">{formatINR(grandTotal)}</span>
              </div>
            </div>
            <button
              onClick={() => setStep("checkout")}
              className="w-full btn-primary py-3 text-base"
            >
              Proceed to Checkout →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
