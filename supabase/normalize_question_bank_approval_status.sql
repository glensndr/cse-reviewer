-- Optional production cleanup after imports.
-- The app now accepts both 'Approved' and 'approved', but this normalizes stored rows.

update public.question_bank
set status = 'Approved'
where lower(status) = 'approved'
  and status <> 'Approved';

select
  status,
  count(*) as rows
from public.question_bank
group by status
order by status;
