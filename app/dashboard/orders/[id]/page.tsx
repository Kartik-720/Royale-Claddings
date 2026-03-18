"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Order } from "@/types";
import { formatINR } from "@/lib/utils";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then(r => r.json())
      .then(data => { setOrder(data); setLoading(false); });
  }, [params.id]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (!order) return <div className="p-8 text-gray-500">Order not found</div>;

  const gstLabel18 = "IGST @ 18%";
  const gstLabelCGST = "CGST @ 9%";
  const gstLabelSGST = "SGST @ 9%";
  const isDelhi = order.piType === "DELHI";
  // Delhi = CGST+SGST @ 9% each; Outside Delhi = IGST @ 18%
  const today = new Date(order.createdAt);
  const dateStr = today.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  function numberToWords(n: number): string {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
      "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    if (n === 0) return "Zero";
    function convert(n: number): string {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
      if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
      if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
      if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
      return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
    }
    const integer = Math.floor(n);
    const decimal = Math.round((n - integer) * 100);
    let result = convert(integer) + " Rupees";
    if (decimal > 0) result += " and " + convert(decimal) + " Paise";
    return result + " Only";
  }

  return (
    <div>
      {/* Actions Bar - not printed */}
      <div className="no-print bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 flex items-center gap-1.5 text-sm">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/>
            </svg>
            Back
          </button>
          <div>
            <h1 className="font-bold text-gray-900">{order.piNumber}</h1>
            <p className="text-xs text-gray-400">{order.billToName} · {dateStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge text-xs ${isDelhi ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
            {isDelhi ? "Delhi — CGST+SGST 9%" : "Outside Delhi — IGST 18%"}
          </span>
          <span className={`badge text-xs ${order.stockDeducted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {order.stockDeducted ? "✓ Stock Deducted" : "Stock Not Deducted"}
          </span>
          <button
            onClick={() => window.print()}
            className="btn-primary flex items-center gap-2"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print / Download PI
          </button>
        </div>
      </div>

      {/* PI Document — this is what gets printed */}
      <div className="bg-white p-8 max-w-4xl mx-auto my-6 shadow-sm rounded-xl no-print-shadow print-page">
        <style jsx global>{`
          @media print {
            @page { size: A4 portrait; margin: 5mm 8mm; }
            body * { visibility: hidden !important; }
            .print-page, .print-page * { visibility: visible !important; }
            .print-page {
              position: absolute !important; left: 0 !important; top: 0 !important;
              width: 100% !important; margin: 0 !important; padding: 2mm 4mm !important;
              box-shadow: none !important; border-radius: 0 !important;
              font-size: 9pt !important; line-height: 1.25 !important;
            }
            .print-page img { height: 96px !important; }
            .print-page h2 { font-size: 11pt !important; padding: 2px 12px !important; }
            .print-page .mb-6 { margin-bottom: 6px !important; }
            .print-page .mb-5 { margin-bottom: 5px !important; }
            .print-page .mt-5 { margin-top: 5px !important; }
            .print-page .mt-6 { margin-top: 6px !important; }
            .print-page .py-2 { padding-top: 2px !important; padding-bottom: 2px !important; }
            .print-page .py-3 { padding-top: 3px !important; padding-bottom: 3px !important; }
            .print-page .px-3 { padding-left: 4px !important; padding-right: 4px !important; }
            .print-page .px-4 { padding-left: 5px !important; padding-right: 5px !important; }
            .print-page .p-3 { padding: 4px !important; }
            .print-page .p-8 { padding: 4mm !important; }
            .print-page .gap-6 { gap: 8px !important; }
            .print-page .h-12 { height: 24px !important; }
            .no-print { display: none !important; }
          }
        `}</style>

        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-900">
          <div className="flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/royale-logo.png" alt="Royale Claddings" className="h-28 w-auto object-contain mb-1"/>
          </div>
          <div className="text-right text-xs text-gray-600 space-y-0.5">
            <p className="font-medium">PLOT NO. 41, K.NO.171/6,</p>
            <p>SHOKEEN MARKET,</p>
            <p>THIRD FLOOR, NEB SARAI.</p>
            <p>NEW DELHI - 110068.</p>
            <p className="mt-1 font-medium">GSTIN: 07APAPK4246F1Z6</p>
            <p>royalecladdings@gmail.com</p>
          </div>
        </div>

        {/* PI Title & Number */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-widest border border-gray-900 inline-block px-8 py-1.5">
            PROFORMA INVOICE
          </h2>
          <div className="flex justify-between mt-3 text-sm">
            <span><strong>PI No:</strong> {order.piNumber}</span>
            <span><strong>Date:</strong> {dateStr}</span>
          </div>
        </div>

        {/* Bill To / Ship To */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border border-gray-300 rounded p-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">BILL TO:</p>
            <p className="font-semibold text-gray-900">{order.billToName}</p>
            <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-line">{order.billToAddress}</p>
            {!isDelhi && order.customerGstin && (
              <p className="text-xs mt-2 font-medium">GSTIN: {order.customerGstin}</p>
            )}
          </div>
          <div className="border border-gray-300 rounded p-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">SHIP TO:</p>
            <p className="font-semibold text-gray-900">{order.shipToName || order.billToName}</p>
            <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-line">{order.shipToAddress || order.billToAddress}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-0 border-collapse">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="border border-gray-700 px-3 py-2 text-left text-xs font-semibold w-8">S.NO</th>
              <th className="border border-gray-700 px-3 py-2 text-left text-xs font-semibold">DESCRIPTION</th>
              <th className="border border-gray-700 px-3 py-2 text-center text-xs font-semibold w-16">PLANKS</th>
              <th className="border border-gray-700 px-3 py-2 text-center text-xs font-semibold w-20">SQ FT</th>
              <th className="border border-gray-700 px-3 py-2 text-center text-xs font-semibold w-20">RATE</th>
              <th className="border border-gray-700 px-3 py-2 text-right text-xs font-semibold w-24">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-200 px-3 py-2 text-center">{idx + 1}</td>
                <td className="border border-gray-200 px-3 py-2 font-medium">{item.description}</td>
                <td className="border border-gray-200 px-3 py-2 text-center">{item.planks || "—"}</td>
                <td className="border border-gray-200 px-3 py-2 text-center">{item.sqft > 0 ? item.sqft.toFixed(2) : "—"}</td>
                <td className="border border-gray-200 px-3 py-2 text-center">
                  {item.rate > 0 ? formatINR(item.rate).replace("₹", "") : "—"}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-right font-medium">
                  {item.amount > 0 ? formatINR(item.amount) : "—"}
                </td>
              </tr>
            ))}
            {/* Empty rows to fill space */}
            {Array.from({ length: Math.max(0, 3 - order.items.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className={(order.items.length + i) % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-200 px-3 py-2">&nbsp;</td>
                <td className="border border-gray-200 px-3 py-2"></td>
                <td className="border border-gray-200 px-3 py-2"></td>
                <td className="border border-gray-200 px-3 py-2"></td>
                <td className="border border-gray-200 px-3 py-2"></td>
                <td className="border border-gray-200 px-3 py-2"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border border-gray-200 border-t-0">
          <div className="flex">
            <div className="flex-1 px-4 py-3 border-r border-gray-200">
              <p className="text-xs text-gray-500 italic">ASSURING YOU THE BEST AND PROMPT SERVICES</p>
              <p className="text-xs text-gray-600 mt-2 font-medium">Amount in Words:</p>
              <p className="text-xs text-gray-700 font-semibold italic">{numberToWords(order.grandTotal)}</p>
            </div>
            <div className="w-48 divide-y divide-gray-200">
              <div className="flex justify-between px-3 py-1.5 text-xs">
                <span className="text-gray-600">TOTAL AMOUNT</span>
                <span className="font-semibold">{formatINR(order.totalAmount)}</span>
              </div>
              {isDelhi ? (
                <>
                  <div className="flex justify-between px-3 py-1.5 text-xs">
                    <span className="text-gray-600">{gstLabelCGST}</span>
                    <span className="font-semibold">{formatINR(order.gstAmount / 2)}</span>
                  </div>
                  <div className="flex justify-between px-3 py-1.5 text-xs">
                    <span className="text-gray-600">{gstLabelSGST}</span>
                    <span className="font-semibold">{formatINR(order.gstAmount / 2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between px-3 py-1.5 text-xs">
                  <span className="text-gray-600">{gstLabel18}</span>
                  <span className="font-semibold">{formatINR(order.gstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between px-3 py-2 text-sm font-bold bg-gray-50">
                <span>GRAND TOTAL</span>
                <span className="text-gray-900">{formatINR(order.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Bank Details */}
        <div className="mt-5 grid grid-cols-2 gap-6 text-xs">
          <div>
            <p className="font-bold text-gray-900 mb-2 uppercase tracking-wide">Terms and Conditions:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Material Payment 100% Advance</li>
              <li>Installation as per Actual</li>
              <li>Subject to Delhi Jurisdiction</li>
            </ol>
            {order.remarks && (
              <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-100">
                <p className="font-medium text-amber-800">Remarks:</p>
                <p className="text-amber-700">{order.remarks}</p>
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900 mb-2 uppercase tracking-wide">Bank Details:</p>
            <div className="text-gray-600 space-y-0.5">
              <p className="font-semibold text-gray-800">ROYALE CLADDINGS</p>
              <p>KOTAK MAHINDRA BANK</p>
              <p>Branch: Saket, New Delhi</p>
              <p>Account No: <span className="font-mono">9873662809</span></p>
              <p>IFSC Code: <span className="font-mono">KKBK0000187</span></p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-300 flex justify-between items-end text-xs text-gray-600">
          <div>
            <p><strong>Place:</strong> New Delhi</p>
            <p className="mt-0.5"><strong>Date:</strong> {dateStr}</p>
          </div>
          <div className="text-right">
            <div className="h-12 mb-1"></div>
            <p className="font-bold text-gray-900">Authorized Signatory</p>
            <p className="text-gray-500">For ROYALE CLADDINGS</p>
          </div>
        </div>
      </div>
    </div>
  );
}
