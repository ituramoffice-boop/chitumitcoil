import { ChitumitLogo } from "@/components/ChitumitLogo";
import { PublicFooter } from "@/components/PublicFooter";
import { Link } from "react-router-dom";
import { FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <nav className="border-b border-border/30 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ChitumitLogo size={32} />
            <span className="font-bold">חיתומית</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowRight className="w-4 h-4 ml-1" /> חזרה לדף הבית
            </Button>
          </Link>
        </div>
      </nav>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-gold" />
            <h1 className="text-3xl font-black">תנאי שימוש</h1>
          </div>
          <p className="text-muted-foreground">עודכן לאחרונה: מרץ 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">1. כללי</h2>
          <p className="text-muted-foreground leading-relaxed">
            ברוכים הבאים לאתר חיתומית (Chitumit) ("האתר"). השימוש באתר ובשירותים המוצעים בו כפוף לתנאי שימוש אלה.
            בעצם השימוש באתר, אתה מסכים לתנאים אלה במלואם. אם אינך מסכים לתנאים, אנא הימנע משימוש באתר.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">2. השירותים</h2>
          <p className="text-muted-foreground leading-relaxed">
            חיתומית מספקת פלטפורמה מבוססת בינה מלאכותית לניהול תהליכי ייעוץ משכנתאות, הכוללת, בין היתר: מחשבוני משכנתא,
            מערכת CRM, חתימה דיגיטלית, סורק מסמכים, וחייגן AI. השירותים ניתנים "כמות שהם" (AS IS) ו"כפי שזמינים" (AS AVAILABLE).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">3. מחשבונים וכלי חישוב</h2>
          <div className="glass-card p-5 border-gold/20">
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-warning">⚠️ אזהרה חשובה:</strong> המחשבונים וכלי החישוב באתר מספקים
              <strong className="text-foreground"> הערכות בלבד</strong> ואינם מהווים הצעה מחייבת, ייעוץ פיננסי,
              או חוות דעת שמאית. התוצאות עשויות להשתנות בהתאם לתנאי השוק, למדיניות הבנק ולפרמטרים נוספים.
              לפני קבלת החלטה פיננסית, יש להתייעץ עם יועץ משכנתאות מורשה.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">4. בינה מלאכותית (AI)</h2>
          <p className="text-muted-foreground leading-relaxed">
            חלק מהשירותים באתר מופעלים באמצעות בינה מלאכותית. תוצאות ה-AI, לרבות סיכומי שיחות, ניתוח מסמכים,
            ודירוגי סיכון, הן <strong className="text-foreground">אינדיקטיביות בלבד</strong> ואינן מחליפות שיקול דעת מקצועי.
            חיתומית אינה אחראית לנזק שעלול להיגרם מהסתמכות על תוצאות AI.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">5. רישום וחשבון משתמש</h2>
          <p className="text-muted-foreground leading-relaxed">
            בעת ההרשמה לשירות, עליך לספק מידע מדויק ומעודכן. אתה אחראי לשמירה על סודיות פרטי הגישה שלך
            ולכל פעילות המתבצעת בחשבונך. יש להודיע לנו מיד על כל שימוש בלתי מורשה.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">6. תוכניות מנוי ותשלום</h2>
          <p className="text-muted-foreground leading-relaxed">
            חיתומית מציעה תוכניות מנוי שונות (Free, Pro, Enterprise). מנוי חינמי מוגבל ל-10 לידים.
            שדרוג לתוכנית בתשלום מאפשר יכולות נוספות. פרטי התמחור המלאים זמינים בדף התמחור באתר.
            חיתומית שומרת לעצמה את הזכות לשנות את המחירים בהודעה מראש של 30 יום.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">7. קניין רוחני</h2>
          <p className="text-muted-foreground leading-relaxed">
            כל התוכן באתר, לרבות עיצוב, לוגו, טקסטים, קוד, ואלגוריתמים, הנם קניינה הרוחני של חיתומית
            ומוגנים בחוקי זכויות יוצרים. אין להעתיק, לשכפל, להפיץ או לעשות שימוש מסחרי בתוכן ללא אישור בכתב.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">8. הגבלת אחריות</h2>
          <p className="text-muted-foreground leading-relaxed">
            חיתומית לא תהיה אחראית לנזקים ישירים, עקיפים, מיוחדים, או תוצאתיים הנובעים מהשימוש באתר או מאי-יכולת
            להשתמש בו. האחריות הכוללת של חיתומית מוגבלת לסכום ששולם על ידי המשתמש ב-12 החודשים האחרונים.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">9. דין וסמכות שיפוט</h2>
          <p className="text-muted-foreground leading-relaxed">
            על תנאי שימוש אלה יחולו דיני מדינת ישראל בלבד. סמכות השיפוט הבלעדית תהיה נתונה לבתי המשפט המוסמכים
            בתל אביב-יפו.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">10. יצירת קשר</h2>
          <p className="text-muted-foreground leading-relaxed">
            לשאלות בנוגע לתנאי השימוש, ניתן לפנות אלינו בכתובת: <a href="mailto:legal@chitumit.co.il" className="text-gold hover:underline">legal@chitumit.co.il</a>
          </p>
        </section>
      </main>

      <PublicFooter activePage="terms" />
    </div>
  );
}
