-- Create documents storage bucket (private)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- RLS: Allow authenticated users to upload to their bot's folder
create policy "Users can upload documents" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
  );

-- RLS: Allow authenticated users to read their bot's documents
create policy "Users can read documents" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
  );

-- RLS: Allow authenticated users to delete their bot's documents
create policy "Users can delete documents" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
  );

-- RLS: Service role can do everything (for pipeline processing)
-- (Service role bypasses RLS by default, no policy needed)
