-- Update the trigger function to handle null consultant_id
CREATE OR REPLACE FUNCTION public.notify_advisor_on_new_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.consultant_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.consultant_id,
      'ליד חדש: ' || NEW.full_name,
      CASE
        WHEN COALESCE(NEW.mortgage_amount, 0) >= 2000000 THEN '🔥 VIP — בקשת משכנתא ' || COALESCE(to_char(NEW.mortgage_amount, 'FM₪999,999,999'), '') || ' | ' || COALESCE(NEW.lead_source, 'organic')
        ELSE 'בקשת משכנתא חדשה' || CASE WHEN NEW.mortgage_amount IS NOT NULL THEN ' — ' || to_char(NEW.mortgage_amount, 'FM₪999,999,999') ELSE '' END
      END,
      CASE WHEN COALESCE(NEW.mortgage_amount, 0) >= 2000000 THEN 'vip' ELSE 'lead' END,
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Also update on_lead_status_change to handle null consultant_id
CREATE OR REPLACE FUNCTION public.on_lead_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.consultant_id IS NOT NULL AND NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.consultant_id,
      '🎉 אושר! ' || NEW.full_name,
      'התיק אושר בבנק. סכום: ' || COALESCE(to_char(NEW.mortgage_amount, 'FM₪999,999,999'), 'לא צוין'),
      'success',
      '/dashboard'
    );
  END IF;

  IF NEW.status = 'rejected' AND COALESCE(NEW.lead_score, 0) < 70 THEN
    NEW.status := 'in_progress';
    NEW.next_step := 'תוכנית הבראה 12 חודשים — ציון נמוך מ-70';
    IF NEW.consultant_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, link)
      VALUES (
        NEW.consultant_id,
        '⚠️ נדרשת פעולה: ' || NEW.full_name,
        'הציון נמוך מ-70. הלקוח הועבר אוטומטית לתוכנית הבראה במקום דחייה.',
        'warning',
        '/dashboard'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;