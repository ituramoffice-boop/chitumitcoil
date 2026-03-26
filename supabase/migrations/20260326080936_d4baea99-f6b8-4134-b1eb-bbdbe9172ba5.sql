CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _profession text;
  _role app_role;
BEGIN
  _profession := COALESCE(NEW.raw_user_meta_data->>'profession', 'mortgage_advisor');
  
  IF _profession IN ('mortgage_advisor', 'insurance_agent') THEN
    _role := 'consultant';
  ELSE
    _role := 'client';
  END IF;

  INSERT INTO public.profiles (user_id, email, full_name, profession)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _profession
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;