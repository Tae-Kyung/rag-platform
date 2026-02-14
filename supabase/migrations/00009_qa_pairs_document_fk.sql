-- Add document_id FK to qa_pairs for referential integrity
-- This ensures:
--   1. qa_pairs → documents link is explicit (no pattern matching)
--   2. Deleting a document CASCADE deletes its qa_pair
--   3. Deleting a qa_pair does NOT delete the document (use document deletion instead)

alter table public.qa_pairs
  add column document_id uuid references public.documents(id) on delete cascade;

-- Index for efficient joins
create index idx_qa_pairs_document_id on public.qa_pairs(document_id);

-- Backfill: try to link existing qa_pairs to their documents
-- Match by bot_id + file_type='qa' + file_name pattern + closest created_at
update public.qa_pairs qp
set document_id = (
  select d.id
  from public.documents d
  where d.bot_id = qp.bot_id
    and d.file_type = 'qa'
    and d.file_name like 'Q&A: ' || left(qp.question, 50) || '%'
  order by d.created_at desc
  limit 1
)
where qp.document_id is null;
