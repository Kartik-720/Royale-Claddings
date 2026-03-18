"use client";

import { useEffect, useState, useCallback } from "react";
import { Product } from "@/types";
import { formatNumber, getCategoryColor, getStockStatus } from "@/lib/utils";

const CATEGORIES = [
  "ALL", "SOFFIT", "PERFORATION", "ROOF SOFFIT SV26", "FRONTO", "WELO",
  "MAX 3", "LINERIO", "VOLOS SOFFIT", "VOLOS WELO", "LVT FLOORING",
  "LVT WALL", "SPC FLOORING", "SPC FLOORING NEW", "SPC FLOORING HB",
  "TRIMS", "VOLOS TRIMS", "OTHER TRIMS", "CEILING",
];

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }, [category, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Group by category
  const grouped = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  const totalSqft = products.reduce((s, p) => s + p.totalSqft, 0);
  const totalBoxes = products.reduce((s, p) => s + p.boxes, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#0f1117] shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-none">Royale Claddings</h1>
                <p className="text-gray-400 text-xs">Live Stock Inventory</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <div className="text-center">
                  <p className="text-brand-gold font-bold">{totalBoxes.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">Total Boxes</p>
                </div>
                <div className="w-px h-8 bg-white/10"/>
                <div className="text-center">
                  <p className="text-brand-gold font-bold">{formatNumber(totalSqft, 0)} ft²</p>
                  <p className="text-gray-400 text-xs">Total Sq Ft</p>
                </div>
              </div>
              <a
                href="/login"
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-gold transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                </svg>
                Admin Login
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by colour, code, category..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white shadow-sm"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white shadow-sm min-w-[180px]"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"/>
              <p className="text-gray-400 text-sm">Loading inventory...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-300 text-5xl mb-4">📦</div>
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className={`badge ${getCategoryColor(cat)}`}>{cat}</span>
                    <span className="text-xs text-gray-400">{items.length} items</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatNumber(items.reduce((s, p) => s + p.totalSqft, 0), 1)} ft² total
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Colour</th>
                        <th>Variant</th>
                        <th className="text-right">Mtrs</th>
                        <th className="text-right">{cat === "SPC FLOORING HB" ? "A Variant (Sq Ft)" : "Sq Ft/Plank"}</th>
                        <th className="text-right">{cat === "SPC FLOORING HB" ? "B Variant (Boxes)" : ["TRIMS","VOLOS TRIMS","OTHER TRIMS"].includes(cat) ? "Pieces" : "Boxes"}</th>
                        <th className="text-right">Pieces</th>
                        <th className="text-right">Loose</th>
                        <th className="text-right">Total Sq Ft</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((p) => {
                        const status = getStockStatus(p.boxes, p.totalSqft);
                        return (
                          <tr key={p.id}>
                            <td className="font-mono text-xs font-medium text-gray-900">{p.code}</td>
                            <td className="font-medium text-gray-800">{p.colour}</td>
                            <td className="text-gray-500">{p.variant}</td>
                            <td className="text-right tabular-nums">{p.mtrs > 0 ? p.mtrs : "—"}</td>
                            <td className="text-right tabular-nums">{p.sqftPerPlank > 0 ? p.sqftPerPlank : "—"}</td>
                            <td className="text-right tabular-nums font-medium">{p.boxes}</td>
                            <td className="text-right tabular-nums">{p.totalPieces || "—"}</td>
                            <td className="text-right tabular-nums text-gray-500">{p.loosePieces || "—"}</td>
                            <td className="text-right tabular-nums font-medium text-gray-900">
                              {p.totalSqft > 0 ? formatNumber(p.totalSqft, 2) : "—"}
                            </td>
                            <td>
                              <span className={`badge text-xs ${
                                status === "good" ? "bg-green-100 text-green-700" :
                                status === "low" ? "bg-amber-100 text-amber-700" :
                                "bg-red-100 text-red-700"
                              }`}>
                                {status === "good" ? "In Stock" : status === "low" ? "Low" : "Out"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {items.some(p => p.newUpcoming) && (
                  <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
                    <p className="text-xs font-medium text-amber-700 mb-1.5">Upcoming Notes:</p>
                    {items.filter(p => p.newUpcoming).map(p => (
                      <p key={p.id} className="text-xs text-amber-600">
                        • {p.colour} ({p.code}): {p.newUpcoming}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
