-- Add conversation_history_limit column to bots table
ALTER TABLE bots
  ADD COLUMN conversation_history_limit integer NOT NULL DEFAULT 6;

ALTER TABLE bots
  ADD CONSTRAINT bots_conversation_history_limit_check
  CHECK (conversation_history_limit BETWEEN 1 AND 50);
