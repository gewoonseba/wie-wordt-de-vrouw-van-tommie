// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CrtShaderOverlay } from "@/components/scoreboard/CrtShaderOverlay";

type FrameCallback = (now: number) => void;

function createWebGlStub() {
  const vertexShader = { kind: "vertex" };
  const fragmentShader = { kind: "fragment" };
  const program = {};
  const buffer = {};
  let shaderCount = 0;

  return {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    FLOAT: 7,
    TRIANGLES: 8,
    createShader: vi.fn(() => (shaderCount++ === 0 ? vertexShader : fragmentShader)),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => program),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    deleteProgram: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn(() => ({})),
    createBuffer: vi.fn(() => buffer),
    deleteBuffer: vi.fn(),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    useProgram: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    viewport: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    drawArrays: vi.fn()
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("CrtShaderOverlay", () => {
  it("renders, resizes, throttles, and releases its WebGL resources", () => {
    const gl = createWebGlStub();
    let frameCallback: FrameCallback | undefined;
    const requestFrame = vi.fn((callback: FrameCallback) => {
      frameCallback = callback;
      return 42;
    });
    const cancelFrame = vi.fn();
    const disconnect = vi.fn();

    class ResizeObserverStub {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe() {
        this.callback([], this as unknown as ResizeObserver);
      }
      disconnect() {
        disconnect();
      }
    }

    vi.stubGlobal("WebGLRenderingContext", class {});
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    vi.stubGlobal("cancelAnimationFrame", cancelFrame);
    vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      gl as unknown as WebGLRenderingContext
    );

    const view = render(<CrtShaderOverlay />);

    expect(gl.linkProgram).toHaveBeenCalledTimes(1);
    expect(gl.viewport).toHaveBeenCalledWith(0, 0, 1, 1);
    expect(gl.uniform2f).toHaveBeenCalledWith(expect.anything(), 1, 1);
    expect(frameCallback).toBeTypeOf("function");

    act(() => frameCallback?.(100));
    expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLES, 0, 6);

    const nextFrame = frameCallback;
    act(() => nextFrame?.(110));
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);

    view.unmount();
    expect(cancelFrame).toHaveBeenCalledWith(42);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
  });

  it("falls back to window resize events when ResizeObserver is unavailable", () => {
    const gl = createWebGlStub();
    const addListener = vi.spyOn(window, "addEventListener");
    const removeListener = vi.spyOn(window, "removeEventListener");

    vi.stubGlobal("WebGLRenderingContext", class {});
    vi.stubGlobal("ResizeObserver", undefined);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 7));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      gl as unknown as WebGLRenderingContext
    );

    const view = render(<CrtShaderOverlay />);

    expect(addListener).toHaveBeenCalledWith("resize", expect.any(Function));
    view.unmount();
    expect(removeListener).toHaveBeenCalledWith("resize", expect.any(Function));
  });
});
