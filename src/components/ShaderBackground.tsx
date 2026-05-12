import React, { useEffect, useRef } from 'react';

export const ShaderBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    let requestID: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Deep blue and emerald green shader
    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;
      const int POINTS = 16;
      const float WAVE_OFFSET = 12000.0;
      const float SPEED = 1.0 / 16.0; 
      const float COLOR_SPEED = 1.0 / 12.0;
      uniform float BRIGHTNESS;

      void voronoi(vec2 uv, inout vec3 col) {
          vec3 voronoi = vec3(0.0);
          float time = (iTime + WAVE_OFFSET) * SPEED;
          float bestDistance = 999.0;
          float lastBestDistance = bestDistance;
          for (int i = 0; i < POINTS; i++) {
              float fi = float(i);
              vec2 p = vec2(mod(fi, 1.0) * 0.1 + sin(fi), -0.05 + 0.15 * float(i / 10) + cos(fi + time * cos(uv.x * 0.025)));
              p.x += 0.01 * sin(iMouse.x / iResolution.x * 3.14);
              p.y += 0.01 * cos(iMouse.y / iResolution.y * 3.14);
              float d = distance(uv, p);
              if (d < bestDistance) {
                  lastBestDistance = bestDistance;
                  bestDistance = d;
                  voronoi.x = p.x;
                  voronoi.yz = vec2(p.x * 0.4 + p.y, p.y) * vec2(0.9, 0.87);
              }
          }
          
          col *= 0.6 + 0.4 * voronoi; // Contrast
          
          float edge = 1.0 - abs(bestDistance - lastBestDistance);
          
          // Accent Green cores instead of orange
          col += vec3(0.0, 0.78, 0.32) * smoothstep(0.985, 1.02, edge) * 0.4;
          // Subtler green/blue glow edges
          col += vec3(0.0, 0.4, 0.3) * smoothstep(0.94, 1.0, edge) * 0.15;
      }

      void main() {
          vec2 uv = gl_FragCoord.xy/iResolution.xy;
          float t = iTime * COLOR_SPEED;
          
          // Base colors: Deep Blue to dark teal
          vec3 deepOcean = vec3(0.01, 0.02, 0.05); // Very dark blue/black
          vec3 primaryBlue = vec3(0.02, 0.08, 0.15); // Deep luxury blue
          vec3 emeraldTint = vec3(0.00, 0.15, 0.10); 
          
          float noise = sin(uv.x * 2.0 + t) * cos(uv.y * 3.0 - t * 0.5);
          
          vec3 baseCol = mix(deepOcean, primaryBlue, 0.5 + 0.5 * noise);
          baseCol = mix(baseCol, emeraldTint, smoothstep(0.7, 1.0, noise) * 0.4);
          
          baseCol *= smoothstep(-0.4, 1.1, uv.y); // darker at bottom

          voronoi(uv * 4.0 - 1.0, baseCol);
          
          gl_FragColor = vec4(baseCol, 1.0) * BRIGHTNESS;
      }
    `;

    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionAttribLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'iResolution');
    const timeUniformLocation = gl.getUniformLocation(program, 'iTime');
    const mouseUniformLocation = gl.getUniformLocation(program, 'iMouse');
    const brightnessUniformLocation = gl.getUniformLocation(program, 'BRIGHTNESS');

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);

    const startTime = Date.now();
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    const brightness = 0.9;

    const handleMouseMove = (e: MouseEvent) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      requestID = requestAnimationFrame(render);
      const elapsedTime = (Date.now() - startTime) / 1000;
      
      gl.useProgram(program);
      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      gl.uniform1f(timeUniformLocation, elapsedTime);
      gl.uniform2f(mouseUniformLocation, mouseX, mouseY);
      gl.uniform1f(brightnessUniformLocation, brightness);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    
    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestID);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-screen h-screen -z-10 block pointer-events-none"
    />
  );
};
