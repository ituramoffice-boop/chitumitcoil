/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "חיתומית"

interface NewLeadNotificationProps {
  consultantName?: string
  leadName?: string
  leadPhone?: string
  leadScore?: number
  calcType?: string
  calcSummary?: string
}

const NewLeadNotificationEmail = ({
  consultantName,
  leadName,
  leadPhone,
  leadScore,
  calcType,
  calcSummary,
}: NewLeadNotificationProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>🔥 ליד חדש: {leadName || 'לקוח חדש'} — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>🔥 ליד חם חדש</Heading>
        </Section>

        <Text style={greeting}>
          שלום {consultantName || 'יועץ'},
        </Text>

        <Text style={text}>
          ליד חדש נכנס למערכת דרך הקישור האישי שלך:
        </Text>

        <Section style={detailsBox}>
          <Text style={detailRow}>📋 <strong>שם:</strong> {leadName || 'לא צוין'}</Text>
          <Text style={detailRow}>📞 <strong>טלפון:</strong> {leadPhone || 'לא צוין'}</Text>
          <Text style={detailRow}>📊 <strong>ציון ליד:</strong> {leadScore ?? 0}</Text>
          <Text style={detailRow}>🏠 <strong>מקור:</strong> {calcType || 'מחשבון'}</Text>
          {calcSummary && (
            <Text style={detailRow}>📝 <strong>פרטים:</strong> {calcSummary}</Text>
          )}
        </Section>

        <Section style={{ textAlign: 'center' as const, marginTop: '24px' }}>
          <Button style={button} href="https://chitumit.co.il/dashboard/clients">
            צפה בדשבורד
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          בהצלחה,<br />
          {SITE_NAME}
        </Text>
        <Text style={brandFooter}>חיתומית — האישור בדרך, תהיה מאושר.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewLeadNotificationEmail,
  subject: (data: Record<string, any>) =>
    `🔥 ליד חדש: ${data.leadName || 'לקוח חדש'} — ${SITE_NAME}`,
  displayName: 'התראת ליד חדש',
  previewData: {
    consultantName: 'ישראל כהן',
    leadName: 'דוד לוי',
    leadPhone: '050-1234567',
    leadScore: 85,
    calcType: 'מחשבון משכנתא',
    calcSummary: 'משכנתא ₪1,200,000 • נכס ₪2,000,000',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Heebo', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = {
  backgroundColor: '#2C2C2C',
  padding: '24px 20px',
  borderRadius: '10px 10px 0 0',
  textAlign: 'center' as const,
}
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#D4AF37', margin: '0', letterSpacing: '1px' }
const greeting = { fontSize: '16px', color: '#000000', lineHeight: '1.6', margin: '20px 0 8px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const detailsBox = {
  backgroundColor: '#FFFFF0',
  border: '1px solid #D4AF3733',
  borderRadius: '8px',
  padding: '16px',
}
const detailRow = { fontSize: '14px', color: '#1e293b', lineHeight: '1.8', margin: '0' }
const button = {
  backgroundColor: '#D4AF37',
  color: '#1e1e1e',
  padding: '12px 28px',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
}
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', lineHeight: '1.6' }
const brandFooter = { fontSize: '11px', color: '#D4AF37', padding: '8px 0', margin: '0', textAlign: 'center' as const, fontWeight: '500' as const }
