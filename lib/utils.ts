export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number, decimals = 2): string {
  return num.toFixed(decimals);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    SOFFIT: "bg-blue-100 text-blue-800",
    PERFORATION: "bg-purple-100 text-purple-800",
    "ROOF SOFFIT SV26": "bg-indigo-100 text-indigo-800",
    FRONTO: "bg-green-100 text-green-800",
    WELO: "bg-teal-100 text-teal-800",
    "MAX 3": "bg-orange-100 text-orange-800",
    LINERIO: "bg-pink-100 text-pink-800",
    "VOLOS SOFFIT": "bg-cyan-100 text-cyan-800",
    "VOLOS WELO": "bg-sky-100 text-sky-800",
    "LVT FLOORING": "bg-amber-100 text-amber-800",
    "LVT WALL": "bg-yellow-100 text-yellow-800",
    "SPC FLOORING": "bg-red-100 text-red-800",
    "SPC FLOORING NEW": "bg-rose-100 text-rose-800",
    "SPC FLOORING HB": "bg-fuchsia-100 text-fuchsia-800",
    TRIMS: "bg-slate-100 text-slate-800",
    "VOLOS TRIMS": "bg-zinc-100 text-zinc-800",
    "OTHER TRIMS": "bg-stone-100 text-stone-800",
    CEILING: "bg-lime-100 text-lime-800",
  };
  return colors[category] || "bg-gray-100 text-gray-800";
}

export function getStockStatus(boxes: number, totalSqft: number): "good" | "low" | "out" {
  if (boxes === 0 && totalSqft === 0) return "out";
  if (boxes <= 2) return "low";
  return "good";
}
