import React from "react";
import fs from "fs";
import path from "path";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

/**
 * @react-pdf/renderer runs in Node, so a browser-relative path like "/branding/logo.png"
 * will NOT resolve. The logo must be an absolute filesystem path. If no logo file is
 * installed yet, we skip the image entirely rather than throwing.
 */
const LOGO_PATH = path.join(process.cwd(), "public", "branding", "logo.png");
const LOGO_EXISTS = fs.existsSync(LOGO_PATH);

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottomWidth: 2, borderBottomColor: "#0f4c3a", paddingBottom: 12 },
  logo: { width: 120 },
  companyBlock: { alignItems: "flex-end" },
  companyName: { fontSize: 14, fontWeight: 700, color: "#0f4c3a" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4, color: "#0f4c3a" },
  subtitle: { fontSize: 10, color: "#555", marginBottom: 16 },
  dayBlock: { marginBottom: 14, breakInside: "avoid" },
  dayTitle: { fontSize: 12, fontWeight: 700, backgroundColor: "#0f4c3a", color: "#fff", padding: 6, marginBottom: 6 },
  activityRow: { flexDirection: "row", marginBottom: 4 },
  activityTime: { width: 60, fontWeight: 700 },
  activityName: { flex: 1 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: "#888", textAlign: "center", borderTopWidth: 1, borderTopColor: "#ddd", paddingTop: 6 },
});

export interface ItineraryPdfData {
  bookingRef: string;
  clientName: string;
  title: string;
  summary?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  numTravelers: number;
  days: {
    dayNumber: number;
    date?: string | null;
    title: string;
    description?: string | null;
    activities: { startTime?: string | null; name: string; description?: string | null }[];
  }[];
}

function ItineraryDocument({ data }: { data: ItineraryPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          {LOGO_EXISTS ? <Image style={styles.logo} src={LOGO_PATH} /> : <View style={styles.logo} />}
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>Kwai PM Kwai Travel and Tours Limited</Text>
            <Text>Dar es Salaam, Tanzania</Text>
            <Text>booking@kwaipmkwaitravelandtours.com</Text>
          </View>
        </View>

        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.subtitle}>
          Booking Ref: {data.bookingRef}  |  Prepared for: {data.clientName}  |  Travelers: {data.numTravelers}
          {data.startDate ? `  |  ${data.startDate} – ${data.endDate ?? ""}` : ""}
        </Text>
        {data.summary ? <Text style={{ marginBottom: 16 }}>{data.summary}</Text> : null}

        {data.days.map((day) => (
          <View key={day.dayNumber} style={styles.dayBlock}>
            <Text style={styles.dayTitle}>
              Day {day.dayNumber}{day.date ? ` — ${day.date}` : ""}: {day.title}
            </Text>
            {day.description ? <Text style={{ marginBottom: 6 }}>{day.description}</Text> : null}
            {day.activities.map((a, i) => (
              <View key={i} style={styles.activityRow}>
                <Text style={styles.activityTime}>{a.startTime ?? ""}</Text>
                <Text style={styles.activityName}>
                  {a.name}
                  {a.description ? ` — ${a.description}` : ""}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.footer} fixed>
          Kwai PM Kwai Travel and Tours Limited | This itinerary is subject to availability until confirmed with a deposit.
        </Text>
      </Page>
    </Document>
  );
}

export async function generateItineraryPdf(data: ItineraryPdfData): Promise<Buffer> {
  return renderToBuffer(<ItineraryDocument data={data} />);
}
