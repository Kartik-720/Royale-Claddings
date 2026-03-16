"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Order } from "@/types";
import { formatINR } from "@/lib/utils";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/orders")
      .then(r => r.json())
      .then(data => { setOrders(data); setLoading(false); });
  }, []);

  const filtered = orders.filter(o =>
    o.piNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.billToName.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = orders.reduce((s, o) => s + o.grandTotal, 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} orders · {formatINR(totalRevenue)} total revenue</p>
        </div>
        <Link href="/dashboard/orders/new" className="btn-primary flex items-center gap-2">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Order
        </Link>
      </div>

      <div className="mb-5">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by PI number or customer..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-400 text-sm">No orders found</p>
          <Link href="/dashboard/orders/new" className="mt-4 btn-primary">Create First Order</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>PI Number</th>
                <th>Customer</th>
                <th>Type</th>
                <th className="text-right">Items</th>
                <th className="text-right">Total Amount</th>
                <th className="text-right">GST</th>
                <th className="text-right">Grand Total</th>
                <th>Stock</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id}>
                  <td>
                    <span className="font-mono text-xs font-bold text-gray-900">{order.piNumber}</span>
                  </td>
                  <td className="font-medium">{order.billToName}</td>
                  <td>
                    <span className={`badge text-xs ${order.piType === "DELHI" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {order.piType === "DELHI" ? "Delhi (IGST)" : "Outside (CGST)"}
                    </span>
                  </td>
                  <td className="text-right tabular-nums">{order.items.length}</td>
                  <td className="text-right tabular-nums">{formatINR(order.totalAmount)}</td>
                  <td className="text-right tabular-nums text-gray-500">{formatINR(order.gstAmount)}</td>
                  <td className="text-right tabular-nums font-bold text-gray-900">{formatINR(order.grandTotal)}</td>
                  <td>
                    <span className={`badge text-xs ${order.stockDeducted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {order.stockDeducted ? "Deducted" : "Not deducted"}
                    </span>
                  </td>
                  <td className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td>
                    <Link href={`/dashboard/orders/${order.id}`} className="text-brand-gold hover:underline text-xs font-medium">
                      View PI →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
