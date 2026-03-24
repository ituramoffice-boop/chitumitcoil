import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "חיתומית"

interface EliteInvitationProps {
  recipientName?: string
  firmName?: string
}

const EliteInvitationEmail = ({ recipientName, firmName }: EliteInvitationProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>הזמנה אישית: תפסיקו לנחש, תתחילו לאשר.</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Gold accent line */}
        <div style={goldBar} />

        <Section style={headerSection}>
          <Text style={eyebrow}>הזמנה אישית</Text>
          <Heading style={h1}>
            תפסיקו לנחש.{'\n'}תתחילו לאשר.
          </Heading>
        </Section>

        <Hr style={divider} />

        <Section style={bodySection}>
          <Text style={greeting}>
            {recipientName ? `${recipientName} שלום,` : 'שלום,'}
          </Text>

          <Text style={bodyText}>
            אנו פונים אליך באופן אישי כי{firmName ? ` ${firmName}` : ' המשרד שלך'} עומד בקריטריונים שלנו
            ליועצי משכנתאות מובילים.
          </Text>

          <Text style={bodyText}>
            <strong>חיתומית</strong> היא מערכת AI חיתומית שמשנה את הכללים:
          </Text>

          <Text style={bulletItem}>✦ ניתוח BDI ועו״ש אוטומטי תוך 60 שניות</Text>
          <Text style={bulletItem}>✦ נרטיב בנקאי שנכתב על ידי AI — מותאם לכל בנק</Text>
          <Text style={bulletItem}>✦ ציון חיתומית 0-100 שפותח דלתות</Text>
          <Text style={bulletItem}>✦ שוק לידים פרימיום עם תיקים מוכנים להגשה</Text>

          <Text style={highlightBox}>
            ״הבנק לא אומר לא לחיתומית.״
          </Text>

          <Section style={ctaSection}>
            <Button
              href="https://chitumitcoil.lovable.app/join-the-elite"
              style={ctaButton}
            >
              אני רוצה להוביל →
            </Button>
          </Section>

          <Text style={footnote}>
            המקומות מוגבלים. ההזמנה תקפה ל-7 ימים.
          </Text>
        </Section>

        <Hr style={divider} />

        <Section style={footer}>
          <Text style={footerText}>{SITE_NAME} — תהיה מאושר.</Text>
          <Text style={footerMuted}>
            © {new Date().getFullYear()} Chitumit. כל הזכויות שמורות.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: EliteInvitationEmail,
  subject: 'הזמנה אישית: תפסיקו לנחש, תתחילו לאשר.',
  displayName: 'הזמנה לאליטה',
  previewData: { recipientName: 'דני כהן', firmName: 'כהן ייעוץ פיננסי' },
} satisfies TemplateEntry

/* ── Styles ── */
const main = { backgroundColor: '#ffffff', fontFamily: "'Heebo', Arial, sans-serif" }
const container = { maxWidth: '580px', margin: '0 auto', padding: '0' }
const goldBar = { height: '4px', background: 'linear-gradient(90deg, #D4AF37, #B8941F, #D4AF37)', margin: '0' }
const headerSection = { padding: '40px 32px 20px', textAlign: 'center' as const }
const eyebrow = { fontSize: '11px', color: '#D4AF37', letterSpacing: '3px', textTransform: 'uppercase' as const, fontWeight: '700', margin: '0 0 16px' }
const h1 = { fontSize: '28px', fontWeight: '900', color: '#1a1a2e', lineHeight: '1.3', margin: '0', whiteSpace: 'pre-line' as const }
const divider = { borderColor: '#e8e0d0', margin: '0 32px' }
const bodySection = { padding: '28px 32px' }
const greeting = { fontSize: '16px', color: '#333', margin: '0 0 16px', fontWeight: '600' }
const bodyText = { fontSize: '15px', color: '#444', lineHeight: '1.7', margin: '0 0 14px' }
const bulletItem = { fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '0 0 8px', paddingRight: '8px' }
const highlightBox = { fontSize: '18px', fontWeight: '800', color: '#1a1a2e', textAlign: 'center' as const, padding: '20px', margin: '24px 0', backgroundColor: '#faf8f2', borderRadius: '8px', border: '1px solid #e8dcc8' }
const ctaSection = { textAlign: 'center' as const, margin: '28px 0' }
const ctaButton = { backgroundColor: '#1a1a2e', color: '#D4AF37', padding: '16px 40px', borderRadius: '8px', fontSize: '16px', fontWeight: '700', textDecoration: 'none', display: 'inline-block' }
const footnote = { fontSize: '12px', color: '#999', textAlign: 'center' as const, margin: '20px 0 0' }
const footer = { padding: '24px 32px', textAlign: 'center' as const, backgroundColor: '#1a1a2e' }
const footerText = { fontSize: '13px', color: '#D4AF37', fontWeight: '600', margin: '0 0 8px' }
const footerMuted = { fontSize: '11px', color: '#666', margin: '0' }
