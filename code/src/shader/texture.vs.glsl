/**
 * a phong shader implementation
 * Created by Samuel Gratzl on 29.02.2016.
 */
attribute vec3 a_position;
attribute vec3 a_normal;
//given texture coordinates per vertex
attribute vec2 a_texCoord;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection; 


uniform vec3 u_lightPos;
//uniform vec3 u_light2Pos;

//lanterns
uniform vec3 u_spotlight0Pos;
uniform vec3 u_spotlight1Pos;
uniform vec3 u_spotlight2Pos;
uniform vec3 u_spotlight3Pos;
uniform vec3 u_spotlight4Pos;
uniform vec3 u_spotlight5Pos;
uniform vec3 u_spotlight6Pos;

uniform vec3 u_spotlight0DirVec;
uniform vec3 u_spotlight1DirVec;
uniform vec3 u_spotlight2DirVec;
uniform vec3 u_spotlight3DirVec;
uniform vec3 u_spotlight4DirVec;
uniform vec3 u_spotlight5DirVec;
uniform vec3 u_spotlight6DirVec;
vec3 lightPos = vec3(0, -2, 2);

//output of this shader
varying vec3 v_normalVec;
varying vec3 v_eyeVec;
//fix light
varying vec3 v_lightVec;
//torch(moving light)
varying vec3 v_light2Vec;

//varying of the lanterns
varying vec3 v_spotlight0Vec;   
varying vec3 v_spotlight1Vec;
varying vec3 v_spotlight2Vec;   
varying vec3 v_spotlight3Vec;
varying vec3 v_spotlight4Vec;   
varying vec3 v_spotlight5Vec;
//torch
varying vec3 v_spotlight6Vec;

varying vec3 v_spotlight0DirVec;
varying vec3 v_spotlight1DirVec;
varying vec3 v_spotlight2DirVec;
varying vec3 v_spotlight3DirVec;
varying vec3 v_spotlight4DirVec;
varying vec3 v_spotlight5DirVec;
//torch
varying vec3 v_spotlight6DirVec;
//texturing
varying vec2 v_texCoord;

void main() {
	vec4 eyePosition = u_modelView * vec4(a_position,1);

  	v_normalVec = u_normalMatrix * a_normal;

 	 v_eyeVec = -eyePosition.xyz;
	
	v_lightVec = u_lightPos - eyePosition.xyz;
	
	//v_light2Vec = u_light2Pos - eyePosition.xyz;

	//TEXTURING
	v_texCoord = a_texCoord;

	// transform spotlight vectors
	v_spotlight0Vec = u_spotlight0Pos - eyePosition.xyz;  // spotlightxVec = vector in wordspace from lightsource to vertex
	v_spotlight1Vec = u_spotlight1Pos - eyePosition.xyz;
	v_spotlight2Vec = u_spotlight2Pos - eyePosition.xyz;
	v_spotlight3Vec = u_spotlight3Pos - eyePosition.xyz;
	v_spotlight4Vec = u_spotlight4Pos - eyePosition.xyz;
	v_spotlight5Vec = u_spotlight5Pos - eyePosition.xyz;
	v_spotlight6Vec = u_spotlight6Pos - eyePosition.xyz;

	v_spotlight0DirVec = u_spotlight0DirVec; // already transformed in wordspace
	v_spotlight1DirVec = u_spotlight1DirVec; // already transformed in wordspace
	v_spotlight2DirVec = u_spotlight2DirVec; // already transformed in wordspace
	v_spotlight3DirVec = u_spotlight3DirVec; // already transformed in wordspace
	v_spotlight4DirVec = u_spotlight4DirVec; // already transformed in wordspace
	v_spotlight5DirVec = u_spotlight5DirVec; // already transformed in wordspace
	v_spotlight6DirVec = u_spotlight6DirVec; // already transformed in wordspace
	gl_Position = u_projection * eyePosition;
}
