/**
*
* SpotLight
*
 */
/**
 * a light node represents a light including light position and light properties (ambient, diffuse, specular)
 * the light position will be transformed according to the current model view matrix
 */
class SpotLightNode extends TransformationSGNode {
  constructor(position, children) {
    super(null, children);
    this.position = position || [0, 0, 0];
    this.ambient = [0, 0, 0, 1];
    this.diffuse = [1, 1, 1, 1];
    this.specular = [1, 1, 1, 1];
    this.limit = glm.deg2rad(40); // dot limit 1 = 90°  dh spotlight mit einer halbkugel
    this.dirvec = [0, -1, 0]; // default zeigt das licht nach unten.
    //uniform name
    this.uniform = 'u_spotlight';
    this._worldPosition = null;
    this._worldDirvec = [0,0,0];
  }
  setLightUniforms(context) {
    const gl = context.gl;
    //no materials in use
    if (!context.shader || !isValidUniformLocation(gl.getUniformLocation(context.shader, this.uniform + '.ambient'))) {
      return;
    }
    gl.uniform4fv(gl.getUniformLocation(context.shader, this.uniform + '.ambient'), this.ambient);
    gl.uniform4fv(gl.getUniformLocation(context.shader, this.uniform + '.diffuse'), this.diffuse);
    gl.uniform4fv(gl.getUniformLocation(context.shader, this.uniform + '.specular'), this.specular);
    gl.uniform1f(gl.getUniformLocation(context.shader, this.uniform + '.limit'), this.limit);
    gl.uniform3fv(gl.getUniformLocation(context.shader, this.uniform + '.dirvec'), this._worldDirvec);
  }
  setLightPosition(context) {
    const gl = context.gl;
    if (!context.shader || !isValidUniformLocation(gl.getUniformLocation(context.shader, this.uniform + 'Pos'))) {
      return;
    }
    const position = this._worldPosition || this.position;
    gl.uniform3f(gl.getUniformLocation(context.shader, this.uniform + 'Pos'), position[0], position[1], position[2]);


    if (!context.shader || !isValidUniformLocation(gl.getUniformLocation(context.shader, this.uniform + 'DirVec'))) {
      return;
    }
    const dirvec = this._worldDirvec || this.dirvec;
    gl.uniform3f(gl.getUniformLocation(context.shader, this.uniform + 'DirVec'), dirvec[0], dirvec[1], dirvec[2]);
  }
  computeLightPosition(context) {
    //transform with the current model view matrix
    const modelViewMatrix = mat4.multiply(mat4.create(), context.viewMatrix, context.sceneMatrix);
    const original = this.position;
    const position = vec4.transformMat4(vec4.create(), vec4.fromValues(original[0], original[1], original[2], 1), modelViewMatrix); 
    this._worldPosition = position; 
    let nMat = mat3.normalFromMat4(mat3.create(), modelViewMatrix);
    vec3.transformMat3(this._worldDirvec, this.dirvec, nMat);
    // const orginalDirvec = this.dirvec;
    // const dirvec = vec4.transformMat4(vec4.create(), vec4.fromValues(orginalDirvec[0], orginalDirvec[1], orginalDirvec[2], 1), modelViewMatrix);
    // this._worldDirvec = dirvec;
  }
  /**
   * set the light uniforms without updating the last light position
   */
  setLight(context) {
    this.setLightPosition(context);
    this.setLightUniforms(context);
  }
  render(context) {
    this.computeLightPosition(context);
    this.setLight(context);
    //since this a transformation node update the matrix according to my position
    this.matrix = glm.translate(this.position[0], this.position[1], this.position[2]);
    //render children
    super.render(context);
  }
}
