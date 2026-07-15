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

function createRadialDisplacementMap(size: number) {
  const pixels: string[] = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const normalizedX = ((x + 0.5) / size) * 2 - 1;
      const normalizedY = ((y + 0.5) / size) * 2 - 1;
      const radiusSquared = normalizedX ** 2 + normalizedY ** 2;
      const red = Math.round(
        Math.min(1, Math.max(0, 0.5 + normalizedX * radiusSquared * 0.25)) * 255
      );
      const green = Math.round(
        Math.min(1, Math.max(0, 0.5 + normalizedY * radiusSquared * 0.25)) * 255
      );

      pixels.push(
        `<rect x="${x}" y="${y}" width="1" height="1" fill="rgb(${red},${green},0)"/>`
      );
    }
  }

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${pixels.join("")}
    </svg>
  `)}`;
}

const RADIAL_DISPLACEMENT_MAP = createRadialDisplacementMap(24);

const FRAGMENT_SHADER = `
  precision highp float;

  uniform float u_time;
  uniform vec2 u_resolution;
  varying vec2 v_uv;

  float random(vec2 point) {
    return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 centered = v_uv * 2.0 - 1.0;
    float radiusSquared = dot(centered, centered);
    vec2 curvedUv = 0.5 + 0.5 * centered * (1.0 + radiusSquared * 0.085);
    vec2 pixel = curvedUv * u_resolution;
    float scan = 0.5 + 0.5 * sin(pixel.y * 3.14159265);
    float triad = mod(floor(pixel.x), 3.0);
    vec3 phosphor = triad < 1.0
      ? vec3(0.95, 0.05, 0.22)
      : triad < 2.0
        ? vec3(0.08, 0.95, 0.45)
        : vec3(0.08, 0.3, 1.0);

    float noise = random(floor(pixel * 0.58) + floor(u_time * 34.0));

    float trackingY = fract(u_time * 0.11);
    float tracking = 1.0 - smoothstep(0.0, 0.065, abs(curvedUv.y - trackingY));
    float trackingCore = 1.0 - smoothstep(0.0, 0.012, abs(curvedUv.y - trackingY));

    float staticClock = floor(u_time * 1.6);
    float staticBurst = step(0.94, random(vec2(staticClock, 19.17)));
    float staticNoise = 0.0;
    if (staticBurst > 0.5) {
      staticNoise = random(
        floor(pixel * vec2(0.72, 0.86)) + vec2(floor(u_time * 79.0), -floor(u_time * 53.0))
      );
    }

    float tearClock = floor(u_time * 0.72);
    float tearEvent = step(0.91, random(vec2(tearClock, 71.4)));
    float tearY = random(vec2(tearClock, 4.81));
    float tearBand = (
      1.0 - smoothstep(0.0, 0.021, abs(curvedUv.y - tearY))
    ) * tearEvent;
    float hardGlitch = step(
      0.975,
      random(vec2(floor(u_time * 7.0), floor(pixel.y * 0.035)))
    ) * max(staticBurst, tearEvent);

    float edge = 1.0 - smoothstep(0.42, 1.32, radiusSquared);
    float lensFringe = smoothstep(0.34, 1.3, radiusSquared);
    float flicker = 0.93 + 0.07 * sin(u_time * 31.0);

    vec3 color = phosphor * (0.026 + noise * 0.032);
    color += vec3(0.18, 0.85, 0.55) * tracking * 0.13;
    color += vec3(0.7, 1.0, 0.88) * trackingCore * 0.24;
    color += vec3(staticNoise) * staticBurst * 0.34;
    color += vec3(0.1, 0.9, 1.0) * tearBand * 0.18;
    color += vec3(1.0, 0.05, 0.52) * hardGlitch * 0.2;
    color += vec3(0.08, 0.025, 0.13) * lensFringe;
    color *= flicker;

    float darkness = (1.0 - scan) * 0.22;
    darkness += (1.0 - edge) * 0.34;
    darkness += hardGlitch * 0.12;
    darkness += staticBurst * staticNoise * 0.16;
    float alpha = clamp(
      darkness + 0.025 + noise * 0.028 + tracking * 0.09 + trackingCore * 0.08,
      0.0,
      0.64
    );

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
    let timer: number | undefined;
    let stopped = false;

    const scheduleFrame = () => {
      if (stopped || document.hidden) return;

      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = undefined;
        frame = requestAnimationFrame(render);
      }, TARGET_FRAME_INTERVAL);
    };

    const render = (now: number) => {
      if (!gl || stopped) return;

      if (!document.hidden && now - lastDrawAt >= TARGET_FRAME_INTERVAL) {
        lastDrawAt = now;
        gl.uniform1f(timeLocation, (now - startedAt) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      scheduleFrame();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timer !== undefined) window.clearTimeout(timer);
        timer = undefined;
        cancelAnimationFrame(frame);
      } else {
        scheduleFrame();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    frame = requestAnimationFrame(render);

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopResize();
      gl?.deleteBuffer(buffer);
      gl?.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvasRef} className="crt-shader" aria-hidden="true" />;
}

export function CrtBarrelFilterDefs() {
  return (
    <svg className="crt-filter-defs" aria-hidden="true">
      <defs>
        <CrtBarrelFilter id="crt-barrel-warp" scale={34} />
        <CrtBarrelFilter id="crt-barrel-warp-mobile" scale={15} />
      </defs>
    </svg>
  );
}

function CrtBarrelFilter({ id, scale }: { id: string; scale: number }) {
  return (
    <filter
      id={id}
      x="-3%"
      y="-3%"
      width="106%"
      height="106%"
      colorInterpolationFilters="sRGB"
    >
      <feImage
        href={RADIAL_DISPLACEMENT_MAP}
        preserveAspectRatio="none"
        result="barrelMap"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="barrelMap"
        scale={scale}
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  );
}
