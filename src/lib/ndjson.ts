/** Newline-delimited JSON: one value per line, so a stream can be read as it arrives. */

export function toNdjsonStream<T>(source: AsyncIterable<T>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const iterator = source[Symbol.asyncIterator]();
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) controller.close();
      else controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
    },
    async cancel() {
      await iterator.return?.();
    },
  });
}

/** Yields each parsed line. Lines that aren't JSON throw, because the stream is then corrupt. */
export async function* readNdjson(stream: ReadableStream<Uint8Array>): AsyncGenerator<unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      // stream: true keeps a multi-byte character split across chunks intact.
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) if (line.trim()) yield JSON.parse(line);
    }
    buffer += decoder.decode();
    if (buffer.trim()) yield JSON.parse(buffer);
  } finally {
    reader.releaseLock();
  }
}
