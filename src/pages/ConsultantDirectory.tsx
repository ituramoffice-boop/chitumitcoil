import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import StarField from "@/components/StarField";
import {
  Search, MapPin, Star, Shield, Phone, ExternalLink, Filter, Users,
  Award, CheckCircle2, Crown
} from "lucide-react";
import { Link } from "react-router-dom";

interface ConsultantProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  business_type: string;
  plan: string;
  lead_count: number;
  whatsapp_phone: string | null;
}

interface ConsultantWithReviews extends ConsultantProfile {
  avg_rating: number;
  review_count: number;
}

const CITIES = ["תל אביב", "ירושלים", "חיפה", "באר שבע", "רעננה", "הרצליה", "פתח תקווה", "ראשון לציון"];
const SPECIALIZATIONS = ["משכנתא ראשונה", "מחזור משכנתא", "משכנתא להשקעה", "דירה מקבלן", "בנייה עצמית"];

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>
      {children}
    </motion.div>
  );
}

export default function ConsultantDirectory() {
  const [consultants, setConsultants] = useState<ConsultantWithReviews[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    fetchConsultants();
  }, []);

  const fetchConsultants = async () => {
    setLoading(true);
    // Fetch profiles that are consultants (have consultant role)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("plan", ["free", "pro", "enterprise"]);

    if (profiles) {
    // Fetch reviews
      const { data: reviews } = await supabase
        .from("consultant_reviews" as any)
        .select("consultant_id, rating");

      const reviewMap: Record<string, { total: number; count: number }> = {};
      (reviews as any[])?.forEach((r: any) => {
        if (!reviewMap[r.consultant_id]) reviewMap[r.consultant_id] = { total: 0, count: 0 };
        reviewMap[r.consultant_id].total += r.rating;
        reviewMap[r.consultant_id].count += 1;
      });

      const enriched: ConsultantWithReviews[] = profiles.map((p) => ({
        ...p,
        avg_rating: reviewMap[p.user_id]
          ? Math.round((reviewMap[p.user_id].total / reviewMap[p.user_id].count) * 10) / 10
          : 0,
        review_count: reviewMap[p.user_id]?.count || 0,
      }));

      setConsultants(enriched);
    }
    setLoading(false);
  };

  const filtered = consultants.filter((c) => {
    if (search && !c.full_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (minRating > 0 && c.avg_rating < minRating) return false;
    return true;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.round(rating) ? "text-gold fill-gold" : "text-slate-600"}`}
      />
    ));
  };

  return (
    <div className="relative min-h-screen bg-[#060a18] text-slate-100 overflow-x-hidden" dir="rtl">
      <StarField />

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-12 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium">
              <Award className="w-4 h-4" /> מדריך יועצי משכנתאות מאומתים
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-black"
          >
            מצא את <span className="text-gold">היועץ המושלם</span> עבורך
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-slate-400 max-w-xl mx-auto"
          >
            כל היועצים במדריך אומתו על ידי SmartMortgage AI. הביקורות נכתבות רק על ידי לקוחות אמיתיים שסיימו תהליך.
          </motion.p>
        </div>
      </section>

      {/* Filters */}
      <section className="relative z-10 px-4 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="חפש לפי שם יועץ..."
                className="pr-10 bg-slate-900/50 border-slate-700 text-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={minRating === 0 ? "default" : "outline"}
                size="sm"
                onClick={() => setMinRating(0)}
                className={minRating === 0 ? "bg-gold text-slate-900" : "border-slate-700 text-slate-400"}
              >
                הכל
              </Button>
              {[3, 4, 5].map((r) => (
                <Button
                  key={r}
                  variant={minRating === r ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMinRating(r)}
                  className={minRating === r ? "bg-gold text-slate-900" : "border-slate-700 text-slate-400"}
                >
                  {r}+ <Star className="w-3 h-3 mr-1" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="relative z-10 px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-slate-800/50 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>לא נמצאו יועצים מתאימים</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c, i) => (
                <Reveal key={c.id} delay={i * 0.05}>
                  <Link to={`/consultant/${c.user_id}`}>
                    <div className="group p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm hover:border-gold/30 transition-all duration-300 hover:-translate-y-1 space-y-4 cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {c.logo_url ? (
                            <img src={c.logo_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-gold/20" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center text-white font-bold text-lg">
                              {c.full_name?.[0] || "?"}
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-slate-100 group-hover:text-gold transition-colors">{c.full_name || "יועץ"}</h3>
                            <p className="text-xs text-slate-500">יועץ משכנתאות</p>
                          </div>
                        </div>
                        {(c.plan === "pro" || c.plan === "enterprise") && (
                          <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px]">
                            <CheckCircle2 className="w-3 h-3 ml-1" />
                            מאומת
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {renderStars(c.avg_rating)}
                        <span className="text-xs text-slate-500 mr-2">
                          {c.avg_rating > 0 ? `${c.avg_rating}` : "—"} ({c.review_count} ביקורות)
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {c.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {c.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {c.lead_count} לקוחות
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-700/50">
                        <span className="text-xs text-primary group-hover:text-gold transition-colors flex items-center gap-1">
                          צפה בפרופיל <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="relative z-10 border-t border-gold/10 py-8 px-4 text-center text-sm text-slate-600">
        <p>© 2026 SmartMortgage AI · מדריך יועצי משכנתאות</p>
      </footer>
    </div>
  );
}
