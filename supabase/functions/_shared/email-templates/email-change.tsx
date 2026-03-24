/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'

const SITE_NAME = 'חיתומית'

interface EmailChangeEmailProps { siteName: string; email: string; newEmail: string; confirmationUrl: string }

export const EmailChangeEmail = ({ siteName, email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>אישור שינוי כתובת מייל — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Heading style={h1}>📧 שינוי כתובת מייל</Heading></Section>
        <Text style={greeting}>שלום,</Text>
        <Text style={text}>
          ביקשת לשנות את כתובת המייל שלך ב{SITE_NAME} מ-<Link href={`mailto:${email}`} style={link}>{email}</Link> ל-<Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Section style={btnWrap}><Button style={button} href={confirmationUrl}>אשר שינוי מייל</Button></Section>
        <Hr style={hr} />
        <Text style={footer}>אם לא ביקשת שינוי זה, אנא אבטח את החשבון שלך מיד.</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Heebo', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: 'hsl(234, 89%, 63%)', padding: '24px 20px', borderRadius: '10px 10px 0 0', textAlign: 'center' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#ffffff', margin: '0' }
const greeting = { fontSize: '16px', color: '#1e293b', padding: '24px 25px 0', margin: '0 0 8px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', padding: '0 25px', margin: '0 0 20px' }
const link = { color: 'hsl(234, 89%, 63%)', textDecoration: 'underline' }
const btnWrap = { textAlign: 'center' as const, padding: '0 25px', margin: '0 0 24px' }
const button = { backgroundColor: 'hsl(234, 89%, 63%)', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '10px', padding: '12px 28px', textDecoration: 'none' }
const hr = { borderColor: '#e2e8f0', margin: '0 25px' }
const footer = { fontSize: '12px', color: '#999999', padding: '16px 25px', margin: '0' }
