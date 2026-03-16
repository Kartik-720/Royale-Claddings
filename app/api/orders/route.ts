import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const maxDuration = 30;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "No user ID" }, { status: 401 });

  const body = await req.json();
  const {
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
    items,
  } = body;

  // Generate PI number
  const counter = await prisma.pICounter.update({
    where: { id: "counter" },
    data: { count: { increment: 1 } },
  });

  const year = new Date().getFullYear().toString().slice(-2);
  const piNumber = `RC/${year}/${String(counter.count).padStart(4, "0")}`;

  const order = await prisma.order.create({
    data: {
      piNumber,
      piType,
      billToName,
      billToAddress,
      shipToName,
      shipToAddress,
      customerGstin: customerGstin || "",
      totalAmount,
      gstAmount,
      grandTotal,
      remarks: remarks || "",
      stockDeducted: deductStock,
      createdBy: userId,
      items: {
        create: items.map((item: {
          productId?: string;
          description: string;
          planks: number;
          sqft: number;
          rate: number;
          amount: number;
        }) => ({
          productId: item.productId || null,
          description: item.description,
          planks: item.planks,
          sqft: item.sqft,
          rate: item.rate,
          amount: item.amount,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });

  // Deduct stock if requested
  if (deductStock) {
    for (const item of items) {
      if (!item.productId) continue;

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) continue;

      // Calculate deduction based on planks
      const planksPerBox = product.sqftPerPlank > 0
        ? Math.floor(10 / product.sqftPerPlank * 10)
        : 10;

      const totalPiecesToDeduct = item.planks;
      const boxesPerPack = product.totalPieces > 0 && product.boxes > 0
        ? Math.floor(product.totalPieces / product.boxes)
        : 10;

      const boxesToDeduct = Math.floor(totalPiecesToDeduct / boxesPerPack);
      const looseDeduct = totalPiecesToDeduct % boxesPerPack;

      const newTotalPieces = Math.max(0, product.totalPieces - totalPiecesToDeduct);
      const newTotalSqft = Math.max(0, product.totalSqft - item.sqft);
      const newBoxes = Math.max(0, product.boxes - boxesToDeduct);

      await prisma.product.update({
        where: { id: item.productId },
        data: {
          totalPieces: newTotalPieces,
          totalSqft: newTotalSqft,
          boxes: newBoxes,
        },
      });
    }
  }

  return NextResponse.json(order, { status: 201 });
}
