# How answers work

When a visitor asks a question, Sigilla retrieves the 6 most relevant chunks from your sources (cosine similarity over embeddings), then asks the model to answer **only** using that context.

## Similarity threshold

Every agent has a similarity threshold (adjustable in Settings). If the best match scores below it, Sigilla skips the model call entirely and returns the fallback message — no hallucinated answer, no wasted request.

## Citations

Each sentence that uses a source is marked with a numbered seal. The seals link back to the exact page, URL, or PDF page number they came from.

## Language

Agents reply in the same language as the visitor's last message.

## Fallback

When the context doesn't contain the answer, your agent says so plainly and offers to bring in a human — see [Handoff](/docs/handoff).
