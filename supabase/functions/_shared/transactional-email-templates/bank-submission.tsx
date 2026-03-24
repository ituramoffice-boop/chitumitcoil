/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "חיתומית"

interface BankSubmissionProps {
  consultantName?: string
  leadCount?: number
  totalVolume?: string
  downloadUrl?: string
  generatedDate?: string
}

const BankSubmissionEmail = ({
  consultantName,
  leadCount,
  totalVolume,
  downloadUrl,
  generatedDate,
}: BankSubmissionProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>קובץ הגשה מרכזי — {leadCount || 0} תיקים להגשה | {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={headerSection}>
          <Heading style={logo}>{SITE_NAME}</Heading>
          <Text style={headerSubtitle}>קובץ הגשה מרכזי לבנק</Text>
        </Section>

        <Hr style={divider} />

        <Text style={greeting}>שלום,</Text>

        <Text style={text}>
          {consultantName ? `היועץ ${consultantName}` : 'יועץ משכנתא'} שלח לכם קובץ הגשה מרכזי הכולל {leadCount || 0} תיקי לקוחות
          לבדיקה ואישור.
        </Text>

        {/* Stats */}
        <Section style={statsContainer}>
          <table style={statsTable}>
            <tbody>
              <tr>
                <td style={statCell}>
                  <Text style={statValue}>{leadCount || 0}</Text>
                  <Text style={statLabel}>תיקים</Text>
                </td>
                <td style={statCell}>
                  <Text style={statValue}>{totalVolume || '0'}</Text>
                  <Text style={statLabel}>נפח הלוואות (₪)</Text>
                </td>
                <td style={statCell}>
                  <Text style={statValue}>{generatedDate || '-'}</Text>
                  <Text style={statLabel}>תאריך הפקה</Text>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        {downloadUrl && (
          <Section style={ctaSection}>
            <Button style={ctaButton} href={downloadUrl}>
              הורד קובץ הגשה (PDF)
            </Button>
            <Text style={ctaNote}>הקישור תקף ל-7 ימים</Text>
          </Section>
        )}

        <Hr style={divider} />

        <Text style={footer}>
          מייל זה נשלח באמצעות מערכת {SITE_NAME} — פלטפורמת ניהול משכנתאות חכמה.
        </Text>
        <Text style={footer}>
          לבירורים ניתן להשיב על מייל זה או ליצור קשר עם היועץ ישירות.
        </Text>
        <Text style={brandFooter}>חיתומית — האישור בדרך, תהיה מאושר.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BankSubmissionEmail,
  subject: (data: Record<string, any>) =>
    `קובץ הגשה מרכזי — ${data.leadCount || 0} תיקים | ${SITE_NAME}`,
  displayName: 'Bank submission file',
  previewData: {
    consultantName: 'ישראל ישראלי',
    leadCount: 5,
    totalVolume: '3,500,000',
    downloadUrl: 'https://example.com/download',
    generatedDate: '2026-03-24',
  },
} satisfies TemplateEntry

// Styles
const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '580px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, padding: '20px 0 10px' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: '#D4AF37', margin: '0 0 5px' }
const headerSubtitle = { fontSize: '14px', color: '#666666', margin: '0' }
const divider = { borderColor: '#E5E7EB', margin: '20px 0' }
const greeting = { fontSize: '16px', color: '#111827', fontWeight: 'bold' as const, margin: '0 0 15px' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 20px' }
const statsContainer = { margin: '0 0 25px' }
const statsTable = { width: '100%', borderCollapse: 'collapse' as const }
const statCell = {
  textAlign: 'center' as const,
  padding: '15px 10px',
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
}
const statValue = { fontSize: '20px', fontWeight: 'bold' as const, color: '#111827', margin: '0 0 4px' }
const statLabel = { fontSize: '11px', color: '#6B7280', margin: '0' }
const ctaSection = { textAlign: 'center' as const, margin: '25px 0' }
const ctaButton = {
  backgroundColor: '#D4AF37',
  color: '#ffffff',
  padding: '14px 30px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
}
const ctaNote = { fontSize: '11px', color: '#9CA3AF', margin: '10px 0 0' }
const footer = { fontSize: '12px', color: '#9CA3AF', margin: '0 0 5px', lineHeight: '1.5' }
const brandFooter = { fontSize: '11px', color: '#D4AF37', padding: '8px 0', margin: '0', textAlign: 'center' as const, fontWeight: '500' as const }
