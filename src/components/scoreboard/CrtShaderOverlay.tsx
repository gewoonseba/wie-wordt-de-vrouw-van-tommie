"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform float u_time;
  uniform vec2 u_resolution;
  varying vec2 v_uv;

  float random(vec2 point) {
    return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 pixel = v_uv * u_resolution;
    float scan = 0.5 + 0.5 * sin(pixel.y * 3.14159265);
    float triad = mod(floor(pixel.x), 3.0);
    vec3 phosphor = triad < 1.0
      ? vec3(0.95, 0.05, 0.22)
      : triad < 2.0
        ? vec3(0.08, 0.95, 0.45)
        : vec3(0.08, 0.3, 1.0);

    float noise = random(floor(pixel * 0.52) + floor(u_time * 26.0));
    float trackingY = fract(u_time * 0.075);
    float tracking = 1.0 - smoothstep(0.0, 0.028, abs(v_uv.y - trackingY));
    float hardGlitch = step(0.992, random(vec2(floor(u_time * 2.0), floor(pixel.y * 0.02))));

    vec2 centered = v_uv * 2.0 - 1.0;
    float edge = 1.0 - smoothstep(0.42, 1.32, dot(centered, centered));
    float flicker = 0.965 + 0.035 * sin(u_time * 31.0);

    vec3 color = phosphor * (0.018 + noise * 0.022);
    color += vec3(0.2, 1.0, 0.66) * tracking * 0.13;
    color += vec3(0.95, 0.1, 0.52) * hardGlitch * 0.06;
    color *= flicker;

    float darkness = (1.0 - scan) * 0.11;
    darkness += (1.0 - edge) * 0.28;
    darkness += hardGlitch * 0.035;
    float alpha = clamp(darkness + 0.018 + noise * 0.018 + tracking * 0.08, 0.0, 0.42);

    gl_FragColor = vec4(color, alpha);
  }
`;

const TARGET_FRAME_INTERVAL = 1000 / 30;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
) {
  const shader = gl.createShader(type);

  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export function CrtShaderOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof WebGLRenderingContext === "undefined") return;

    let gl: WebGLRenderingContext | null = null;

    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        premultipliedAlpha: false
      });
    } catch {
      return;
    }

    if (!gl) return;

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();

    if (!vertexShader || !fragmentShader || !program) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      if (program) gl.deleteProgram(program);
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return;
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const buffer = gl.createBuffer();

    if (!buffer || positionLocation < 0 || !timeLocation || !resolutionLocation) {
      if (buffer) gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      gl?.viewport(0, 0, width, height);
      gl?.uniform2f(resolutionLocation, width, height);
    };

    let stopResize: () => void;

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", resize);
      stopResize = () => window.removeEventListener("resize", resize);
    } else {
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      stopResize = () => resizeObserver.disconnect();
    }

    resize();

    const startedAt = performance.now();
    let lastDrawAt = 0;
    let frame = 0;

    const render = (now: number) => {
      if (!gl) return;

      frame = requestAnimationFrame(render);

      if (document.hidden || now - lastDrawAt < TARGET_FRAME_INTERVAL) {
        return;
      }

      lastDrawAt = now;
      gl.uniform1f(timeLocation, (now - startedAt) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      stopResize();
      gl?.deleteBuffer(buffer);
      gl?.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvasRef} className="crt-shader" aria-hidden="true" />;
}
