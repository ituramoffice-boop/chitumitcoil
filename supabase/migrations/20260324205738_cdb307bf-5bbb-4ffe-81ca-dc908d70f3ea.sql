
-- Trigger: Auto-notify advisor on new lead
CREATE OR REPLACE FUNCTION public.notify_advisor_on_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
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
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_advisor_new_lead ON public.leads;
CREATE TRIGGER trg_notify_advisor_new_lead
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_advisor_on_new_lead();

-- Trigger: Lead status change - approved notification + fail-safe recovery
CREATE OR REPLACE FUNCTION public.on_lead_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.consultant_id,
      '🎉 אושר! ' || NEW.full_name,
      'התיק אושר בבנק. סכום: ' || COALESCE(to_char(NEW.mortgage_amount, 'FM₪999,999,999'), 'לא צוין'),
      'success',
      '/dashboard'
    );
  END IF;

  -- Fail-safe: prevent rejection for low scores, route to recovery instead
  IF NEW.status = 'rejected' AND COALESCE(NEW.lead_score, 0) < 70 THEN
    NEW.status := 'in_progress';
    NEW.next_step := 'תוכנית הבראה 12 חודשים — ציון נמוך מ-70';
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.consultant_id,
      '⚠️ נדרשת פעולה: ' || NEW.full_name,
      'הציון נמוך מ-70. הלקוח הועבר אוטומטית לתוכנית הבראה במקום דחייה.',
      'warning',
      '/dashboard'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_lead_status_change ON public.leads;
CREATE TRIGGER trg_on_lead_status_change
  BEFORE UPDATE OF status ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.on_lead_status_change();

-- Trigger: Notify consultant on document upload
CREATE OR REPLACE FUNCTION public.notify_on_document_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.consultant_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.consultant_id,
      'מסמך חדש הועלה',
      NEW.file_name || ' — ' || COALESCE(NEW.classification, 'לא מסווג'),
      'document',
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_document_upload ON public.documents;
CREATE TRIGGER trg_notify_document_upload
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_document_upload();
