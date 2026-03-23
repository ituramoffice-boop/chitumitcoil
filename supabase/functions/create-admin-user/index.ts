import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Create admin user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: "123@123.com",
    password: "123123",
    email_confirm: true,
    user_metadata: { full_name: "מנהל מערכת" },
  });

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), { status: 400 });
  }

  const userId = authData.user.id;

  // Update role to admin (trigger already created 'client' role)
  await supabase.from("user_roles").update({ role: "admin" }).eq("user_id", userId);

  // Create demo leads with financial/insurance data for different consultants
  // First create a demo consultant
  const { data: consultantData } = await supabase.auth.admin.createUser({
    email: "consultant@demo.com",
    password: "123123",
    email_confirm: true,
    user_metadata: { full_name: "יועץ דמו" },
  });

  if (consultantData?.user) {
    const cId = consultantData.user.id;
    await supabase.from("user_roles").update({ role: "consultant" }).eq("user_id", cId);

    // Insert demo leads
    await supabase.from("leads").insert([
      {
        consultant_id: cId,
        full_name: "דוד כהן",
        phone: "050-1234567",
        email: "david@example.com",
        status: "approved",
        mortgage_amount: 1200000,
        property_value: 2000000,
        monthly_income: 25000,
        notes: "ביטוח חיים קיים, מעוניין בביטוח משכנתא. תיק חזק.",
      },
      {
        consultant_id: cId,
        full_name: "שרה לוי",
        phone: "052-9876543",
        email: "sara@example.com",
        status: "in_progress",
        mortgage_amount: 800000,
        property_value: 1500000,
        monthly_income: 18000,
        notes: "ללא ביטוח חיים, פוטנציאל למכירת ביטוח. הכנסה יציבה.",
      },
      {
        consultant_id: cId,
        full_name: "משה אברהם",
        phone: "054-5551234",
        email: "moshe@example.com",
        status: "new",
        mortgage_amount: 1500000,
        property_value: 2500000,
        monthly_income: 35000,
        notes: "עצמאי, צריך ביטוח אובדן כושר עבודה. הכנסה גבוהה.",
      },
      {
        consultant_id: cId,
        full_name: "רחל ישראלי",
        phone: "053-7778899",
        email: "rachel@example.com",
        status: "submitted",
        mortgage_amount: 600000,
        property_value: 1000000,
        monthly_income: 12000,
        notes: "זוג צעיר, צריכים ביטוח חיים וביטוח דירה.",
      },
      {
        consultant_id: cId,
        full_name: "יוסף מזרחי",
        phone: "058-3334455",
        email: "yosef@example.com",
        status: "contacted",
        mortgage_amount: 950000,
        property_value: 1800000,
        monthly_income: 22000,
        notes: "מחזור משכנתא, יש ביטוח ישן שצריך לעדכן.",
      },
      {
        consultant_id: cId,
        full_name: "נועה גולן",
        phone: "050-6667788",
        email: "noa@example.com",
        status: "approved",
        mortgage_amount: 1100000,
        property_value: 1900000,
        monthly_income: 28000,
        notes: "פוטנציאל גבוה לביטוח משכנתא + ביטוח חיים.",
      },
    ]);
  }

  return new Response(JSON.stringify({ success: true, userId }), { status: 200 });
});
