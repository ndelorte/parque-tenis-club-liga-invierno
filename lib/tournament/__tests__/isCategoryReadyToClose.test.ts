import { describe, it, expect } from "vitest";
import { isCategoryReadyToClose } from "../isCategoryReadyToClose";

describe("isCategoryReadyToClose", () => {
  it("no está lista si no hay ninguna serie de final", () => {
    expect(isCategoryReadyToClose([])).toBe(false);
  });

  it("no está lista si la final sigue programada", () => {
    expect(isCategoryReadyToClose(["scheduled"])).toBe(false);
  });

  it("está lista si la final está completada", () => {
    expect(isCategoryReadyToClose(["completed"])).toBe(true);
  });

  it("está lista si la final se definió por walkover", () => {
    expect(isCategoryReadyToClose(["walkover"])).toBe(true);
  });

  it("está lista si alguna de las series de final está completada", () => {
    expect(isCategoryReadyToClose(["scheduled", "completed"])).toBe(true);
  });
});
