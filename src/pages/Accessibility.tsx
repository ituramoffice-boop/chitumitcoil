import { ChitumitLogo } from "@/components/ChitumitLogo";
import { PublicFooter } from "@/components/PublicFooter";
import { Link } from "react-router-dom";
import { Shield, Phone, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Accessibility() {
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
            <Shield className="w-8 h-8 text-gold" />
            <h1 className="text-3xl font-black">הצהרת נגישות</h1>
          </div>
          <p className="text-muted-foreground">עודכן לאחרונה: מרץ 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">מחויבות לנגישות</h2>
          <p className="text-muted-foreground leading-relaxed">
            חיתומית (Chitumit) מחויבת להנגיש את האתר והשירותים הדיגיטליים שלה לכלל האוכלוסייה, לרבות אנשים עם מוגבלויות,
            בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, תשנ"ח-1998, ותקנות שוויון זכויות לאנשים עם מוגבלות
            (התאמות נגישות לשירות), תשע"ג-2013.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">התקן</h2>
          <p className="text-muted-foreground leading-relaxed">
            האתר עומד בדרישות תקן ישראלי ת"י 5568 המבוסס על הנחיות WCAG 2.1 ברמת AA,
            בכפוף לשינויים והתאמות שנדרשו לפי החקיקה הישראלית.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">התאמות הנגישות שבוצעו</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>תמיכה מלאה בכיוון RTL (ימין לשמאל) לעברית</li>
            <li>ניווט מלא באמצעות מקלדת בלבד</li>
            <li>קישור "דלג לתוכן הראשי" בתחילת כל עמוד</li>
            <li>תגיות ARIA ותוויות למרכיבים אינטראקטיביים</li>
            <li>ניגודיות צבעים העומדת ביחס 4.5:1 לפחות לטקסט רגיל</li>
            <li>טקסט חלופי (alt) לכל התמונות</li>
            <li>מבנה כותרות היררכי (H1-H6) תקין</li>
            <li>טפסים עם תוויות (labels) מקושרות</li>
            <li>התאמה מלאה למכשירים ניידים (Responsive Design)</li>
            <li>תמיכה בהגדלת טקסט עד 200% ללא אובדן תוכן</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">טכנולוגיות</h2>
          <p className="text-muted-foreground leading-relaxed">
            האתר בנוי באמצעות React, TypeScript ו-Tailwind CSS, ונבדק על דפדפני Chrome, Firefox, Safari ו-Edge
            בגרסאותיהם העדכניות. האתר תומך בקוראי מסך JAWS, NVDA ו-VoiceOver.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">מגבלות ידועות</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>גרפים ותרשימים (Recharts) — מוצגים כתמונות עם תיאור טקסטואלי חלופי</li>
            <li>אנימציות — ניתנות לביטול במערכת ההפעלה דרך הגדרת "הפחת תנועה" (prefers-reduced-motion)</li>
            <li>חתימה דיגיטלית — דורשת אינטראקציה עם Canvas, חלופה טקסטואלית זמינה</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">פנייה בנושא נגישות</h2>
          <p className="text-muted-foreground leading-relaxed">
            אם נתקלתם בבעיית נגישות באתר, נשמח לסייע. ניתן לפנות אלינו:
          </p>
          <div className="glass-card p-6 space-y-3">
            <p className="flex items-center gap-2 text-foreground">
              <Mail className="w-4 h-4 text-gold" />
              <span>דוא"ל: <a href="mailto:accessibility@chitumit.co.il" className="text-gold hover:underline">accessibility@chitumit.co.il</a></span>
            </p>
            <p className="flex items-center gap-2 text-foreground">
              <Phone className="w-4 h-4 text-gold" />
              <span>טלפון: 03-XXX-XXXX</span>
            </p>
            <p className="text-sm text-muted-foreground">
              אנו מתחייבים לטפל בפניות נגישות תוך 5 ימי עסקים.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">רכז נגישות</h2>
          <p className="text-muted-foreground leading-relaxed">
            רכז הנגישות של חיתומית אחראי על יישום הנגישות באתר ועל הטיפול בפניות הציבור בנושא.
            לפרטים נוספים ניתן לפנות אלינו בערוצים המפורטים לעיל.
          </p>
        </section>
      </main>

      <footer className="border-t border-border/30 py-6 px-6 text-center text-sm text-muted-foreground">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
          <Link to="/terms" className="hover:text-gold transition-colors">תנאי שימוש</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-gold transition-colors">מדיניות פרטיות</Link>
          <span>·</span>
          <span className="text-gold">הצהרת נגישות</span>
        </div>
      </footer>
    </div>
  );
}
