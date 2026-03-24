/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as newLeadNotification } from './new-lead-notification.tsx'
import { template as calculatorReport } from './calculator-report.tsx'
import { template as selfCheckReport } from './self-check-report.tsx'
import { template as insuranceQuote } from './insurance-quote.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'new-lead-notification': newLeadNotification,
  'calculator-report': calculatorReport,
  'self-check-report': selfCheckReport,
  'insurance-quote': insuranceQuote,
}
