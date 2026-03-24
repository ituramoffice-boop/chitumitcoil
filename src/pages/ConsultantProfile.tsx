import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import StarField from "@/components/StarField";
import { toast } from "sonner";
import {
  Star, Phone, Mail, ArrowRight, CheckCircle2, Calculator,
  MessageCircle, Crown, Shield, Users
} from "lucide-react";

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  is_verified: boolean;
}

export default function ConsultantProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    const [profileRes, reviewsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId!).single(),
      supabase.from("consultant_reviews").select("*").eq("consultant_id", userId!).order("created_at", { ascending: false }),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (reviewsRes.data) setReviews(reviewsRes.data as unknown as Review[]);
    setLoading(false);
  };

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const renderStars = (rating: number, size = "w-5 h-5") =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`${size} ${i < Math.round(rating) ? "text-gold fill-gold" : "text-slate-600"}`} />
    ));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a18] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#060a18] flex items-center justify-center text-slate-400" dir="rtl">
        <div className="text-center space-y-4">
          <p className="text-xl">יועץ לא נמצא</p>
          <Link to="/directory"><Button variant="outline">חזרה למדריך</Button></Link>
        </div>
      </div>
    );
  }

  const isPro = profile.plan === "pro" || profile.plan === "enterprise";

  return (
    <div className="relative min-h-screen bg-[#060a18] text-slate-100 overflow-x-hidden" dir="rtl">
      <StarField />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link to="/directory" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-gold mb-8 transition-colors">
          <ArrowRight className="w-4 h-4" /> חזרה למדריך
        </Link>

        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm space-y-6"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="shrink-0">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt="" className="w-24 h-24 rounded-2xl object-cover border-2 border-gold/20" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-gold flex items-center justify-center text-white font-black text-3xl">
                  {profile.full_name?.[0] || "?"}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black">{profile.full_name || "יועץ"}</h1>
                {isPro && (
                  <Badge className="bg-gold/10 text-gold border-gold/20">
                    <CheckCircle2 className="w-3.5 h-3.5 ml-1" /> SmartMortgage Verified
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                {renderStars(avgRating)}
                <span className="text-sm text-slate-400 mr-2">{avgRating} ({reviews.length} ביקורות)</span>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} className="flex items-center gap-1 hover:text-gold transition-colors">
                    <Phone className="w-4 h-4" /> {profile.phone}
                  </a>
                )}
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="flex items-center gap-1 hover:text-gold transition-colors">
                    <Mail className="w-4 h-4" /> {profile.email}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> {profile.lead_count} לקוחות
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {profile.whatsapp_phone && (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => window.open(`https://wa.me/${profile.whatsapp_phone}`, "_blank")}
                >
                  <MessageCircle className="w-4 h-4 ml-1" /> WhatsApp
                </Button>
              )}
              <Link to={`/calculator?ref=${profile.user_id}`}>
                <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 w-full">
                  <Calculator className="w-4 h-4 ml-1" /> מחשבון ממותג
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mt-8 space-y-6"
        >
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-gold" /> ביקורות לקוחות
          </h2>

          {reviews.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-800/30 border border-slate-700/30 text-center text-slate-500">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>עדיין אין ביקורות ליועץ זה</p>
              <p className="text-xs mt-1">ביקורות ניתנות רק על ידי לקוחות שסיימו תהליך באמצעות המערכת</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200">{r.reviewer_name}</span>
                      {r.is_verified && (
                        <Badge variant="outline" className="text-[10px] border-gold/20 text-gold">
                          <CheckCircle2 className="w-2.5 h-2.5 ml-0.5" /> לקוח מאומת
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-slate-600">{new Date(r.created_at).toLocaleDateString("he-IL")}</span>
                  </div>
                  <div className="flex items-center gap-0.5">{renderStars(r.rating, "w-3.5 h-3.5")}</div>
                  {r.comment && <p className="text-sm text-slate-400 leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
