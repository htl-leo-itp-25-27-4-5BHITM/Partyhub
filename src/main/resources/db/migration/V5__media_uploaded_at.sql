-- Upload time of a gallery item. Nullable: items stored before this column existed have no known upload time.
ALTER TABLE public.media ADD COLUMN uploaded_at timestamp(6) without time zone;
