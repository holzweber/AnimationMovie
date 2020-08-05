class MultiTextureSGNode extends SGNode {
  constructor(image, index, children) {
    super(children);
    this.index = index;
    this.image = image;
    this.textureunit = this.index; //using more then one textureunit for multitexturing
    this.uniform = 'u_tex_' + this.index; //performing different texture uniforms
    this.textureId = -1;
  }
  init(gl) {
    this.textureId = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.textureId);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter || gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter || gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS || gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT || gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
  render(context) {
    if (this.textureId < 0) {
      this.init(context.gl);
    }
    //set additional shader parameters
    gl.uniform1i(gl.getUniformLocation(context.shader, this.uniform), this.textureunit);
    //activate and bind texture
    gl.activeTexture(gl.TEXTURE0 + this.textureunit);
    gl.bindTexture(gl.TEXTURE_2D, this.textureId);
    //render children
    
    super.render(context);
    //clean up
    gl.activeTexture(gl.TEXTURE0 + this.textureunit);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}
