-- prisma/manual/pgvector.sql
-- 1) À exécuter AVANT le premier `prisma db push` qui contient le type vector.
CREATE EXTENSION IF NOT EXISTS vector;

-- 2) À exécuter APRÈS `prisma db push` (idempotent).
CREATE INDEX IF NOT EXISTS chunk_embedding_hnsw
  ON "Chunk" USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
