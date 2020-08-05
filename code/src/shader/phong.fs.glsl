/**
 * a phong shader implementation
 * Created by Samuel Gratzl on 29.02.2016.
 * extended by Stefan Paukner and Christopher Holzweber
 */
precision mediump float;

/**
 * definition of a material structure containing common properties
 */
struct Material {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
	vec4 emission;
	float shininess;
};

/**
 * definition of the light properties related to material properties
 */
struct Light {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
};
struct SpotLight {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
	float limit; 
	vec3 dirvec;
};

uniform Material u_material;

//fix spotlight
uniform Light u_light;

//spotlight uniforms
uniform SpotLight u_spotlight0;
uniform SpotLight u_spotlight1;
uniform SpotLight u_spotlight2;
uniform SpotLight u_spotlight3;
uniform SpotLight u_spotlight4;
uniform SpotLight u_spotlight5;
//torch
uniform SpotLight u_spotlight6;
//varying vectors for light computation
varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;

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
//texture related variables
uniform bool u_enableObjectTexture; //note: boolean flags are a simple but not the best option to handle textured and untextured objects

//varying vec2 v_texCoord;
//uniform sampler2D u_tex;

vec4 calculateSimplePointLight(Light light, Material material, vec3 lightVec,
																vec3 normalVec, vec3 eyeVec) {
  // You can find all built-in functions (min, max, clamp, reflect, normalize, etc.) 
	// and variables (gl_FragCoord, gl_Position) in the OpenGL Shading Language Specification: 
	// https://www.khronos.org/registry/OpenGL/specs/gl/GLSLangSpec.4.60.html#built-in-functions
	vec3 lightVec2 = lightVec;
	lightVec = normalize(lightVec);
	normalVec = normalize(normalVec);
	eyeVec = normalize(eyeVec);

	//compute diffuse term
	float diffuse = max(dot(normalVec,lightVec),0.0);

	//compute specular term
	vec3 reflectVec = reflect(-lightVec,normalVec);
	float spec = pow( max( dot(reflectVec, eyeVec), 0.0) , material.shininess);


	vec4 c_amb  = clamp(light.ambient * material.ambient, 0.0, 1.0);
	vec4 c_diff = clamp(diffuse * light.diffuse * material.diffuse, 0.0, 1.0);
	vec4 c_spec = clamp(spec * light.specular * material.specular, 0.0, 1.0);
	vec4 c_em   = material.emission;

	return c_amb + c_diff + c_spec + c_em;
}

vec4 calculateSpotlight(SpotLight light, Material material, vec3 lightVec, vec3 lightDirVec,
																vec3 normalVec, vec3 eyeVec) {
  // You can find all built-in functions (min, max, clamp, reflect, normalize, etc.) 
	// and variables (gl_FragCoord, gl_Position) in the OpenGL Shading Language Specification: 
	// https://www.khronos.org/registry/OpenGL/specs/gl/GLSLangSpec.4.60.html#built-in-functions
	lightVec = normalize(lightVec);
	normalVec = normalize(normalVec);
	eyeVec = normalize(eyeVec);

	//compute diffuse term
	float diffuse = max(dot(lightVec, normalVec),0.0) ;

	//compute specular term
	vec3 reflectVec = reflect(-lightVec,normalVec);
	float spec = pow( max( dot(reflectVec, eyeVec), 0.0) , material.shininess);

	//use term an light to compute the components
	vec4 c_amb  = clamp(light.ambient * material.ambient, 0.0, 1.0);
	vec4 c_diff = clamp(diffuse * light.diffuse * material.diffuse, 0.0, 1.0);
	vec4 c_spec = clamp(spec * light.specular * material.specular, 0.0, 1.0);
	vec4 c_em   = material.emission;

	float distance = length(lightVec);
	float angle = acos(dot(normalize(lightDirVec), -lightVec));
	if (angle <=light.limit) {
		float factor = clamp ((10.0 -distance) / 10.0, 0.0, 1.0);
		return factor * (c_diff + c_spec);
	} else {
		return c_amb + c_em;
	}

	return c_amb + c_diff + c_spec + c_em;
}

void main() {

	gl_FragColor = calculateSimplePointLight(u_light, u_material, v_lightVec,v_normalVec, v_eyeVec)+
		//calculateSimplePointLight(u_light2, u_material, v_light2Vec,v_normalVec, v_eyeVec) +
		calculateSpotlight(u_spotlight0, u_material, v_spotlight0Vec, v_spotlight0DirVec, v_normalVec, v_eyeVec) +
		calculateSpotlight(u_spotlight1, u_material, v_spotlight1Vec, v_spotlight1DirVec, v_normalVec, v_eyeVec) +
		calculateSpotlight(u_spotlight2, u_material, v_spotlight2Vec, v_spotlight2DirVec, v_normalVec, v_eyeVec) +
		calculateSpotlight(u_spotlight3, u_material, v_spotlight3Vec, v_spotlight3DirVec, v_normalVec, v_eyeVec) +
		calculateSpotlight(u_spotlight4, u_material, v_spotlight4Vec, v_spotlight4DirVec, v_normalVec, v_eyeVec) +
		calculateSpotlight(u_spotlight5, u_material, v_spotlight5Vec, v_spotlight5DirVec, v_normalVec, v_eyeVec) +
		calculateSpotlight(u_spotlight6,u_material,v_spotlight6Vec,v_spotlight6DirVec,v_normalVec,v_eyeVec);
	gl_FragColor = gl_FragColor * .5;

					
}
