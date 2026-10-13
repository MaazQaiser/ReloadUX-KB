import { describe, expect, it } from "vitest";
import { readNdjson, toNdjsonStream } from "./ndjson";

async function* values<T>(...items: T[]) {
  yield* items;
}

function streamOf(...chunks: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>) {
  const out: unknown[] = [];
  for await (const value of readNdjson(stream)) out.push(value);
  return out;
}

describe("ndjson", () => {
  it("round-trips values", async () => {
    const items = [{ type: "text", delta: "Hi\nthere" }, { type: "done" }];
    expect(await collect(toNdjsonStream(values(...items)))).toEqual(items);
  });

  it("joins lines split across chunks and skips blank lines", async () => {
    expect(await collect(streamOf('{"a":', '1}\n\n{"b"', ":2}"))).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("throws on a corrupt line", async () => {
    await expect(collect(streamOf("{nope}\n"))).rejects.toThrow();
  });
});
