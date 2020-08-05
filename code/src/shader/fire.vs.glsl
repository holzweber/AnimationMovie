uniform mat4 u_modelView;
uniform mat4 u_viewMatrix;
uniform mat4 u_sceneMatrix;

// uniform mat3 u_normalMatrix;
uniform mat4 u_projection; 

uniform float u_time; // actual time tick..

attribute vec2 pos; // pos of the vertex in local coordinates
attribute float startTime; // starttime of the particle
attribute vec3 pardir; // direction of the particle


varying float age;
varying vec2 texCoords;

void main() {
    age = (u_time - startTime) /1000.0+.5;  // starttime +.5 damit nicht alles aus einem punkt kommt
    vec3 b  = clamp (pardir  * age /2.0, -40.0, 40.0);

    vec4 CameraRight_worldspace = vec4(u_viewMatrix[0][0], u_viewMatrix[1][0], u_viewMatrix[2][0],0.0); // first row of the view matrix is the right vector
    vec4 CameraUp_worldspace = vec4(u_viewMatrix[0][1], u_viewMatrix[1][1], u_viewMatrix[2][1],0.0); // second row of the view matrix is the up vector of the camera

    vec4 vertexPosition_worldspace; //
    
    float size = clamp(u_sceneMatrix[0][0], 0.0 , 1.0);
    
    vec4 particleCenter_wordspace = u_sceneMatrix * vec4(0, 0 , 0 ,1);
    vertexPosition_worldspace = 
     particleCenter_wordspace   // take particle center 
    //  + vec4(b, 0.0) + vec4(sin(age*3.0*pardir.x)*.3,+ age*age*.05 ,sin(age*3.0*pardir.y)*.3,0.0)
     + vec4(b, 0.0) // do an offset with the age
     + vec4(sin(age*4.0*pardir.x)*pardir.x*.5,+ age*age*.05 ,sin(age*4.0*pardir.z)*pardir.z*.5,0.0) // do some sin effect in x and z and do age^2 movment to accellerate particles

     + CameraRight_worldspace * pos.x * size  // billboarding - rotate to the camera
     + CameraUp_worldspace * pos.y * size; // billboarding rotate to the camera

   	// vec4 eyePosition = u_modelView*vec4(pos,0,1) +  vec4(b, 0.0) + vec4(0.0,+ age*age*.05 ,0.0,0.0);
    vec4 eyePosition = u_viewMatrix *  vertexPosition_worldspace;
    vec4 x =    vec4(pos,1,1);
	
    gl_Position = u_projection * eyePosition;

    texCoords =pos *-1.0 + vec2(0.5,0.5);
}