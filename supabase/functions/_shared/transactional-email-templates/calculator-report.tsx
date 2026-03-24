/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "חיתומית"

interface CalculatorReportProps {
  leadName?: string
  calcType?: string
  calcSummary?: string
  leadScore?: number
}

const CalculatorReportEmail = ({
  leadName,
  calcType,
  calcSummary,
  leadScore,
}: CalculatorReportProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>הדוח האישי שלך מוכן — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>✨ הדוח האישי שלך מוכן</Heading>
        </Section>

        <Text style={greeting}>
          שלום {leadName || 'לקוח/ה יקר/ה'},
        </Text>

        <Text style={text}>
          תודה שהשתמשת ב{calcType || 'מחשבון'} של {SITE_NAME}! 
          הנה סיכום הנתונים שהזנת:
        </Text>

        <Section style={detailsBox}>
          <Text style={detailRow}>🏠 <strong>סוג בדיקה:</strong> {calcType || 'מחשבון'}</Text>
          {calcSummary && (
            <Text style={detailRow}>📊 <strong>סיכום:</strong> {calcSummary}</Text>
          )}
          {leadScore != null && leadScore > 0 && (
            <Text style={detailRow}>⭐ <strong>ציון התאמה:</strong> {leadScore}/100</Text>
          )}
        </Section>

        <Text style={text}>
          יועץ משכנתא מוסמך ייצור איתך קשר בהקדם כדי לעזור לך לקבל את התנאים הטובים ביותר.
        </Text>

        <Section style={{ textAlign: 'center' as const, marginTop: '24px' }}>
          <Button style={button} href="https://chitumit.co.il/self-check">
            בדיקת היתכנות מלאה
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          בהצלחה,<br />
          צוות {SITE_NAME}<br />
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            מייל זה נשלח אוטומטית. המידע להערכה בלבד ואינו מהווה ייעוץ פיננסי.
          </span>
        </Text>
        <Text style={brandFooter}>חיתומית — האישור בדרך, תהיה מאושר.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CalculatorReportEmail,
  subject: (data: Record<string, any>) =>
    `📊 הדוח שלך מ${data.calcType || 'מחשבון'} — ${SITE_NAME}`,
  displayName: 'דוח מחשבון ללקוח',
  previewData: {
    leadName: 'דוד לוי',
    calcType: 'מחשבון משכנתא',
    calcSummary: 'משכנתא ₪1,200,000 ל-25 שנה, ריבית 4.5%',
    leadScore: 85,
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
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#D4AF37', margin: '0', letterSpacing: '1px' }
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
