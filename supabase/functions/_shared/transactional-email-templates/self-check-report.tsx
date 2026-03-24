/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "חיתומית"

interface SelfCheckReportProps {
  leadName?: string
  purpose?: string
  maxLoan?: string
  dti?: string
  ltv?: string
  riskScore?: number
  monthlyPayment?: string
}

const PURPOSE_LABELS: Record<string, string> = {
  new: "הלוואה חדשה",
  topup: "תוספת על הקיים",
  refinance: "מיחזור משכנתא",
  explore: "בדיקה כללית",
}

const SelfCheckReportEmail = ({
  leadName,
  purpose,
  maxLoan,
  dti,
  ltv,
  riskScore,
  monthlyPayment,
}: SelfCheckReportProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>תוצאות בדיקת ההיתכנות שלך — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>🧠 תוצאות בדיקת ההיתכנות שלך</Heading>
        </Section>

        <Text style={greeting}>
          שלום {leadName || 'לקוח/ה יקר/ה'},
        </Text>

        <Text style={text}>
          תודה שהשתמשת בבדיקת ההיתכנות העצמאית של {SITE_NAME}!
          הנה סיכום התוצאות שלך:
        </Text>

        <Section style={detailsBox}>
          <Text style={detailRow}>
            🎯 <strong>מטרה:</strong> {PURPOSE_LABELS[purpose || 'new'] || purpose}
          </Text>
          {maxLoan && (
            <Text style={detailRow}>💰 <strong>סכום הלוואה מרבי:</strong> {maxLoan}</Text>
          )}
          {monthlyPayment && (
            <Text style={detailRow}>📅 <strong>החזר חודשי צפוי:</strong> {monthlyPayment}</Text>
          )}
          {dti && (
            <Text style={detailRow}>📊 <strong>יחס החזר (DTI):</strong> {dti}</Text>
          )}
          {ltv && (
            <Text style={detailRow}>🏠 <strong>אחוז מימון (LTV):</strong> {ltv}</Text>
          )}
          {riskScore != null && (
            <Text style={detailRow}>
              🛡️ <strong>ציון סיכון:</strong> {riskScore}/100
              {riskScore >= 70 ? ' — סיכוי טוב' : riskScore >= 40 ? ' — סביר' : ' — נדרשת בדיקה'}
            </Text>
          )}
        </Section>

        <Text style={text}>
          יועץ משכנתא מוסמך יוכל לבדוק את הנתונים שלך לעומק ולבנות תמהיל אופטימלי.
          רוצה להתקדם? לחץ על הכפתור:
        </Text>

        <Section style={{ textAlign: 'center' as const, marginTop: '24px' }}>
          <Button style={button} href="https://chitumit.co.il/self-check">
            חזרה לאזור האישי
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
  component: SelfCheckReportEmail,
  subject: (data: Record<string, any>) =>
    `🧠 תוצאות בדיקת ההיתכנות — ${PURPOSE_LABELS[data.purpose] || 'חיתומית'}`,
  displayName: 'דוח בדיקת היתכנות עצמאית',
  previewData: {
    leadName: 'דוד לוי',
    purpose: 'new',
    maxLoan: '₪4,840,000',
    dti: '35.2%',
    ltv: '72.7%',
    riskScore: 72,
    monthlyPayment: '₪8,650',
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
