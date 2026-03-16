import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getStats() {
  const [productCount, orderCount, products, recentOrders] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.product.findMany({ select: { totalSqft: true, boxes: true, category: true } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, piNumber: true, billToName: true, grandTotal: true, piType: true, createdAt: true },
    }),
  ]);

  const totalSqft = products.reduce((s, p) => s + p.totalSqft, 0);
  const totalBoxes = products.reduce((s, p) => s + p.boxes, 0);
  const outOfStock = products.filter((p) => p.boxes === 0 && p.totalSqft === 0).length;
  const lowStock = products.filter((p) => p.boxes > 0 && p.boxes <= 2).length;

  const categoryBreakdown = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = { count: 0, sqft: 0 };
    acc[p.category].count++;
    acc[p.category].sqft += p.totalSqft;
    return acc;
  }, {} as Record<string, { count: number; sqft: number }>);

  return { productCount, orderCount, totalSqft, totalBoxes, outOfStock, lowStock, recentOrders, categoryBreakdown };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back. Here's what's happening with your inventory.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Total Products"
          value={stats.productCount.toString()}
          sub="SKUs in system"
          icon="📦"
          color="blue"
        />
        <StatCard
          label="Total Stock"
          value={`${stats.totalBoxes.toLocaleString()} boxes`}
          sub={`${stats.totalSqft.toLocaleString("en-IN", { maximumFractionDigits: 0 })} sq ft`}
          icon="🏪"
          color="green"
        />
        <StatCard
          label="Low / Out of Stock"
          value={`${stats.lowStock} / ${stats.outOfStock}`}
          sub="Need attention"
          icon="⚠️"
          color={stats.outOfStock > 5 ? "red" : "amber"}
        />
        <StatCard
          label="Total Orders"
          value={stats.orderCount.toString()}
          sub="PIs generated"
          icon="📄"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-xs text-brand-gold hover:underline font-medium">
              View all →
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-400 text-sm">No orders yet</p>
              <Link href="/dashboard/orders/new" className="mt-3 btn-primary text-sm">
                Create First Order
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{order.piNumber}</p>
                    <p className="text-gray-500 text-xs">{order.billToName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 text-sm">{fmt(order.grandTotal)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2.5">
              <Link
                href="/dashboard/orders/new"
                className="flex items-center gap-3 p-3 rounded-lg bg-brand-gold/10 hover:bg-brand-gold/20 transition-colors group"
              >
                <span className="w-8 h-8 rounded-lg bg-brand-gold flex items-center justify-center text-white text-sm">+</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">New Order / PI</p>
                  <p className="text-xs text-gray-500">Create invoice & cart</p>
                </div>
              </Link>
              <Link
                href="/dashboard/inventory"
                className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Edit Inventory</p>
                  <p className="text-xs text-gray-500">Update stock levels</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Category summary */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Category Overview</h2>
            <div className="space-y-2">
              {Object.entries(stats.categoryBreakdown)
                .sort((a, b) => b[1].sqft - a[1].sqft)
                .slice(0, 8)
                .map(([cat, data]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-600 font-medium truncate">{cat}</span>
                        <span className="text-gray-400 flex-shrink-0 ml-2">{data.count} SKUs</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-gold rounded-full"
                          style={{
                            width: `${Math.min(100, (data.sqft / stats.totalSqft) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1.5">{value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        </div>
        <span className={`text-xl p-2.5 rounded-xl ${colors[color] || colors.blue}`}>{icon}</span>
      </div>
    </div>
  );
}
