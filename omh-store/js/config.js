/* Connect the shop to Supabase.
   Supabase dashboard > Project Settings > API: "Project URL" and the publishable ("anon public") key.
   The publishable key is safe in the browser: the security rules in supabase/schema.sql decide what visitors can do.
   Leave both empty to run in demo mode (data kept in this browser only). */
window.OMH_SUPABASE = {
  url: "https://ixvnjmrgergaxdrbbhfl.supabase.co",
  anonKey: "sb_publishable_pAXO1a7N5EUPH9OUG9gxiw_8N-R122u"
};
