-- Per-person meal/diet choices for event registrations.
alter table public.event_registrations
  add column if not exists guests jsonb not null default '[]'::jsonb;

-- One guest from legacy columns when still empty.
update public.event_registrations
set guests = jsonb_build_array(
  jsonb_build_object(
    'preference', case
      when food_preference = 'non-veg' then 'non-veg'
      when food_preference = 'none' then 'none'
      else 'veg'
    end,
    'lunch', lunch,
    'dinner', dinner
  )
)
where guests = '[]'::jsonb;

-- Expand to number_of_guests identical clones (prior whole-party same choice).
update public.event_registrations r
set guests = (
  select coalesce(jsonb_agg(r.guests->0), '[]'::jsonb)
  from generate_series(1, greatest(coalesce(r.number_of_guests, 1), 1))
)
where jsonb_array_length(r.guests) = 1
  and greatest(coalesce(r.number_of_guests, 1), 1) > 1;
