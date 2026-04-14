-- Founders Club — Self-serve account deletion
-- Permette a un utente autenticato di eliminare il proprio account.
-- La cancellazione da auth.users fa cascade su profiles e, di conseguenza,
-- su tutte le tabelle che referenziano profiles.id con on delete cascade.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
