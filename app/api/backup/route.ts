import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [products, orders] = await Promise.all([
    prisma.product.findMany({ orderBy: [{ category: "asc" }, { colour: "asc" }] }),
    prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    summary: {
      totalProducts: products.length,
      totalOrders: orders.length,
    },
    products,
    orders,
  };

  const dateStr = new Date().toISOString().split("T")[0];

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="RoyaleCladdings-Backup-${dateStr}.json"`,
    },
  });
}
