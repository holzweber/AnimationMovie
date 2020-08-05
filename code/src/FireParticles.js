class FireParticles extends SGNode {
    constructor(textureRes, timeBetweenSpawn, maxElemntsPerSpawn, maxParticles, minAge, maxAge) {
        super([]);

        this.texture = this.getTexture(textureRes); // texture of the particle
        this.timeLastSpawn = 0; // nr of time (ms) since last spawn
        this.timeBetweenSpawn = timeBetweenSpawn; // time between two spawns
        this.maxElemntsPerSpawn = maxElemntsPerSpawn; // maximum nr of particles spawn per spawn
        this.maxParticles = maxParticles; 
        this.minAge = minAge;
        this.maxAge = maxAge;
        this.ignitionTime = -1; // fire is not burning at the beginning
    
        // every particle has a 2 triangles a startTime, a dirVec
        
        // buffer for particle vertices 
        let s=.5 // size of the flame
        let quad = [-s,-s,   s,-s,  s, s,  -s, s], quads =[];  // (4 points for 2 triangles) * max particles 
        for (let i = 0; i < this.maxParticles; i++) {
            for (let j = 0; j < 8; j++) {
                quads[i*8 + j] = quad[j];
            }
            //  quads.push(quad);
        }
        // log("quads" + quads);
        this.quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quads), gl.STATIC_DRAW);

        // index buffer
        let indices = [];  // 6 entries in index element_array_buffer to 4 elements in array_buffer
        for (let i = 0; i < this.maxParticles; i++) {
            indices.push(0 + i * 4); // first triangle
            indices.push(1 + i * 4);
            indices.push(2 + i * 4);
            indices.push(0 + i * 4); // second triangle
            indices.push(3 + i * 4);
            indices.push(2 + i * 4);
        }
        this.indexBuffer = gl.createBuffer(); // 6 element_array entries for 2 triangles - but in buffer ther are always 4 elements per quad
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        // log(indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        
        // startTimes
        this.startTimes = [];
        this.particleTimeout =[]; // if particle timeout < 0 the particle is respawned
        for (let i = 0; i < this.maxParticles; i++) {
          this.particleTimeout.push(0); // init with 0 
          this.setStartTime(i,-1); // not started yet
        }
        this.startTimesBuffer = gl.createBuffer(); // data writte to it in setBufferData_TimeDirection()

        
        // directions
        this.directions = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.setDirections(i,vec3.fromValues(0,1,0));  // set init Dir 
        }
        this.directionsBuffer = gl.createBuffer(); // data written to it in setBufferData_TimeDirection()

        
        this.setBufferData_TimeDirection();

    }

    getTexture(textureRes) {
        let texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureRes);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        //unbind and return created texture
        gl.bindTexture(gl.TEXTURE_2D, null);
        return texture;
    }

    igniteFire(ignitionTime) {
        this.ignitionTime = ignitionTime;
    }
    extinguishFire() {
        this.ignitionTime = -1;
    }

    setStartTime(ind, value) {
        for (let j = 0; j < 4; j++ ){  // 4x needed for a quad
            this.startTimes[j + 4 * ind] = value; 
        } 
    }
    setDirections(ind, dir) {
        for (let j = 0; j < 12; j++ ){  // 4x needed for a quad (3 coordinates per quad)
            // log ("dir " + dir);
            this.directions[j + 12 * ind] = dir[j%3];      

        } 
        // this.directions[0] = 1;
        // this.directions[1] = 0;
        // // this.directions[0] = 1;
        //  log("dirs " + ind + " "  + this.directions);
    }

    chekForSpawn(timeInMilliseconds) {
        if ((timeInMilliseconds - this.timeLastSpawn) > this.timeBetweenSpawn) {
            // let´s look if there are particles free to spawn
            let count = 0;
            for (let i = 0; i < this.maxParticles; i++) { 
                if (timeInMilliseconds > this.particleTimeout[i] +  this.startTimes[i*4]) {
                    let dir = this.createDirection();
                    // find new position for inserting the new direction
                    this.setStartTime(i, timeInMilliseconds);
                    this.particleTimeout[i] = this.minAge +  (Math.random() * (this.maxAge - this.minAge));
                    this.setDirections(i, dir);
                    // log("span index: "+ i + "timeout " +this.particleTimeout[i] + " dir " + dir);
                    count++;
                    if (count > this.maxElemntsPerSpawn ) {
                        break;
                    }
                }
            }
            if (count > 0) { // update buffers if spawn
                this.timeLastSpawn = timeInMilliseconds;
                this.setBufferData_TimeDirection();
            }
        }
    }
    createDirection() {
        // let speed = (Math.random() *3.0 + 7.0 ) / 10.0 // speed von .7 bis 1
        let speed = (Math.random() )
        // speed = 3.0;
        let dir = vec3.fromValues(0.0,speed,0.0);
        let zero = vec3.fromValues(0, 0, 0);
        vec3.rotateX(dir, dir, zero, (Math.random()-0.5) * Math.PI/2);
        vec3.rotateY(dir, dir, zero, (Math.random()-0.5) * Math.PI);
        // log(dir);
        return dir;
    }

    setBufferData_TimeDirection() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.startTimesBuffer);
        // log("startT Buffer Update "+ this.startTimes);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.startTimes), gl.DYNAMIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.directionsBuffer);
        // log("dir Buffer Update "+ this.directions);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.directions), gl.DYNAMIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    
    render(context) {
        if (this.ignitionTime == -1) {
            return;
        }
        this.chekForSpawn(context.timeInMilliseconds - this.ignitionTime)
        
		gl.useProgram(shaders.fire);
        
		let modelView = mat4.multiply(mat4.create(), context.viewMatrix, context.sceneMatrix);
        
		gl.uniformMatrix4fv(gl.getUniformLocation(shaders.fire, 'u_modelView'), false, modelView);
		gl.uniformMatrix4fv(gl.getUniformLocation(shaders.fire, 'u_viewMatrix'), false, context.viewMatrix); // only the view matrix for billbording
		gl.uniformMatrix4fv(gl.getUniformLocation(shaders.fire, 'u_sceneMatrix'), false, context.sceneMatrix); // only the scene matrix for billbording
		gl.uniformMatrix4fv(gl.getUniformLocation(shaders.fire, 'u_projection'), false, context.projectionMatrix);
		// log("time" + context.timeInMilliseconds);
		gl.uniform1f(gl.getUniformLocation(shaders.fire, 'u_maxage'), false, this.maxAge);
		gl.uniform1f(gl.getUniformLocation(shaders.fire, "u_time"), context.timeInMilliseconds - this.ignitionTime); // for calculation of position
        
		//set texture to sampler 0
		gl.uniform1i(gl.getUniformLocation(shaders.fire, "u_texture"), 0);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
        
		//prepare alpha blending
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.blendEquation(gl.FUNC_ADD);
        gl.enable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(false);
        
        
          // map buffers
          gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
          let posLocation = gl.getAttribLocation(shaders.fire, "pos");
          gl.enableVertexAttribArray(posLocation);
          gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 0, 0);
          
          gl.bindBuffer(gl.ARRAY_BUFFER, this.startTimesBuffer);
          let startTimeLoc = gl.getAttribLocation(shaders.fire, "startTime");
          gl.enableVertexAttribArray(startTimeLoc);
          gl.vertexAttribPointer(startTimeLoc, 1, gl.FLOAT, false, 0, 0);
          
          gl.bindBuffer(gl.ARRAY_BUFFER, this.directionsBuffer);
          let dirLocation = gl.getAttribLocation(shaders.fire, "pardir");
          // log(this.directions[0])
          gl.enableVertexAttribArray(dirLocation);
          gl.vertexAttribPointer(dirLocation, 3, gl.FLOAT, false, 0, 0);
          
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
          // log("rnder " + this.maxParticles);
          // log("this.max " + this.maxParticles *6);
          gl.drawElements(gl.TRIANGLES, this.maxParticles * 6, gl.UNSIGNED_SHORT, 0); // draw
          //  gl.drawElements(gl.TRIANGLES, this.maxParticles * 3, gl.UNSIGNED_SHORT, 0); // draw
          //  gl.drawElements(gl.TRIANGLES, this.maxParticles * 3, gl.UNSIGNED_SHORT, this.maxParticles * 3); // draw
          
          // gl.disable(gl.BLEND);
            gl.depthMask(true);
          // gl.bindBuffer(null);
          
          // restore
		if(context.shader) gl.useProgram(context.shader);
	}

}