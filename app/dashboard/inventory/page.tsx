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

type EditableProduct = Partial<Product>;

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditableProduct>({});
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState<EditableProduct>({
    category: "SOFFIT", code: "", colour: "", variant: "INTERIOR",
    mtrs: 0, sqftPerPlank: 0, boxes: 0, loosePieces: "0",
    totalPieces: 0, totalSqft: 0, newUpcoming: "",
  });

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

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditData({ ...p });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    await fetch(`/api/inventory/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    setEditingId(null);
    fetchProducts();
    setSaving(false);
  };

  const addProduct = async () => {
    setSaving(true);
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    });
    setShowAddModal(false);
    setNewProduct({
      category: "SOFFIT", code: "", colour: "", variant: "INTERIOR",
      mtrs: 0, sqftPerPlank: 0, boxes: 0, loosePieces: "0",
      totalPieces: 0, totalSqft: 0, newUpcoming: "",
    });
    fetchProducts();
    setSaving(false);
  };

  const grouped = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} products • Click any row to edit</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Product
        </button>
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white min-w-[180px]"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="card overflow-hidden">
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
                      <th className="text-right">{cat === "SPC FLOORING HB" ? "A Variant (Sq Ft)" : "Sq Ft/Plank"}</th>
                      <th className="text-right">{cat === "SPC FLOORING HB" ? "B Variant (Boxes)" : ["TRIMS","VOLOS TRIMS","OTHER TRIMS"].includes(cat) ? "Pieces" : "Boxes"}</th>
                      <th className="text-right">Total Pcs</th>
                      <th>Loose</th>
                      <th className="text-right">Total Sq Ft</th>
                      <th>Upcoming</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(cat === "SPC FLOORING" ? items.slice().sort((a, b) => a.sqftPerPlank - b.sqftPerPlank) : items).map((p) => {
                      const isEditing = editingId === p.id;
                      const status = getStockStatus(p.boxes, p.totalSqft);

                      if (isEditing) {
                        return (
                          <tr key={p.id} className="bg-amber-50">
                            <td><input className="input py-1 text-xs w-24" value={editData.code || ""} onChange={e => setEditData(d => ({ ...d, code: e.target.value }))}/></td>
                            <td><input className="input py-1 text-xs w-32" value={editData.colour || ""} onChange={e => setEditData(d => ({ ...d, colour: e.target.value }))}/></td>
                            <td><input className="input py-1 text-xs w-24" value={editData.variant || ""} onChange={e => setEditData(d => ({ ...d, variant: e.target.value }))}/></td>
                            <td className="text-right"><input type="number" step="0.01" className="input py-1 text-xs w-16 text-right" value={editData.mtrs || 0} onChange={e => setEditData(d => ({ ...d, mtrs: parseFloat(e.target.value) }))}/></td>
                            <td className="text-right"><input type="number" step="0.01" className="input py-1 text-xs w-16 text-right" value={editData.sqftPerPlank || 0} onChange={e => setEditData(d => ({ ...d, sqftPerPlank: parseFloat(e.target.value) }))}/></td>
                            <td className="text-right"><input type="number" className="input py-1 text-xs w-16 text-right" value={editData.boxes || 0} onChange={e => setEditData(d => ({ ...d, boxes: parseInt(e.target.value) }))}/></td>
                            <td className="text-right"><input type="number" className="input py-1 text-xs w-16 text-right" value={editData.totalPieces || 0} onChange={e => setEditData(d => ({ ...d, totalPieces: parseInt(e.target.value) }))}/></td>
                            <td><input className="input py-1 text-xs w-20" value={editData.loosePieces || "0"} onChange={e => setEditData(d => ({ ...d, loosePieces: e.target.value }))}/></td>
                            <td className="text-right"><input type="number" step="0.01" className="input py-1 text-xs w-20 text-right" value={editData.totalSqft || 0} onChange={e => setEditData(d => ({ ...d, totalSqft: parseFloat(e.target.value) }))}/></td>
                            <td><input className="input py-1 text-xs w-28" value={editData.newUpcoming || ""} onChange={e => setEditData(d => ({ ...d, newUpcoming: e.target.value }))}/></td>
                            <td>—</td>
                            <td>
                              <div className="flex gap-1">
                                <button onClick={saveEdit} disabled={saving} className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50">
                                  {saving ? "..." : "Save"}
                                </button>
                                <button onClick={() => setEditingId(null)} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={p.id} className="cursor-pointer" onClick={() => startEdit(p)}>
                          <td className="font-mono text-xs font-medium">{p.code}</td>
                          <td className="font-medium">{p.colour}</td>
                          <td className="text-gray-500">{p.variant}</td>
                          <td className="text-right tabular-nums">{p.mtrs > 0 ? p.mtrs : "—"}</td>
                          <td className="text-right tabular-nums">{p.sqftPerPlank > 0 ? p.sqftPerPlank : "—"}</td>
                          <td className="text-right tabular-nums font-medium">{p.boxes}</td>
                          <td className="text-right tabular-nums">{p.totalPieces || "—"}</td>
                          <td className="text-xs text-gray-500 max-w-[80px] truncate">{p.loosePieces}</td>
                          <td className="text-right tabular-nums font-medium">{p.totalSqft > 0 ? formatNumber(p.totalSqft, 2) : "—"}</td>
                          <td className="text-xs text-amber-600 max-w-[100px] truncate">{p.newUpcoming}</td>
                          <td>
                            <span className={`badge text-xs ${
                              status === "good" ? "bg-green-100 text-green-700" :
                              status === "low" ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {status === "good" ? "In Stock" : status === "low" ? "Low" : "Out"}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={(e) => { e.stopPropagation(); startEdit(p); }}
                              className="text-gray-400 hover:text-brand-gold transition-colors p-1"
                            >
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                              </svg>
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

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto fade-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Add New Product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={e => setNewProduct(d => ({ ...d, category: e.target.value }))}
                    className="input"
                  >
                    {CATEGORIES.filter(c => c !== "ALL").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Code</label>
                  <input value={newProduct.code || ""} onChange={e => setNewProduct(d => ({ ...d, code: e.target.value }))} className="input" placeholder="SVP 08"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Colour</label>
                  <input value={newProduct.colour || ""} onChange={e => setNewProduct(d => ({ ...d, colour: e.target.value }))} className="input" placeholder="GOLDEN OAK"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Variant</label>
                  <input value={newProduct.variant || ""} onChange={e => setNewProduct(d => ({ ...d, variant: e.target.value }))} className="input" placeholder="INTERIOR"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Mtrs</label>
                  <input type="number" step="0.01" value={newProduct.mtrs || 0} onChange={e => setNewProduct(d => ({ ...d, mtrs: parseFloat(e.target.value) }))} className="input"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Sq Ft/Plank</label>
                  <input type="number" step="0.01" value={newProduct.sqftPerPlank || 0} onChange={e => setNewProduct(d => ({ ...d, sqftPerPlank: parseFloat(e.target.value) }))} className="input"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Boxes</label>
                  <input type="number" value={newProduct.boxes || 0} onChange={e => setNewProduct(d => ({ ...d, boxes: parseInt(e.target.value) }))} className="input"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Total Pieces</label>
                  <input type="number" value={newProduct.totalPieces || 0} onChange={e => setNewProduct(d => ({ ...d, totalPieces: parseInt(e.target.value) }))} className="input"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Loose Pieces</label>
                  <input value={newProduct.loosePieces || "0"} onChange={e => setNewProduct(d => ({ ...d, loosePieces: e.target.value }))} className="input"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Total Sq Ft</label>
                  <input type="number" step="0.01" value={newProduct.totalSqft || 0} onChange={e => setNewProduct(d => ({ ...d, totalSqft: parseFloat(e.target.value) }))} className="input"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Upcoming Notes</label>
                <input value={newProduct.newUpcoming || ""} onChange={e => setNewProduct(d => ({ ...d, newUpcoming: e.target.value }))} className="input" placeholder="Optional notes"/>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={addProduct} disabled={saving || !newProduct.colour || !newProduct.code} className="btn-primary flex-1">
                {saving ? "Adding..." : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
