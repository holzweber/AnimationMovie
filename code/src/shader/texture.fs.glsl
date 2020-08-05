/**
 * a phong shader implementation with texturesupport
 * Created by Samuel Gratzl on 29.02.2016.
 * extended by Stefan Paukner and Christopher Holzweber
 */

//need to specify how "precise" float should be
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

uniform SpotLight u_spotlight0;
uniform SpotLight u_spotlight1;
uniform SpotLight u_spotlight2;
uniform SpotLight u_spotlight3;
uniform SpotLight u_spotlight4;
uniform SpotLight u_spotlight5;
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
varying vec3 v_spotlight6Vec;

varying vec3 v_spotlight0DirVec;
varying vec3 v_spotlight1DirVec;
varying vec3 v_spotlight2DirVec;
varying vec3 v_spotlight3DirVec;
varying vec3 v_spotlight4DirVec;
varying vec3 v_spotlight5DirVec;
varying vec3 v_spotlight6DirVec;
//TEXTURING
varying vec2 v_texCoord;
//uniform sampler2D u_tex;
uniform sampler2D u_tex_0;
uniform sampler2D u_tex_1;
uniform sampler2D u_tex_2;
//--------
vec4 calculateSimplePointLight(Light light, Material material, vec3 lightVec, vec3 normalVec, vec3 eyeVec, vec4 textureColor) {
	// You can find all built-in functions (min, max, clamp, reflect, normalize, etc.) 
	// and variables (gl_FragCoord, gl_Position) in the OpenGL Shading Language Specification: 
	// https://www.khronos.org/registry/OpenGL/specs/gl/GLSLangSpec.4.60.html#built-in-functions
	lightVec = normalize(lightVec);
	normalVec = normalize(normalVec);
	eyeVec = normalize(eyeVec);

	//compute diffuse term
	float diffuse = max(dot(normalVec,lightVec),0.0);

	//compute specular term
	vec3 reflectVec = reflect(-lightVec,normalVec);
	float spec = pow( max( dot(reflectVec, eyeVec), 0.0) , material.shininess);

  //set diffuse and ambient of material for texturing
	material.diffuse = textureColor;
	material.ambient = textureColor;
	//Note: an alternative to replacing the material color is to multiply it with the texture color
  

	vec4 c_amb  = clamp(light.ambient * material.ambient, 0.0, 1.0);
	vec4 c_diff = clamp(diffuse * light.diffuse * material.diffuse, 0.0, 1.0);
	vec4 c_spec = clamp(spec * light.specular * material.specular, 0.0, 1.0);
	vec4 c_em   = material.emission;
	

  return c_amb + c_diff + c_spec + c_em;
}

vec4 calculateSpotlight(SpotLight light, Material material, vec3 lightVec, vec3 lightDirVec,
																vec3 normalVec, vec3 eyeVec, vec4 textureColor) { // im vergleich zum phon texColor dabei
  // You can find all built-in functions (min, max, clamp, reflect, normalize, etc.) 
	// and variables (gl_FragCoord, gl_Position) in the OpenGL Shading Language Specification: 
	// https://www.khronos.org/registry/OpenGL/specs/gl/GLSLangSpec.4.60.html#built-in-functions
	vec3 lightVec2 = lightVec;
	lightVec = normalize(lightVec);
	normalVec = normalize(normalVec);
	eyeVec = normalize(eyeVec);

	//compute diffuse term
	float diffuse = max(dot(lightVec, normalVec),0.0) ;

	//compute specular term
	vec3 reflectVec = reflect(-lightVec,normalVec);
	float spec = pow( max( dot(reflectVec, eyeVec), 0.0) , material.shininess);
  //set diffuse and ambient of material for texturing
	material.diffuse = textureColor; // TODO ?? 
	material.ambient = textureColor;

	//use term an light to compute the components
	vec4 c_amb  = clamp(light.ambient * material.ambient, 0.0, 1.0);
	vec4 c_diff = clamp(diffuse * light.diffuse * material.diffuse, 0.0, 1.0);
	vec4 c_spec = clamp(spec * light.specular * material.specular, 0.0, 1.0);
	vec4 c_em   = material.emission;

	float distance = length(lightVec2);
	//  return vec4(1.0,1.0,1.0,1.0); // factor * (c_diff + c_spec);
	float angle = acos(dot(normalize(lightDirVec.xyz), -lightVec));
	if (angle <= light.limit) {
		float factor = clamp ((10.0 -distance) / 10.0, 0.0, 1.0);
		 vec4 light = clamp(factor * 2.0 * (c_diff + c_spec),0.0,1.0); // factor 2 for better visiblitiy
	//  return vec4(1.0,1.0,1.0,1.0); // factor * (c_diff + c_spec);
	 	return light;
		// return factor * (c_diff + c_spec);
	} else {
		return vec4(0.0,0.0,0.0,1.0); // factor * (c_diff + c_spec);
		// return c_amb + c_em;
	}

	// return c_amb + c_diff + c_spec + c_em;
}
//--------
void main (void) {

  
	//In order to perform multitexturing, we need to calculate which texel should be more visible then the other one
	//First get the texel for the actual fragment
	vec4 mainFloorTexel = texture2D(u_tex_0,v_texCoord);
	vec4 dirtyFloorTexel = texture2D(u_tex_1,v_texCoord);
	vec4 alphaFloorTexel = texture2D(u_tex_2,v_texCoord);

	//the mainflooramount calculates depending on the alphamap(look up in the textures) who much of the mainfloor
	//for the actual pixel is visible for this fragment. The alphamap is certainly black or white, but to make
	//the shpaes more smoofer, we take the average value of the texel of the alphamap. 
	float mainFloorAmount = 1.0 - (alphaFloorTexel.r+alphaFloorTexel.g+alphaFloorTexel.b)/3.0;
	mainFloorTexel = mainFloorTexel * mainFloorAmount; //calculate how much the mainfloor will be visible at the fragment
	float dirtyFloorTexelVis = 1.0-mainFloorAmount;//the rest of the 100percent visibility belongs to the second texture, 
	dirtyFloorTexel = dirtyFloorTexel * dirtyFloorTexelVis;//calculate how much the dirtyFloor will be visible at the fragment

	//putting the main and the second texture together, by simply adding it
  	gl_FragColor = dirtyFloorTexel+mainFloorTexel;
	gl_FragColor = gl_FragColor + 
	calculateSpotlight(u_spotlight0, u_material, v_spotlight0Vec, v_spotlight0DirVec, v_normalVec, v_eyeVec, gl_FragColor) +
	calculateSpotlight(u_spotlight1, u_material, v_spotlight1Vec, v_spotlight1DirVec, v_normalVec, v_eyeVec, gl_FragColor) +
	calculateSpotlight(u_spotlight2, u_material, v_spotlight2Vec, v_spotlight2DirVec, v_normalVec, v_eyeVec, gl_FragColor) +
	calculateSpotlight(u_spotlight3, u_material, v_spotlight3Vec, v_spotlight3DirVec, v_normalVec, v_eyeVec, gl_FragColor) +
	calculateSpotlight(u_spotlight4, u_material, v_spotlight4Vec, v_spotlight4DirVec, v_normalVec, v_eyeVec, gl_FragColor) +
	calculateSpotlight(u_spotlight5, u_material, v_spotlight5Vec, v_spotlight5DirVec, v_normalVec, v_eyeVec, gl_FragColor) +
	calculateSpotlight(u_spotlight6, u_material, v_spotlight6Vec, v_spotlight6DirVec, v_normalVec, v_eyeVec, gl_FragColor) ;

}


