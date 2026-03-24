/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'

const SITE_NAME = 'חיתומית'

interface ReauthenticationEmailProps { token: string }

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>קוד אימות — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Heading style={h1}>🔑 קוד אימות</Heading></Section>
        <Text style={greeting}>שלום,</Text>
        <Text style={text}>השתמש בקוד הבא כדי לאמת את זהותך:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Hr style={hr} />
        <Text style={footer}>הקוד תקף לזמן מוגבל. אם לא ביקשת קוד זה, ניתן להתעלם.</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Heebo', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: 'hsl(234, 89%, 63%)', padding: '24px 20px', borderRadius: '10px 10px 0 0', textAlign: 'center' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#ffffff', margin: '0' }
const greeting = { fontSize: '16px', color: '#1e293b', padding: '24px 25px 0', margin: '0 0 8px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', padding: '0 25px', margin: '0 0 20px' }
const codeStyle = {
  fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: 'bold' as const,
  color: 'hsl(234, 89%, 63%)', textAlign: 'center' as const,
  padding: '16px', margin: '0 25px 24px', backgroundColor: '#f1f5f9', borderRadius: '10px', letterSpacing: '6px',
}
const hr = { borderColor: '#e2e8f0', margin: '0 25px' }
const footer = { fontSize: '12px', color: '#999999', padding: '16px 25px', margin: '0' }
