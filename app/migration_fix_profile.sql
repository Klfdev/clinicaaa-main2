-- RPC to Get User Profile securely
-- This helps if RLS policies are preventing the user from seeing their own profile
create or replace function public.get_user_profile()
returns json
language plpgsql
security definer
as $$
declare
  current_user_id uuid;
  result json;
begin
  current_user_id := auth.uid();
  
  if current_user_id is null then
    return null;
  end if;

  select row_to_json(p) into result
  from public.profiles p
  where p.id = current_user_id;

  return result;
end;
$$;
