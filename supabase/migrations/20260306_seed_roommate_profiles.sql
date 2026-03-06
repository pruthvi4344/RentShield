-- Demo seed for roommate finder cards.
-- Safe to run multiple times.

alter table public.renter_profiles
add column if not exists is_roommate_profile_public boolean not null default false;

alter table public.renter_profiles
add column if not exists roommate_preferred_gender text;

-- Ensure every renter has a renter_profile row.
insert into public.renter_profiles (id, email, username)
select p.id, p.email, p.username
from public.profiles p
where p.role = 'renter'
on conflict (id) do nothing;

with renter_rows as (
  select
    rp.id,
    rp.email,
    rp.username,
    row_number() over (order by rp.created_at, rp.id) as rn
  from public.renter_profiles rp
),
seed as (
  select
    rr.id,
    rr.email,
    rr.username,
    (array['India', 'South Korea', 'Nigeria', 'Brazil', 'Egypt', 'Canada'])[((rr.rn - 1) % 6) + 1] as country,
    (array['University of Toronto', 'University of Waterloo', 'UBC Vancouver', 'McGill University', 'University of Ottawa', 'York University'])[((rr.rn - 1) % 6) + 1] as university,
    (array['Toronto, ON', 'Waterloo, ON', 'Vancouver, BC', 'Montreal, QC', 'Ottawa, ON', 'Toronto, ON'])[((rr.rn - 1) % 6) + 1] as city,
    (array['Female', 'Male', 'Female', 'Male', 'Male', 'Female'])[((rr.rn - 1) % 6) + 1] as gender,
    (array['Any', 'Female', 'Male', 'Any', 'Female', 'Male'])[((rr.rn - 1) % 6) + 1] as roommate_preferred_gender,
    (array['Shared Room', 'Private Room', 'Shared Apartment', 'Private Room', 'Shared Apartment', 'Shared Room'])[((rr.rn - 1) % 6) + 1] as room_preference,
    (array[
      date '2026-09-01',
      date '2026-08-15',
      date '2026-09-01',
      date '2026-01-10',
      date '2026-05-01',
      date '2026-09-01'
    ])[((rr.rn - 1) % 6) + 1] as move_in_date,
    (array[700, 500, 800, 600, 650, 900])[((rr.rn - 1) % 6) + 1] as budget_min,
    (array[950, 800, 1100, 900, 1000, 1300])[((rr.rn - 1) % 6) + 1] as budget_max,
    ((array[
      array['Non-smoker', 'Early riser', 'Quiet household']::text[],
      array['Non-smoker', 'Flexible schedule', 'Tidy']::text[],
      array['Vegetarian', 'Non-smoker', 'Early riser']::text[],
      array['Social household', 'Flexible', 'Bilingual']::text[],
      array['Non-smoker', 'Pet-friendly', 'Tidy']::text[],
      array['Student household', 'Gym', 'Clean']::text[]
    ])[((rr.rn - 1) % 6) + 1])::text[] as lifestyle,
    (array[
      'International student looking for a clean and calm place near campus.',
      'Budget-focused student, tidy and respectful of shared spaces.',
      'Looking for a friendly roommate in a safe neighborhood.',
      'Flexible schedule, social but respectful and organized.',
      'New in city, focused on studies and quiet evenings.',
      'Prefer a balanced home routine and shared responsibilities.'
    ])[((rr.rn - 1) % 6) + 1] as bio
  from renter_rows rr
)
update public.renter_profiles rp
set
  email = coalesce(rp.email, s.email),
  username = coalesce(rp.username, s.username),
  country = coalesce(rp.country, s.country),
  university = coalesce(rp.university, s.university),
  city = coalesce(rp.city, s.city),
  gender = coalesce(rp.gender, s.gender),
  roommate_preferred_gender = coalesce(rp.roommate_preferred_gender, s.roommate_preferred_gender),
  room_preference = coalesce(rp.room_preference, s.room_preference),
  move_in_date = coalesce(rp.move_in_date, s.move_in_date),
  budget_min = coalesce(rp.budget_min, s.budget_min),
  budget_max = coalesce(rp.budget_max, s.budget_max),
  lifestyle = case
    when rp.lifestyle is null or cardinality(rp.lifestyle) = 0 then s.lifestyle::text[]
    else rp.lifestyle
  end,
  bio = coalesce(rp.bio, s.bio),
  is_roommate_profile_public = true,
  updated_at = now()
from seed s
where rp.id = s.id;
