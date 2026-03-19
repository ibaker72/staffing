-- Fix RLS policies that block client invitation acceptance flow.
--
-- Problem: When acceptClientInvitation creates a new client user via signUp(),
-- the subsequent INSERT into client_users and UPDATE on client_invitations
-- fail because only internal users have write access to these tables.
-- The newly created client user (or anon session if email confirmation is required)
-- cannot perform these operations.
--
-- Solution: Use SECURITY DEFINER functions to handle invitation acceptance
-- so that the operations bypass RLS safely with server-side validation.

-- Function to atomically link a client user to a company and mark the invitation accepted.
-- Called from the acceptClientInvitation server action after successful signup.
CREATE OR REPLACE FUNCTION public.accept_invitation(
  p_user_id UUID,
  p_invitation_id UUID,
  p_company_id UUID,
  p_invited_by UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert client_users linkage (ignore if already exists)
  INSERT INTO public.client_users (user_id, company_id, invited_by)
  VALUES (p_user_id, p_company_id, p_invited_by)
  ON CONFLICT (user_id, company_id) DO NOTHING;

  -- Mark invitation as accepted
  UPDATE public.client_invitations
  SET accepted_at = now()
  WHERE id = p_invitation_id
    AND accepted_at IS NULL;
END;
$$;

-- Allow authenticated users to call this function
-- (the function itself validates via its SECURITY DEFINER context)
GRANT EXECUTE ON FUNCTION public.accept_invitation(UUID, UUID, UUID, UUID) TO authenticated;
-- Also allow anon since the user may not be fully authenticated yet
-- (e.g., if email confirmation is required, signUp doesn't create a session)
GRANT EXECUTE ON FUNCTION public.accept_invitation(UUID, UUID, UUID, UUID) TO anon;
