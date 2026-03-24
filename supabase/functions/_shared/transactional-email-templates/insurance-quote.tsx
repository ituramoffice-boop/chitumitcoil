/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button, Row, Column,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "חיתומית"

interface InsuranceQuoteProps {
  leadName?: string
  mortgageAmount?: string
  loanTerm?: string
  age?: string
  isSmoker?: string
  marketPremium?: string
  bestPremium?: string
  monthlySavings?: string
  yearlySavings?: string
  fiveYearSavings?: string
  totalSavings?: string
  riskProfile?: string
  scoreBoost?: string
}

const InsuranceQuoteEmail = ({
  leadName,
  mortgageAmount,
  loanTerm,
  age,
  isSmoker,
  marketPremium,
  bestPremium,
  monthlySavings,
  yearlySavings,
  fiveYearSavings,
  totalSavings,
  riskProfile,
  scoreBoost,
}: InsuranceQuoteProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>הצעת ביטוח משכנתא — חיסכון של {totalSavings || '₪0'} — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>🛡️ הצעת ביטוח המשכנתא שלך</Heading>
          <Text style={headerSub}>ניתוח אישי מ{SITE_NAME}</Text>
        </Section>

        <Text style={greeting}>
          שלום {leadName || 'לקוח/ה יקר/ה'},
        </Text>

        <Text style={text}>
          תודה שהשתמשת במערכת השוואת ביטוח המשכנתא של {SITE_NAME}! 
          להלן סיכום ההצעה שלך:
        </Text>

        {/* Loan details */}
        <Section style={detailsBox}>
          <Text style={sectionTitle}>📋 פרטי ההלוואה</Text>
          <Text style={detailRow}>סכום משכנתא: <strong>{mortgageAmount || '—'}</strong></Text>
          <Text style={detailRow}>תקופה: <strong>{loanTerm || '—'} שנים</strong></Text>
          <Text style={detailRow}>גיל הלווה: <strong>{age || '—'}</strong></Text>
          <Text style={detailRow}>מעשן: <strong>{isSmoker === 'כן' ? 'כן' : 'לא'}</strong></Text>
          <Text style={detailRow}>פרופיל סיכון: <strong>{riskProfile || '—'}</strong></Text>
        </Section>

        {/* Premium comparison */}
        <Section style={comparisonBox}>
          <Text style={sectionTitle}>📊 השוואת פרמיות חודשיות</Text>
          <Section>
            <Row>
              <Column style={compColLeft}>
                <Text style={compLabel}>ממוצע שוק</Text>
                <Text style={compValueStrike}>{marketPremium || '—'}/חודש</Text>
              </Column>
              <Column style={compColRight}>
                <Text style={compLabel}>המחיר הטוב ביותר</Text>
                <Text style={compValueGreen}>{bestPremium || '—'}/חודש</Text>
              </Column>
            </Row>
          </Section>
        </Section>

        {/* Savings */}
        <Section style={savingsBox}>
          <Text style={sectionTitle}>💰 החיסכון שלך</Text>
          <Text style={savingsRow}>חיסכון חודשי: <strong style={{ color: '#059669' }}>{monthlySavings || '—'}</strong></Text>
          <Text style={savingsRow}>חיסכון שנתי: <strong style={{ color: '#059669' }}>{yearlySavings || '—'}</strong></Text>
          <Text style={savingsRow}>חיסכון ב-5 שנים: <strong style={{ color: '#059669' }}>{fiveYearSavings || '—'}</strong></Text>
          <Text style={savingsTotalRow}>חיסכון כולל לאורך המשכנתא: <strong style={{ color: '#059669', fontSize: '18px' }}>{totalSavings || '—'}</strong></Text>
        </Section>

        {/* Score boost */}
        {scoreBoost && (
          <Section style={scoreBox}>
            <Text style={detailRow}>
              ⭐ שיפור ציון {SITE_NAME}: <strong style={{ color: '#0891b2' }}>+{scoreBoost} נקודות</strong>
            </Text>
            <Text style={{ ...detailRow, fontSize: '12px', color: '#64748b' }}>
              חיסכון בביטוח מגדיל את ההכנסה הפנויה שלך ומשפר את תנאי המשכנתא
            </Text>
          </Section>
        )}

        <Text style={text}>
          יועץ ביטוח מוסמך ייצור איתך קשר בהקדם כדי לנעול את ההצעה הטובה ביותר.
        </Text>

        <Section style={{ textAlign: 'center' as const, marginTop: '24px' }}>
          <Button style={button} href="https://chitumit.co.il/self-check">
            בדיקת היתכנות משכנתא מלאה
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          בהצלחה,<br />
          צוות {SITE_NAME}<br />
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            מייל זה נשלח אוטומטית. המידע להערכה בלבד ואינו מהווה ייעוץ פיננסי מקצועי.
          </span>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InsuranceQuoteEmail,
  subject: (data: Record<string, any>) =>
    `🛡️ הצעת ביטוח משכנתא — חיסכון ${data.totalSavings || ''} — ${SITE_NAME}`,
  displayName: 'הצעת ביטוח משכנתא ללקוח',
  previewData: {
    leadName: 'דוד לוי',
    mortgageAmount: '₪1,500,000',
    loanTerm: '25',
    age: '35',
    isSmoker: 'לא',
    marketPremium: '₪87',
    bestPremium: '₪52',
    monthlySavings: '₪35',
    yearlySavings: '₪420',
    fiveYearSavings: '₪2,100',
    totalSavings: '₪10,500',
    riskProfile: 'סיכון נמוך / מודע בריאות',
    scoreBoost: '4',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Heebo', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = {
  background: 'linear-gradient(135deg, #0891b2, #4338ca)',
  padding: '24px 20px',
  borderRadius: '10px 10px 0 0',
  textAlign: 'center' as const,
}
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#ffffff', margin: '0' }
const headerSub = { fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' }
const greeting = { fontSize: '16px', color: '#000000', lineHeight: '1.6', margin: '20px 0 8px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const sectionTitle = { fontSize: '15px', fontWeight: 'bold' as const, color: '#1e293b', margin: '0 0 8px' }
const detailsBox = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #bae6fd',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px',
}
const detailRow = { fontSize: '14px', color: '#1e293b', lineHeight: '1.8', margin: '0' }
const comparisonBox = {
  backgroundColor: '#fafafa',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px',
}
const compColLeft = { width: '50%', textAlign: 'center' as const }
const compColRight = { width: '50%', textAlign: 'center' as const }
const compLabel = { fontSize: '12px', color: '#64748b', margin: '0 0 4px' }
const compValueStrike = { fontSize: '18px', color: '#94a3b8', textDecoration: 'line-through', margin: '0' }
const compValueGreen = { fontSize: '18px', fontWeight: 'bold' as const, color: '#059669', margin: '0' }
const savingsBox = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px',
}
const savingsRow = { fontSize: '14px', color: '#1e293b', lineHeight: '1.8', margin: '0' }
const savingsTotalRow = { fontSize: '15px', color: '#1e293b', lineHeight: '1.8', margin: '8px 0 0', borderTop: '1px solid #bbf7d0', paddingTop: '8px' }
const scoreBox = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #bae6fd',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '16px',
}
const button = {
  backgroundColor: '#0891b2',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
}
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', lineHeight: '1.6' }
