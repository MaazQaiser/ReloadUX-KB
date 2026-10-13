import { describe, expect, it } from "vitest";
import { detectImageKind, mimeForKey } from "./image-type";

const bytes = (...values: number[]) => new Uint8Array([...values, ...new Array(16).fill(0)]);

describe("detectImageKind", () => {
  it("recognises PNG, JPEG and WebP by their signatures", () => {
    expect(detectImageKind(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("png");
    expect(detectImageKind(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpeg");
    expect(detectImageKind(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50))).toBe("webp");
  });

  it("refuses anything else, whatever it claims to be", () => {
    expect(detectImageKind(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImageKind(bytes(0x25, 0x50, 0x44, 0x46))).toBeNull();
    expect(detectImageKind(new Uint8Array())).toBeNull();
  });
});

describe("mimeForKey", () => {
  it("maps stored keys back to their type", () => {
    expect(mimeForKey("projects/x/abc.webp")).toBe("image/webp");
    expect(mimeForKey("projects/x/abc.svg")).toBeNull();
  });
});
