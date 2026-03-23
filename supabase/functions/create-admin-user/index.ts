import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Reset admin password
  const { error: pwError } = await supabase.auth.admin.updateUserById(
    "7216126b-7293-488c-9689-917e172ad5ce",
    { password: "123123" }
  );

  // Ensure admin role
  await supabase.from("user_roles").update({ role: "admin" }).eq("user_id", "7216126b-7293-488c-9689-917e172ad5ce");
  await supabase.from("profiles").update({ full_name: "מנהל מערכת" }).eq("user_id", "7216126b-7293-488c-9689-917e172ad5ce");

  return new Response(JSON.stringify({ success: true, pwError }), { status: 200 });
});
