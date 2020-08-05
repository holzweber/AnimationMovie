precision mediump float;

 uniform sampler2D u_texture;
 uniform float u_maxage;

varying float age;
varying vec2 texCoords;

void main() {
	 vec4 texColor = texture2D(u_texture, texCoords);
    float fakt = clamp(age / 5.0 , 0.0, 1.0) ;
	gl_FragColor = vec4(1.0 , 1.0 - fakt , 0.0, (texColor[0] + texColor[1] + texColor[2] )/3.0* (1.0-fakt*fakt)); // fire partice wird ausgeblendet am ende
}