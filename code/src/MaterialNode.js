/**
 * a material node contains the material properties for the underlying models
 */
class MaterialNode extends SGNode {

  constructor(children) {
    super(children);
    this.ambient = [0.2, 0.2, 0.2, 1.0];
    this.diffuse = [0.8, 0.8, 0.8, 1.0];
    this.specular = [0, 0, 0, 1];
    this.emission = [0, 0, 0, 1];
    this.shininess = 0.0;
    this.uniform = 'u_material';
  }

  setMaterialUniforms(context) {
    const gl = context.gl,
      shader = context.shader;

    //TASK 2-3 set uniforms
    //hint setting a structure element using the dot notation, e.g. u_material.ambient
    //setting a uniform: gl.uniform UNIFORM TYPE (gl.getUniformLocation(shader, UNIFORM NAME), VALUE);
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform + '.ambient'), this.ambient);
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform + '.diffuse'), this.diffuse);
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform + '.specular'), this.specular);
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform + '.emission'), this.emission);
    gl.uniform1f(gl.getUniformLocation(shader, this.uniform + '.shininess'), this.shininess);

  }

  render(context) {
    this.setMaterialUniforms(context);

    //render children
    super.render(context);
  }
}