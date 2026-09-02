import React from "react";
import fs from "fs";
import path from "path";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

// Node-side absolute path — a browser-relative URL will not resolve here.
const LOGO_PATH = path.join(process.cwd(), "public", "branding", "logo.png");
const LOGO_EXISTS = fs.existsSync(LOGO_PATH);

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, borderBottomWidth: 2, borderBottomColor: "#0f4c3a", paddingBottom: 12 },
  logo: { width: 110, marginBottom: 6 },
  companyName: { fontSize: 14, fontWeight: 700, color: "#0f4c3a" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#0f4c3a" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  table: { marginTop: 16, marginBottom: 16 },
  tableHeader: { flexDirection: "row", backgroundColor: "#0f4c3a", color: "#fff", padding: 6, fontWeight: 700 },
  tableRow: { flexDirection: "row", padding: 6, borderBottomWidth: 1, borderBottomColor: "#eee" },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  totalsBlock: { alignSelf: "flex-end", width: 220, marginTop: 8 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  grandTotal: { fontWeight: 700, fontSize: 12, borderTopWidth: 1, borderTopColor: "#0f4c3a", paddingTop: 4, marginTop: 4 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: "#888", textAlign: "center", borderTopWidth: 1, borderTopColor: "#ddd", paddingTop: 6 },
});

export interface InvoicePdfData {
  invoiceNumber: string;
  bookingRef: string;
  clientName: string;
  clientEmail?: string | null;
  issueDate: string;
  dueDate?: string | null;
  currency: string;
  lineItems: { description: string; quantity: number; unitPrice: string; lineTotal: string }[];
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  amountPaid: string;
  balanceDue: string;
  bankDetails?: string;
}

function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            {LOGO_EXISTS ? <Image style={styles.logo} src={LOGO_PATH} /> : null}
            <Text style={styles.companyName}>Kwai PM Kwai Travel and Tours Limited</Text>
            <Text>Dar es Salaam, Tanzania</Text>
            <Text>booking@kwaipmkwaitravelandtours.com</Text>
          </View>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text>No: {data.invoiceNumber}</Text>
            <Text>Booking: {data.bookingRef}</Text>
            <Text>Date: {data.issueDate}</Text>
            {data.dueDate ? <Text>Due: {data.dueDate}</Text> : null}
          </View>
        </View>

        <Text style={{ marginBottom: 12 }}>
          Bill to: {data.clientName}{data.clientEmail ? `  (${data.clientEmail})` : ""}
        </Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {data.lineItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{data.currency} {item.unitPrice}</Text>
              <Text style={styles.colTotal}>{data.currency} {item.lineTotal}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text><Text>{data.currency} {data.subtotal}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Discount</Text><Text>-{data.currency} {data.discountAmount}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Tax</Text><Text>{data.currency} {data.taxAmount}</Text>
          </View>
          <View style={[styles.totalsRow, styles.grandTotal]}>
            <Text>Total</Text><Text>{data.currency} {data.totalAmount}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Paid</Text><Text>{data.currency} {data.amountPaid}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Balance Due</Text><Text>{data.currency} {data.balanceDue}</Text>
          </View>
        </View>

        {data.bankDetails ? (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontWeight: 700, marginBottom: 4 }}>Payment Details</Text>
            <Text>{data.bankDetails}</Text>
          </View>
        ) : null}

        <Text style={styles.footer} fixed>
          Kwai PM Kwai Travel and Tours Limited | Thank you for booking with us.
        </Text>
      </Page>
    </Document>
  );
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}
