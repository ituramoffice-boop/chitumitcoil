import { ChitumitLogo } from "@/components/ChitumitLogo";
import { PublicFooter } from "@/components/PublicFooter";
import { Link } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
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
            <Lock className="w-8 h-8 text-gold" />
            <h1 className="text-3xl font-black">מדיניות פרטיות</h1>
          </div>
          <p className="text-muted-foreground">עודכן לאחרונה: מרץ 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">1. כללי</h2>
          <p className="text-muted-foreground leading-relaxed">
            חיתומית (Chitumit) מכבדת את פרטיות המשתמשים ומחויבת להגנה על המידע האישי שנאסף.
            מדיניות זו מפרטת כיצד אנו אוספים, משתמשים, שומרים ומגנים על המידע שלך,
            בהתאם לחוק הגנת הפרטיות, תשמ"א-1981, ולתקנות הגנת הפרטיות (אבטחת מידע), תשע"ז-2017,
            וכן בהתאמה לעקרונות ה-GDPR.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">2. המידע שאנו אוספים</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">פרטים אישיים:</strong> שם מלא, טלפון, דוא"ל — בעת הרשמה או שימוש במחשבון</li>
            <li><strong className="text-foreground">מידע פיננסי:</strong> סכומי משכנתא, הכנסות, ערכי נכסים — לצורך חישובים והערכות</li>
            <li><strong className="text-foreground">מסמכים:</strong> תלושי שכר, דפי בנק — שמועלים לניתוח AI</li>
            <li><strong className="text-foreground">נתוני שימוש:</strong> פעולות באתר, זמני גלישה, סוג מכשיר ודפדפן</li>
            <li><strong className="text-foreground">הקלטות שיחות:</strong> בעת שימוש בחייגן AI — בהסכמת שני הצדדים</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">3. שימוש במידע</h2>
          <p className="text-muted-foreground leading-relaxed">המידע משמש למטרות הבאות:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>מתן השירותים המבוקשים (חישובים, CRM, ניהול לידים)</li>
            <li>שיפור חוויית המשתמש והתאמה אישית</li>
            <li>ניתוח AI של מסמכים ושיחות</li>
            <li>יצירת קשר בנוגע לשירותים (בכפוף להסכמה שיווקית)</li>
            <li>עמידה בדרישות חוקיות ורגולטוריות</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">4. אבטחת מידע</h2>
          <div className="glass-card p-5 border-gold/20">
            <p className="text-muted-foreground leading-relaxed">
              אנו מיישמים אמצעי אבטחה מתקדמים להגנה על המידע שלך:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-3">
              <li>הצפנת SSL/TLS לכל התקשורת</li>
              <li>אחסון מוצפן בשרתי ענן מאובטחים</li>
              <li>הפרדת הרשאות (Row Level Security) — כל יועץ ניגש רק למידע שלו</li>
              <li>גיבוי אוטומטי יומי</li>
              <li>בקרות גישה מבוססות תפקידים</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">5. שיתוף מידע עם צדדים שלישיים</h2>
          <p className="text-muted-foreground leading-relaxed">
            חיתומית <strong className="text-foreground">אינה מוכרת מידע אישי</strong> לצדדים שלישיים.
            מידע עשוי להיות משותף עם:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>יועץ המשכנתאות שאליו הופנה הליד (בהסכמה)</li>
            <li>ספקי שירות טכנולוגיים (אחסון ענן, AI) — בכפוף להסכמי עיבוד מידע</li>
            <li>רשויות חוק — בהתאם לצו שיפוטי בלבד</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">6. זכויות המשתמש</h2>
          <p className="text-muted-foreground leading-relaxed">בהתאם לחוק הישראלי ולעקרונות ה-GDPR, עומדות לך הזכויות הבאות:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">זכות עיון:</strong> לעיין במידע שנאסף עליך</li>
            <li><strong className="text-foreground">זכות תיקון:</strong> לתקן מידע שגוי או לא מעודכן</li>
            <li><strong className="text-foreground">זכות מחיקה:</strong> לבקש מחיקת המידע שלך</li>
            <li><strong className="text-foreground">זכות התנגדות:</strong> להתנגד לעיבוד לצורכי שיווק</li>
            <li><strong className="text-foreground">זכות ניוד:</strong> לקבל עותק של המידע בפורמט מובנה</li>
          </ul>
          <p className="text-muted-foreground">
            לצורך מימוש זכויותיך, פנה אלינו: <a href="mailto:privacy@chitumit.co.il" className="text-gold hover:underline">privacy@chitumit.co.il</a>
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">7. עוגיות (Cookies)</h2>
          <p className="text-muted-foreground leading-relaxed">
            האתר משתמש בעוגיות הכרחיות לתפעול (אימות, העדפות שפה).
            אנו לא משתמשים בעוגיות מעקב של צדדים שלישיים ללא הסכמה מפורשת.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">8. שמירת מידע</h2>
          <p className="text-muted-foreground leading-relaxed">
            מידע אישי נשמר כל עוד החשבון פעיל, ועד 7 שנים לאחר סגירתו בהתאם לדרישות רגולטוריות.
            מסמכים פיננסיים נשמרים בהצפנה ונמחקים אוטומטית לאחר תום התקופה.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">9. שינויים במדיניות</h2>
          <p className="text-muted-foreground leading-relaxed">
            חיתומית רשאית לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו באתר ויישלחו בדוא"ל למשתמשים רשומים.
            המשך השימוש באתר לאחר עדכון מהווה הסכמה למדיניות המעודכנת.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gold">10. יצירת קשר</h2>
          <p className="text-muted-foreground leading-relaxed">
            לשאלות בנוגע לפרטיות: <a href="mailto:privacy@chitumit.co.il" className="text-gold hover:underline">privacy@chitumit.co.il</a>
          </p>
        </section>
      </main>

      <footer className="border-t border-border/30 py-6 px-6 text-center text-sm text-muted-foreground">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
          <Link to="/terms" className="hover:text-gold transition-colors">תנאי שימוש</Link>
          <span>·</span>
          <span className="text-gold">מדיניות פרטיות</span>
          <span>·</span>
          <Link to="/accessibility" className="hover:text-gold transition-colors">הצהרת נגישות</Link>
        </div>
      </footer>
    </div>
  );
}
