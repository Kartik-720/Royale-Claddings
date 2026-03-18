import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const maxDuration = 30;

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: [{ category: "asc" }, { colour: "asc" }],
  });

  const wb = XLSX.utils.book_new();

  // Group products by category
  const grouped = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, typeof products>);

  // Build rows: title + date, then per-category sections
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const rows: (string | number | null)[][] = [
    ["ROYALE CLADDINGS — STOCK REPORT"],
    [`Generated: ${dateStr}`],
    [],
    ["Category", "Code", "Colour", "Variant", "Mtrs", "Sq Ft/Plank", "Boxes", "Total Pieces", "Loose Pieces", "Total Sq Ft", "Status"],
  ];

  for (const [cat, items] of Object.entries(grouped)) {
    for (const p of items) {
      const status =
        p.totalSqft === 0 && p.boxes === 0
          ? "Out of Stock"
          : p.boxes <= 5 || p.totalSqft <= 200
          ? "Low Stock"
          : "In Stock";
      rows.push([
        cat,
        p.code,
        p.colour,
        p.variant || "",
        p.mtrs || "",
        p.sqftPerPlank || "",
        p.boxes,
        p.totalPieces || "",
        p.loosePieces || "",
        p.totalSqft || "",
        status,
      ]);
    }
    rows.push([]); // blank row between categories
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 18 }, // Category
    { wch: 14 }, // Code
    { wch: 22 }, // Colour
    { wch: 14 }, // Variant
    { wch: 8 },  // Mtrs
    { wch: 12 }, // Sq Ft/Plank
    { wch: 8 },  // Boxes
    { wch: 13 }, // Total Pieces
    { wch: 13 }, // Loose Pieces
    { wch: 12 }, // Total Sq Ft
    { wch: 12 }, // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Stock Report");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Royale-Claddings-Stock-${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  });
}
