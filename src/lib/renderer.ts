import { hexToLinear } from "./color";
import { FRAG_SRC, MAX_LIGHTS, VERT_SRC } from "./glsl";
import { Scene, SHAPE_INDEX } from "./types";

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${log}`);
  }
  return shader;
}

export class LightRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private posData = new Float32Array(MAX_LIGHTS * 4);
  private colData = new Float32Array(MAX_LIGHTS * 3);
  private propData = new Float32Array(MAX_LIGHTS * 2);
  private rotData = new Float32Array(MAX_LIGHTS);

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 is not available in this browser");
    this.gl = gl;

    const program = gl.createProgram();
    if (!program) throw new Error("Unable to create program");
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT_SRC));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Shader link error: ${gl.getProgramInfoLog(program)}`);
    }
    this.program = program;
    gl.useProgram(program);

    const vao = gl.createVertexArray();
    if (!vao) throw new Error("Unable to create VAO");
    this.vao = vao;
    gl.bindVertexArray(vao);

    for (const name of [
      "uRes",
      "uAspect",
      "uCount",
      "uBgA",
      "uBgB",
      "uGradAngle",
      "uMaster",
      "uLightPos",
      "uLightCol",
      "uLightProp",
      "uLightRot",
    ]) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }
  }

  resize(width: number, height: number): void {
    const gl = this.gl;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(this.uniforms.uRes!, width, height);
    gl.uniform1f(this.uniforms.uAspect!, width / Math.max(height, 1));
  }

  render(scene: Scene): void {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    const lights = scene.lights.filter((l) => l.enabled).slice(0, MAX_LIGHTS);
    lights.forEach((light, i) => {
      this.posData[i * 4] = light.x;
      this.posData[i * 4 + 1] = light.y;
      this.posData[i * 4 + 2] = light.size;
      this.posData[i * 4 + 3] = SHAPE_INDEX[light.shape];

      const [r, g, b] = hexToLinear(light.color);
      this.colData[i * 3] = r;
      this.colData[i * 3 + 1] = g;
      this.colData[i * 3 + 2] = b;

      this.propData[i * 2] = light.intensity;
      this.propData[i * 2 + 1] = light.softness;
      this.rotData[i] = (light.rotation * Math.PI) / 180;
    });

    gl.uniform1i(this.uniforms.uCount!, lights.length);
    gl.uniform4fv(this.uniforms.uLightPos!, this.posData);
    gl.uniform3fv(this.uniforms.uLightCol!, this.colData);
    gl.uniform2fv(this.uniforms.uLightProp!, this.propData);
    gl.uniform1fv(this.uniforms.uLightRot!, this.rotData);

    const bgA = hexToLinear(scene.bg.color);
    const bgB = hexToLinear(scene.bg.gradient ? scene.bg.color2 : scene.bg.color);
    gl.uniform3f(this.uniforms.uBgA!, bgA[0], bgA[1], bgA[2]);
    gl.uniform3f(this.uniforms.uBgB!, bgB[0], bgB[1], bgB[2]);
    gl.uniform1f(this.uniforms.uGradAngle!, (scene.bg.angle * Math.PI) / 180);
    gl.uniform1f(this.uniforms.uMaster!, scene.master);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy(): void {
    const gl = this.gl;
    gl.deleteProgram(this.program);
    gl.deleteVertexArray(this.vao);
    // Deliberately no WEBGL_lose_context here: React re-mounts the component
    // (StrictMode, hot reload) and a lost context can never be revived.
  }
}
