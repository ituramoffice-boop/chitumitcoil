/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'

const SITE_NAME = 'חיתומית'

interface MagicLinkEmailProps { siteName: string; confirmationUrl: string; token?: string }

export const MagicLinkEmail = ({ siteName, confirmationUrl, token }: MagicLinkEmailProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>{token ? `קוד הכניסה שלך: ${token}` : `קישור כניסה ל${SITE_NAME}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Heading style={h1}>חיתומית</Heading></Section>
        <Text style={greeting}>שלום,</Text>
        {token ? (
          <>
            <Text style={text}>השתמש בקוד הבא כדי להתחבר ל{SITE_NAME}:</Text>
            <Text style={codeStyle}>{token}</Text>
            <Text style={textSmall}>או לחלופין, לחץ על הכפתור הבא:</Text>
          </>
        ) : (
          <Text style={text}>לחץ על הכפתור הבא כדי להתחבר ל{SITE_NAME}. הקישור תקף לזמן מוגבל.</Text>
        )}
        <Section style={btnWrap}><Button style={button} href={confirmationUrl}>התחבר עכשיו</Button></Section>
        <Hr style={hr} />
        <Text style={footer}>אם לא ביקשת קישור כניסה, ניתן להתעלם מהודעה זו.</Text>
        <Text style={brandFooter}>חיתומית — האישור בדרך, תהיה מאושר.</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Heebo', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#2C2C2C', padding: '28px 20px', borderRadius: '10px 10px 0 0', textAlign: 'center' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#D4AF37', margin: '0', letterSpacing: '1px' }
const greeting = { fontSize: '16px', color: '#1e293b', padding: '24px 25px 0', margin: '0 0 8px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', padding: '0 25px', margin: '0 0 20px' }
const btnWrap = { textAlign: 'center' as const, padding: '0 25px', margin: '0 0 24px' }
const button = { backgroundColor: '#D4AF37', color: '#1e1e1e', fontSize: '14px', fontWeight: '600' as const, borderRadius: '10px', padding: '12px 28px', textDecoration: 'none' }
const hr = { borderColor: '#e2e8f0', margin: '0 25px' }
const footer = { fontSize: '12px', color: '#999999', padding: '16px 25px', margin: '0' }
const brandFooter = { fontSize: '11px', color: '#D4AF37', padding: '8px 25px 20px', margin: '0', textAlign: 'center' as const, fontWeight: '500' as const }
