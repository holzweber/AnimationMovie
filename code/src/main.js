/**
 * Date: 12.06.2020
 * Template given by the CG Insitiute of JKU Linz
 * Created by Christopher Holzweber and Stefan Paukner
 */

/**
 * the OpenGL context
 * @type {WebGLRenderingContext}
 */
//Basics globals
var gl = null;
var root = null;
//light depending
var rotateLight, rotateLight2, rotateNode;
//texturing
var mainfloor;
//fish movement
var fishTransformationNode1; //node of the first fish
var fishTransformationNode2; //node of the second fish
var rotateFishDegrees = 8; //per render rotate 
var fishjump = false; //set to true, when fish should rotate around the ship
var rootTravelNode; //used to render the travelling ship
var rootTravelNode_texture; //used to render spotlight of the torch 
var totaltimebefore = 0;

//torch
var torchfalldown = false;
var torchheight = 6.0;
var oldtorchMatrix;
var torchFlameTransformationSGNode;
//ship movement
//change the velocity of the boat
var travelfactor = 0.015;
//variables for performing jump and roll
var launchflight = false; //just for testing set to true, if true -> we are jump over an obstacle
var rotateShip = false; //get set after launch of the ship in order to roll 360 degrees
var jumpheight = 1; //here the height value of the object during the jump is stored
var rotateDegrees = 8; //per render process and during the jump, the boat get rotated 8 degrees
var falldown = false; //set after the rotation, the ship goes down to the floor again
var fireTime = false; //sets ship on fire
//here it is set, on which street the ship is driving currently.
var apshalt1road = true; //set again to true, when jump and roll is done
var waterroad = false;
var asphalt2road = false;
var asphalt3road = false;

//travelling distances on eeach road
var aphalt1distance = -60.0;
var waterroaddistance = -60.0;
var asphalt2roaddistance = 60;
var cb1TimeStart = 0;
asphalt3roaddistance = 60;
//creating camera 
const camera = {
  rotation: {
    x: 112, //-30
    y: 0
  },
  position: {
    x: -20, //-60 zum testen,
    y: 5,
    z: 20 // 10  zum testen
  },
  view: {
    x: 60,
    y: 0,
    z: -60
  }
};
var predPos = [ // test predefined camera settings, when pressing E you can switch to
  //rotation x, rotation y,  posx, posy, posz
  [282, 21, -30, 5, -62.5, "Feuer anschauen näher"], // startpos
  [270, 8, -2, 5, -60, "Feuer anschauen"], // startpos
  [118, 13, 38, 5, -42, "laterne anschauen näher"], // startpos
  [90, 8, -2, 5, -60, "Treffer anschauen"], // ca beginn schaut richtung kanone 
  [11, 3, 26, 5, -14, "Treffer anschauen"], // ca beginn schaut richtung kanone 
  [95, 4, -47, 5, -49, "ca Beginn schaut richtung Kanone"], // ca beginn schaut richtung kanone 
  [44, 7, 28, 5, -32, "Schaut seitlich auf die kanone"],
  [113.2, 27, 33.85, 5, -43.55, "Schaut in die Kanone"],
  [93, 7, 6, 5, -40, "Steht vor der Kanone"], // steht vor der kanone
  [82, 3, -44, 5, -43, "ca Beginn schaut richtung Kanone"] // ca beginn schaut richtung kanone 
];
predPosInd = 0; // index for the camera settings

var laterns = [ // the positions of the latern
  {x: 55, y: 0, z:0,   ind:0, rot: -90},
  {x: 65, y: 0, z:0,   ind:1, rot: 90},
  {x: 55, y: 0, z:30,  ind:2, rot: -90},
  {x: 65, y: 0, z:30,  ind:3, rot: 90},
  {x: 55, y: 0, z:-30, ind:4, rot: -90},
  {x: 65, y: 0, z:-30, ind:5, rot: 90}
];

//activate autoflightmode is true at beginning
var flightmode = true;
let shaders = {};
let fire,fire2;
//load the shader resources using a utility function
loadResources({
  vs: './src/shader/phong.vs.glsl',
  fs: './src/shader/phong.fs.glsl',
  vs_single: './src/shader/single.vs.glsl',
  fs_single: './src/shader/single.fs.glsl',
  vs_texture: './src/shader/texture.vs.glsl',
  fs_texture: './src/shader/texture.fs.glsl',
  vs_fire: './src/shader/fire.vs.glsl',
  fs_fire: './src/shader/fire.fs.glsl',

  model: './src/models/pirate_ship.obj',
  wheel: './src/models/wheel.obj',
  ramp: './src/models/ramp.obj',
  cannon: './src/models/cannon.obj',
  latern: './src/models/latern.obj',
  cloud: './src/models/cloud.obj',
  tree: './src/models/lowpolytree.obj',
  rock: './src/models/rock.obj',
  mainfloor: './src/textures/grass.jpg',
  asphaltfloor: './src/textures/asphalt.jpg',
  waterfloor: './src/textures/water.jpg',
  alphamapfloor: './src/textures/alphamap.jpg',
  alphamapfire: './src/textures/circle2.jpg',
  dirtfloor: './src/textures/dirt.jpg',
  fishskin: './src/textures/fishskin.jpg',
  flametexture: './src/textures/fire.jpg',
  flameobject: './src/models/flame.obj',
  woodentexture: './src/textures/wood.jpg',
  torch: './src/models/torch.obj',
  woodsticktexture: './src/textures/woodstick.jpg',
  woodstick: './src/models/woodstick.obj',
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  render(0);
});

function init(resources) {
  //create a GL context
  gl = createContext();

  //enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);

  root = createSceneGraph(gl, resources);
  initInteraction(gl.canvas);
}

function createSceneGraph(gl, resources) {

  // create shaders
  shaders.fire= createProgram(gl, resources.vs_fire, resources.fs_fire);
  shaders.phong = createProgram(gl, resources.vs, resources.fs);
  shaders.texture = createProgram(gl, resources.vs_texture, resources.fs_texture);
  //create scenegraph
  const root = new ShaderSGNode(shaders.phong);
  
  fire = createFireNode(-32.0, 1.75, -60.5, 2.0); // fire on the boat
  fire2 = createFireNode(0.0, 1.0, 0.0, 2.0); // fire on the grass


  // root.append(fire);
  
  function createFireNode(x,y,z,size=1.0) {
    let fireN = new FireParticles(resources.alphamapfire, 10, 20, 100, 100 ,5000); 
    fireTransM = mat4.create();
    fireTransM = mat4.multiply(mat4.create(), fireTransM, glm.translate(x,y,z));
    fireTransM = mat4.multiply(mat4.create(), fireTransM, glm.scale(.15*size ,.15*size ,.15*size));
    fireTransM = mat4.multiply(mat4.create(), fireTransM, glm.translate(0.5, 0.5, 0.0)); // matrix
    fireTransN = new TransformationSGNode(fireTransM, [fireN]) // node
    return  fireTransN ;
    
  }
  
  function createLightSphere() {
    return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [
      new RenderSGNode(makeSphere(.2, 10, 10))
    ]);
  }
  
  {
    //create white light node at [0, 2, 2]
    let light = new LightNode();
    light.ambient = [1, 1, 1, 1];
    light.diffuse = [1, 1, 1, 1];
    light.specular = [1, 1, 1, 1];
    light.position = [0, 25, 2];
    light.append(createLightSphere()); //in order to see the light while rendering
    rotateLight = new TransformationSGNode(mat4.create(), [light]); //will be fixed in our case
    root.append(rotateLight);
  }
  
   // create laterns 
    
    function createSpotLight(i, light=true) {
      let spotlight = new SpotLightNode();
      spotlight.uniform = 'u_spotlight' + i;
      spotlight.ambient = [0.15, 0.15, 0.15, 1];
      spotlight.diffuse = [.25, .25, .25, .25];
      spotlight.specular = [.75, .75, .75, 1];
      spotlight.position = [0, 5.6, -1.5];
      if (light) {
        spotlight.append(createLightSphere())
      }
      return spotlight;
      
    }
    {
    function createLatern(p) { // parameter latern pos and dir (x,y,z, index rot ) ( index for shader)
      let node = new SGNode();
      let latern = new MaterialNode([new RenderSGNode(resources.latern)]);
      latern.ambient = [0.24725, 0.1995, 0.0745, 1];
      latern.diffuse = [0.75164, 0.60648, 0.22648, 1];
      latern.specular = [0.628281, 0.555802, 0.366065, 1];
      latern.shininess = 1;
      laternTransM = mat4.create();
      laternTransM = mat4.multiply(mat4.create(), laternTransM, glm.translate(p.x, p.y, p.z));
      laternTransM = mat4.multiply(mat4.create(), laternTransM, glm.rotateY(p.rot));
      laternPosNode = new TransformationSGNode(laternTransM, [latern]);
      // node.append(createLaternSpotLightNode(p));
      node.append(laternPosNode);
      return node;
    }
    
    function createAndAppendLaternSpotLightNodes(node) { // appends to to parameter node..
      laterns.forEach((p, index, arr) => {
        laternTransM = mat4.create();
        laternTransM = mat4.multiply(mat4.create(), laternTransM, glm.translate(p.x, p.y, p.z));
        laternTransM = mat4.multiply(mat4.create(), laternTransM, glm.rotateY(p.rot));
        node.append(new TransformationSGNode(laternTransM, createSpotLight(p.ind))); // laternindex for uniform
      }
      );
    }
    
    //put lanterns to the 3road, the latern road
    createAndAppendLaternSpotLightNodes(root);
    root.append(createLatern(laterns[0]));
    root.append(createLatern(laterns[1]));
    root.append(createLatern(laterns[2]));
    root.append(createLatern(laterns[3]));
    root.append(createLatern(laterns[4]));
    root.append(createLatern(laterns[5]));
      
  }

  {
    //create clouds
    var cloudAmount = 80;
    var cloudHeight = 12;
    var clouds = [];
    var cloudTrans = [];
    for (i = 0; i < cloudAmount; i++) {
      clouds[i] = new MaterialNode([new RenderSGNode(resources.cloud)]);
      //Perl material
      clouds[i].ambient = [0.25, 0.20725, 0.20725, 0.922];
      clouds[i].diffuse = [1.0, 0.829, 0.829, 0.922];
      clouds[i].specular = [0.296648, 0.296648, 0.296648, 0.922];
      clouds[i].shininess = 11.264;

      cloudTrans[i] = new TransformationSGNode(glm.transform({ translate: [Math.random() * 160 - 80, cloudHeight, Math.random() * 160 - 80], scale: 1.2 }), [
        clouds[i]
      ]);
      root.append(cloudTrans[i]);
    }
  }
  {
    //create trees
    var treeAmount = 60;
    var treeHeight = 1.5;
    var trees = [];
    var treeTrans = [];
    for (i = 0; i < treeAmount; i++) {
      trees[i] = new MaterialNode([new RenderSGNode(resources.tree)]);
      //green plastic
      trees[i].ambient = [0.0, 0.0, 0.0, 1.0];
      trees[i].diffuse = [0.1, 0.35, 0.1, 1.0];
      trees[i].specular = [0.45, 0.55, 0.45, 1.0];
      trees[i].shininess = 32.0;

      treeTrans[i] = new TransformationSGNode(glm.transform({ translate: [Math.random() * 80 - 40, treeHeight, Math.random() * 80 - 40], scale: 1.2 }), [
        trees[i]
      ]);
      root.append(treeTrans[i]);
    }
  }
  //create some rocks
  {
    //createrocks
    var rockAmount = 40;
    var rockHeight = 0.5;
    var rocks = [];
    var rockTrans = [];
    for (i = 0; i < rockAmount; i++) {
      rocks[i] = new MaterialNode([new RenderSGNode(resources.rock)]);
      rocks[i].ambient = [0.19225, 0.19225, 0.19225, 1.0];
      rocks[i].diffuse = [0.50754, 0.50754, 0.50754, 1.0];
      rocks[i].specular = [0.508273, 0.508273, 0.508273, 1.0];
      rocks[i].shininess = 51.2;

      rockTrans[i] = new TransformationSGNode(glm.transform({ rotateX: Math.random() * 180 - 90, rotateY: Math.random() * 180 - 90, rotateZ: Math.random() * 180 - 90, translate: [Math.random() * 80 - 40, rockHeight, Math.random() * 80 - 40], scale: 0.006 }), [
        rocks[i]
      ]);
      root.append(rockTrans[i]);
    }
  }
  {
    //create cannon on the last road
    let cannon = new MaterialNode([new RenderSGNode(resources.cannon)]);

    cannon.ambient = [0.24725, 0.1995, 0.0745, 1];
    cannon.diffuse = [0.75164, 0.60648, 0.22648, 1];
    cannon.specular = [0.628281, 0.555802, 0.366065, 1];
    cannon.shininess = 50;


    cannonTransM = mat4.create();
    cannonTransM = mat4.multiply(mat4.create(), cannonTransM, glm.translate(40, 0, -40));
    cannonTransM = mat4.multiply(mat4.create(), cannonTransM, glm.scale(1, 1, 1));
    cannonTransM = mat4.multiply(mat4.create(), cannonTransM, glm.rotateY(130));

    let cb = new MaterialNode([new RenderSGNode(makeSphere(.2, 10, 10))]); // make cannon ball
    cb.ambient = [0.24725, 0.1995, 0.0745, 1];
    cb.diffuse = [0.75164, 0.60648, 0.22648, 1];
    cb.specular = [0.628281, 0.555802, 0.366065, 1];
    cb.shininess = 50;
    cbTransM = mat4.create();
    cbTransM = mat4.multiply(mat4.create(), cbTransM, glm.translate(3.5, 4.7, 0));
    cbTransM = mat4.multiply(mat4.create(), cbTransM, glm.scale(1, 1, 1));
    moveCbNode = new TransformationSGNode(mat4.create(), [
      new TransformationSGNode(cbTransM, [cb])
    ]);
    moveCbNode.speed = 7.4;

    //TODO positon cannon on right place
    posCannonNode = new TransformationSGNode(mat4.create(), [
      new TransformationSGNode(cannonTransM, [
        cannon, moveCbNode
      ])
    ]);
    root.append(posCannonNode);
  }
  rootTravelNode = new TransformationSGNode(glm.transform({ translate: [60, 0, -60] })); //rootNode for traveller
  rootTravelNode_texture = new TransformationSGNode(glm.transform({ translate: [60, 0, -60] })); //rootNode for traveller  for spotlight
  root.append(rootTravelNode);

  {
    //creates the moving lightsource, it should have a yellow light colour because of the fire
    let torch = createSpotLight(6,false);
    torch.ambient = [.5, .5, 0, 1]; //set color to look more yellow
    torch.diffuse = [1, 1, 0, 1];
    torch.specular = [1, 1, 0, 1];
    torch.position = [0, 6.5, -1];

    TorchTransformationNode = new TransformationSGNode(mat4.create(), [torch]);

    rootTravelNode.append(TorchTransformationNode);
    rootTravelNode_texture.append(TorchTransformationNode);
  }

  {
    //create golden ramp
    let ramp = new MaterialNode([new RenderSGNode(resources.ramp)]);

    ramp.ambient = [0.24725, 0.1995, 0.0745, 1];
    ramp.diffuse = [0.75164, 0.60648, 0.22648, 1];
    ramp.specular = [0.628281, 0.555802, 0.366065, 1];
    ramp.shininess = 50;
    //scale and translate the pirateship to proper size and place
    rampTransformationNode = new TransformationSGNode(glm.transform({ rotateX: -90, rotateZ: -90, translate: [-62.5, 0, 10], scale: 0.045 }), [
      ramp
    ]);
    root.append(rampTransformationNode);
  }
  {
    //create golden pirateship
    let pirateship = new MaterialNode([new RenderSGNode(resources.model)]);
    
    pirateship.ambient = [0.24725, 0.1995, 0.0745, 1];
    pirateship.diffuse = [0.75164, 0.60648, 0.22648, 1];
    pirateship.specular = [0.628281, 0.555802, 0.366065, 1];
    pirateship.shininess = 50;

    //scale and translate the pirateship to proper size and place
    shipTransformationNode = new TransformationSGNode(glm.transform({ translate: [0, 0.5, 0], scale: 0.1 }), [
      pirateship
    ]);
    rootTravelNode.append(shipTransformationNode);
  }

  {
    //create golden wheels of the pirateship
    let wheel = new MaterialNode([new RenderSGNode(resources.wheel)]);

    wheel.ambient = [0.24725, 0.1995, 0.0745, 1];
    wheel.diffuse = [0.75164, 0.60648, 0.22648, 1];
    wheel.specular = [0.628281, 0.555802, 0.366065, 1];
    wheel.shininess = 50;
    //scale and translate the pirateship to proper size and place
    wheelRotate = new TransformationSGNode(new mat4.create(), [wheel]);
    wheelTransformationNode = new TransformationSGNode(glm.transform({ translate: [0, .7, 2], scale: 0.1 }), [wheelRotate]);
    rootTravelNode.append(wheelTransformationNode);
    wheelTransformationNode2 = new TransformationSGNode(glm.transform({ translate: [0, .7, -1.5], scale: 0.1 }), [wheelRotate]);
    rootTravelNode.append(wheelTransformationNode2);
  }

  //fireplace in the forest
  {
    let woodstickTextureShader = new ShaderSGNode(shaders.texture);
    let woodstickNode = 
    new AdvancedTextureSGNode(resources.woodsticktexture,new MaterialNode([new RenderSGNode(resources.woodstick)]));
    woodstickTextureShader.append(woodstickNode); 

    root.append(woodstickTextureShader);
  }
  //create torch on ship
  {
    let torchTextureShader = new ShaderSGNode(shaders.texture);
    rootTravelNode.append(torchTextureShader);
    torchheight = 6.0;

    let flameNode =  new TransformationSGNode(glm.transform({ rotateX: -90, translate: [0, 1.5, 0], scale: 0.8}),
    new AdvancedTextureSGNode(resources.flametexture,new MaterialNode([new RenderSGNode(resources.flameobject)])));

    let flameHolderNode = new TransformationSGNode(glm.transform({ rotateX: -90, translate: [0, 0, 0], scale: 0.8}),
    new AdvancedTextureSGNode(resources.woodentexture,new MaterialNode([new RenderSGNode(resources.torch)])));

    torchFlameTransformationSGNode = new TransformationSGNode(glm.transform({ rotateX: 0, translate: [0, 6.0, -1], scale: 0.4 }), [
      flameNode,flameHolderNode
    ]);

    oldtorchMatrix = torchFlameTransformationSGNode.matrix; //stores the original value, for later reset
    torchTextureShader.append(torchFlameTransformationSGNode);
  }
  let fishShader = new ShaderSGNode(createProgram(gl, resources.vs_texture, resources.fs_texture));
  shipTransformationNode.append(fishShader);
  //create fish
  {
    fishTransformationNode1 = new TransformationSGNode();
    let fishNode1 = new AdvancedTextureSGNode(resources.fishskin,new MaterialNode([new RenderSGNode(makeFish())]));

    //scale and translate the pirateship to proper size and place
    fishTransformationNode1 = new TransformationSGNode(glm.transform({ rotateY: 90, translate: [40, -1000, 0], scale: 5 }), [
      fishNode1
    ]);

    fishShader.append(fishTransformationNode1);

    fishTransformationNode2 = new TransformationSGNode();

    let fishNode2 = new AdvancedTextureSGNode(resources.fishskin,new MaterialNode([new RenderSGNode(makeFish())]));

    //scale and translate the pirateship to proper size and place
    fishTransformationNode2 = new TransformationSGNode(glm.transform({ rotateY: 90, translate: [-40, -1000, 0], scale: 5 }), [
      fishNode2
    ]);

    fishShader.append(fishTransformationNode2);
  }
  //create captain of ship
  {

    captainTransformationNode = createCaptain();
    shipTransformationNode.append(captainTransformationNode);

  }
  //textureshader init
  let shader = new ShaderSGNode(createProgram(gl, resources.vs_texture, resources.fs_texture));
  createAndAppendLaternSpotLightNodes(shader);
  shader.append(rootTravelNode_texture);
  root.append(
    shader
  );
  root.append(fire); //appends the both particle systems
  root.append(fire2);
  //mainfloor
  var rectFloor = makeRect();
  rectFloor.texture = [0, 0,   10, 0,   10, 10,   0, 10];

  //create ground of linz
  {
    /*
    * The floor will be multitextured in our program. Therefore, we need three actual Textures
    *  1st is the main foor texture -> the grass
    * 2nd is the dirtyfloor texture
    * 3rd is the alphamap, which descides which texel should be more visible at each fragment
    */
    let floor = new TransformationSGNode(glm.transform({ translate: [0, -0.1, 0], rotateX: -90, scale: 100 }), [
                  new MaterialSGNode(
                  new MultiTextureSGNode(resources.alphamapfloor,2,
                  new MultiTextureSGNode(resources.dirtfloor,1,
                  new MultiTextureSGNode(resources.mainfloor,0, //index 0 with textureunit 0
                  new RenderSGNode(rectFloor))
                  )))]);

    //add the multitextured floor to the texture shader
    shader.append(floor);

  //create water way which is road 2
   var waterTexture = new AdvancedTextureSGNode(resources.waterfloor);
   //waterTexture.uniform = 'u_tex'; //does not work
   waterTexture.append(new MaterialSGNode(new RenderSGNode(rectFloor)));
   let waterway  = new TransformationSGNode(glm.transform({ translate: [0, 0.1, 60], rotateZ: 90, rotateX: -90, scale: [8, 68, 1] }), [
    waterTexture
   ]);
    
   shader.append(waterway);
  //create asphalt for road 1
    let asphalt1 = new MaterialSGNode(
                    new AdvancedTextureSGNode(resources.asphaltfloor,
                    new RenderSGNode(rectFloor))
                    );
    shader.append(new TransformationSGNode(glm.transform({ translate: [60, 0.011, 0], rotateX: -90, scale: [8, 69, 1] }), [
                     asphalt1
    ]));
  }
  //create asphalt for road 3
  {
    let asphalt2 =  new MaterialSGNode(
                    new AdvancedTextureSGNode(resources.asphaltfloor,
                    new RenderSGNode(rectFloor))
                    );
    shader.append(new TransformationSGNode(glm.transform({ translate: [-60, 0.013, 0], rotateX: -90, scale: [8, 69, 1] }), [
      asphalt2
    ]));
  }
  //create asphalt for road 4
  {
    let asphalt3 = new MaterialSGNode(
                    new AdvancedTextureSGNode(resources.asphaltfloor,
                    new RenderSGNode(rectFloor))
                    );
       shader.append(new TransformationSGNode(glm.transform({ translate: [0, 0.013, -60], rotateZ: 90, rotateX: -90, scale: [8, 68, 1] }), [
      asphalt3
    ]));
  }

  return root;
}
/**
 * Here our complex Object, a fish is created
 * This function will return a model of the complex handcraftet object
 * @returns {ISGModel}
 */
function makeFish() {
  var position = [
    -1.0, 0.0, 0.0, //0
    -0.5, 0.5, 0.0, //1
    -0.5, 0.0, -0.5, //2
    -0.5, -0.5, 0.0, //3
    0.0, 0.0, -1.0, //4
    0.0, 0.5, 0.0, //5
    0.0, -0.5, 0.0, //6
    0.6, 0.4, 0.0,//7
    1.0, 0.0, 0.0,//8
    1.0, 0.0, 0.0,//9 -- first front
    -0.5, 0.0, 0.5,//10
    0.0, 0.0, 1.0,//11
    -0.25, 0.25, -0.4,//12
    0.25, 0.25, -0.4,//13
    0.0, 0.0, -3.0,//14
    -0.25, 0.25, 0.4,//15
    0.25, 0.25, 0.4,//16
    0.0, 0.0, 3.0,//17
    1.5, 0.5, -1.5,//18
    1.5, 0.5, 1.5,//19
    1.5, -0.5, -1.5, //20
    1.5, -0.5, 1.5//21

  ];
  var normal = [-0.25, 0.25, -0.25, -0.25, 0.25, -0.25, -0.25, 0.25, -0.25,//T1
    0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25,//T2
    0.25, -0.25, 0.25, 0.25, -0.25, 0.25, 0.25, -0.25, 0.25,//T3
    0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25,//T4
    0.0, -0.5, 0.25, 0.0, -0.5, 0.25, 0.0, -0.5, 0.25,//T5
    0.0, -0.5, -0.25, 0.0, -0.5, -0.25, 0.0, -0.5, -0.25,//T6
  -0.1, -0.6, 0.3, -0.1, -0.6, 0.3, -0.1, -0.6, 0.3,//T7
    0.4, 0.4, -0.4, 0.4, 0.4, -0.4, 0.4, 0.4, -0.4,//T8
  -0.1, 0.6, 0.3, -0.1, 0.6, 0.3, -0.1, 0.6, 0.3,//T9
  -0.4, 0.4, 0.4, -0.4, 0.4, 0.4, -0.4, 0.4, 0.4,//T10
    0.25, -0.25, -0.25, 0.25, -0.25, -0.25, 0.25, -0.25, -0.25,//T11
  -0.25, -0.25, 0.25, -0.25, -0.25, 0.25, -0.25, -0.25, 0.25,//T12
  -0.25, 0.25, 0.25, -0.25, 0.25, 0.25, -0.25, 0.25, 0.25,//T13
  -0.25, -0.25, 0.25, -0.25, -0.25, 0.25, -0.25, -0.25, 0.25,//T14
    0.0, 0.5, 0.25, 0.0, 0.5, 0.25, 0.0, 0.5, 0.25,//T15
    0.0, 0.5, -0.25, 0.0, 0.5, -0.25, 0.0, 0.5, -0.25,//T16
    0.1, 0.6, 0.3, 0.1, 0.6, 0.3, 0.1, 0.6, 0.3,//T17
  -0.4, -0.4, -0.4, -0.4, -0.4, -0.4, -0.4, -0.4, -0.4,//T18
    0.1, -0.6, 0.3, 0.1, -0.6, 0.3, 0.1, -0.6, 0.3,//T19
    0.4, -0.4, 0.4, 0.4, -0.4, 0.4, 0.4, -0.4, 0.4,//T20
    0.0, 1.3, -0.125, 0.0, 1.3, -0.125, 0.0, 1.3, -0.125,//T21
    0.0, -1.3, -0.125, 0.0, -1.3, -0.125, 0.0, -1.3, -0.125,//T22
    1.5, -1.5, 0.0, 1.5, -1.5, 0.0, 1.5, -1.5, 0.0,//T23
  -1.5, -1.5, 0.0, -1.5, -1.5, 0.0, -1.5, -1.5, 0.0//T24
  ]; //creating normal vektors for each vertex
  var texsize = 1.75;
  var texture = [0, texsize*0.5 , /**/texsize*0.25,texsize, /**/ texsize*0.25, texsize*0.5 , 
                  texsize*0.25, 0, /**/texsize*0.5 ,texsize*0.5 , /**/ texsize*0.5, texsize,
                  texsize*0.5, 0 , /**/texsize*0.75,texsize*0.7, /**/ texsize*0.75, texsize*0.3,
                  texsize, texsize*0.5 , /*first side*/texsize*0.25,texsize, /**/ texsize*0.25, 0,/*second side */
                  0, texsize*0.5 , /**/texsize*0.25,texsize, /**/ texsize*0.25, texsize*0.5 ,
                  0, texsize*0.5 , /**/texsize*0.25,texsize, /**/ texsize*0.25, texsize*0.5 ,
                  0, texsize*0.5 , /**/texsize*0.25,texsize, /**/ texsize*0.25, texsize*0.5 ,
                  0, texsize*0.5 
  ];
  var index = [0, 1, 2,
    0, 3, 2,
    1, 2, 4,
    2, 3, 4,
    1, 4, 5,
    3, 4, 6,
    5, 4, 7,
    4, 7, 9,
    4, 6, 8,
    4, 8, 9,
    0, 1, 10,
    0, 3, 10,
    1, 10, 11,
    10, 3, 11,
    1, 11, 5,
    3, 11, 6,
    5, 11, 7,
    13, 7, 9,
    11, 6, 8,
    11, 8, 9,
    12, 13, 14,
    15, 16, 17,
    9, 18, 19,
    9, 20, 21]; //indices used to create the fish 
  return {
    position: position,
    normal: normal,
    texture: texture,
    index: index
  };
}

/**
 * returns the model of a new cube of the given width or default value
 * @param width
 * @returns {ISGModel}
 */
function makeCube(width) {
  s = width || 2;

  var position = [-s, -s, -s, s, -s, -s, s, s, -s, -s, s, -s,
  -s, -s, s, s, -s, s, s, s, s, -s, s, s,
  -s, -s, -s, -s, s, -s, -s, s, s, -s, -s, s,
    s, -s, -s, s, s, -s, s, s, s, s, -s, s,
  -s, -s, -s, -s, -s, s, s, -s, s, s, -s, -s,
  -s, s, -s, -s, s, s, s, s, s, s, s, -s];

  //always unit vectors
  var normal = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0
  ];
  //texture of cube
  var texture = [0, 0 /**/, 1, 0 /**/, 1, 1 /**/, 0, 1];
  var index = [0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23];

  return {
    position: position,
    normal: normal,
    texture: texture,
    index: index
  };
}
/**
 * This function created the plastic captain of the ship
 */
function createCaptain() {

  var captainTransformationNode = new TransformationSGNode();

  //body of captain
  //body consists of cube
  let bodyNode = new MaterialNode([new RenderSGNode(makeCube())]);

  //material setting for body - Red plastic
  bodyNode.ambient = [0.0, 0.0, 0.0, 1.0];
  bodyNode.diffuse = [0.5, 0.0, 0.0, 1.0];
  bodyNode.specular = [0.7, 0.6, 0.6, 1.0];
  bodyNode.shininess = 32.0;

  //scale and translate the pirateship to proper size and place
  bodyTransformationNode = new TransformationSGNode(glm.transform({ translate: [0, 15, 0], scale: [2, 3, 1] }), [
    bodyNode
  ]);
  captainTransformationNode.append(bodyTransformationNode);



  //head of captain
  let headNode = new MaterialNode([new RenderSGNode(makeCube())]);

  //material setting for head - Yellow  plastic
  headNode.ambient = [0.0, 0.0, 0.0, 1.0];
  headNode.diffuse = [0.5, 0.5, 0.0, 1.0];
  headNode.specular = [0.60, 0.60, 0.50, 1.0];
  headNode.shininess = 32.0;

  headTransformationNode = new TransformationSGNode(glm.transform({ translate: [0, 23, 0], scale: [1, 1, 1] }), [
    headNode
  ]);
  captainTransformationNode.append(headTransformationNode);

  //left tshirt-end of captain
  let leftTshirtEndNode = new MaterialNode([new RenderSGNode(makeCube())]);
  //material setting for tshirt - red  plastic
  leftTshirtEndNode.ambient = [0.0, 0.0, 0.0, 1.0];
  leftTshirtEndNode.diffuse = [0.5, 0.0, 0.0, 1.0];
  leftTshirtEndNode.specular = [0.7, 0.6, 0.6, 1.0];
  leftTshirtEndNode.shininess = 32.0;

  leftTshirtEndransformationNode = new TransformationSGNode(glm.transform({ translate: [-5, 19, 0], scale: [0.5, 1, 0.5] }), [
    leftTshirtEndNode
  ]);
  captainTransformationNode.append(leftTshirtEndransformationNode);

  //CREATING Transformation Node, which will be the fighting arm
  fightArm = new TransformationSGNode();

  //TSHIRT ENDS AT arms
  //right tshirt-end of captain
  let rightTshirtEndNode = new MaterialNode([new RenderSGNode(makeCube())]);
  //material setting for tshirt - red  plastic
  rightTshirtEndNode.ambient = [0.0, 0.0, 0.0, 1.0];
  rightTshirtEndNode.diffuse = [0.5, 0.0, 0.0, 1.0];
  rightTshirtEndNode.specular = [0.7, 0.6, 0.6, 1.0];
  rightTshirtEndNode.shininess = 32.0;

  rightTshirtEndransformationNode = new TransformationSGNode(glm.transform({ translate: [5, 19, 0], scale: [0.5, 1, 0.5] }), [
    rightTshirtEndNode
  ]);
  // captainTransformationNode.append(rightTshirtEndransformationNode);



  //ARMS
  //rightarm of captain
  let rightArmNode = new MaterialNode([new RenderSGNode(makeCube())]);
  //material setting for arm - Yellow  plastic
  rightArmNode.ambient = [0.0, 0.0, 0.0, 1.0];
  rightArmNode.diffuse = [0.5, 0.5, 0.0, 1.0];
  rightArmNode.specular = [0.60, 0.60, 0.50, 1.0];
  rightArmNode.shininess = 32.0;

  rightArmTransformationNode = new TransformationSGNode(glm.transform({ translate: [5, 14, 0], scale: [0.5, 1.8, 0.5] }), [
    rightArmNode
  ]);
  //captainTransformationNode.append(rightArmTransformationNode);

  //leftarm of captain
  let leftArmNode = new MaterialNode([new RenderSGNode(makeCube())]);
  //material setting for arm - Yellow  plastic
  leftArmNode.ambient = [0.0, 0.0, 0.0, 1.0];
  leftArmNode.diffuse = [0.5, 0.5, 0.0, 1.0];
  leftArmNode.specular = [0.60, 0.60, 0.50, 1.0];
  leftArmNode.shininess = 32.0;

  leftArmTransformationNode = new TransformationSGNode(glm.transform({ translate: [-5, 14, 0], scale: [0.5, 1.8, 0.5] }), [
    leftArmNode
  ]);
  captainTransformationNode.append(leftArmTransformationNode);

  //rightleg of captain
  let rightLegNode = new MaterialNode([new RenderSGNode(makeCube())]);
  //material setting for arm - black  plastic
  rightLegNode.ambient = [0.0, 0.0, 0.0, 1.0];
  rightLegNode.diffuse = [0.01, 0.01, 0.01, 1.0];
  rightLegNode.specular = [0.50, 0.50, 0.50, 1.0];
  rightLegNode.shininess = 32.0;

  rightLegTransformationNode = new TransformationSGNode(glm.transform({ translate: [2.5, 4, 0], scale: [0.7, 3, 0.5] }), [
    rightLegNode
  ]);
  captainTransformationNode.append(rightLegTransformationNode);

  //rightleg of captain
  let leftLegNode = new MaterialNode([new RenderSGNode(makeCube())]);
  //material setting for arm - black  plastic
  leftLegNode.ambient = [0.0, 0.0, 0.0, 1.0];
  leftLegNode.diffuse = [0.01, 0.01, 0.01, 1.0];
  leftLegNode.specular = [0.50, 0.50, 0.50, 1.0];
  leftLegNode.shininess = 32.0;

  leftLegTransformationNode = new TransformationSGNode(glm.transform({ translate: [-2.5, 4, 0], scale: [0.7, 3, 0.5] }), [
    leftLegNode
  ]);
  captainTransformationNode.append(leftLegTransformationNode);

  //sword
  let swordNode = new MaterialNode([new RenderSGNode(makeCube())]);
  //material setting for sword - //Silver
  swordNode.ambient = [0.19225, 0.19225, 0.19225, 1.0];
  swordNode.diffuse = [0.50754, 0.50754, 0.50754, 1.0];
  swordNode.specular = [0.508273, 0.508273, 0.508273, 1.0];
  swordNode.shininess = 51.2;
  swordTransformationNode = new TransformationSGNode(glm.transform({ rotateX: 60, translate: [0, 0.8, 4], scale: [0.7, 2, 0.5] }), [
    swordNode
  ]);
  rightArmTransformationNode.append(swordTransformationNode);

  fightArm.append(rightTshirtEndransformationNode);
  fightArm.append(rightArmTransformationNode);
  captainTransformationNode.append(fightArm);

  return captainTransformationNode

}
/**
 * This function is used to init keymovements in the scene given in the specification.
 * This is only possible after 30sec flightmode of the scene!
 * @param {} canvas 
 */
function initInteraction(canvas) {
  const mouse = {
    pos: { x: 0, y: 0 },
    leftButtonDown: false
  };
  function toPos(event) {
    //convert to local coordinates
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
  canvas.addEventListener('mousedown', function (event) {
    mouse.pos = toPos(event);
    mouse.leftButtonDown = event.button === 0;
  });
  canvas.addEventListener('mousemove', function (event) {
    const pos = toPos(event);
    const speedR = 0.1;
    const delta = { x: mouse.pos.x - pos.x, y: mouse.pos.y - pos.y };

    if (mouse.leftButtonDown) {
      camera.rotation.x += delta.x * speedR;
      camera.rotation.y += delta.y * speedR;
    }
    mouse.pos = pos;
  });
  canvas.addEventListener('mouseup', function (event) {
    mouse.pos = toPos(event);
    mouse.leftButtonDown = false;
  });

  //register a key handler to reset camera
  document.addEventListener('keypress', function (event) {

    if (flightmode) { //only animates camera in the flightmode 
      return;
    }
    //https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
    if (event.code === 'KeyR') { //reset camera rotation
      camera.rotation.x = 0;
      camera.rotation.y = 0;
    }

    //set WASD key spec. need to move camera an point where we are looking at now.
    const speed = 0.5;

    if (event.code === 'KeyW') { //reset camera rotation
      camera.position.z -= speed * Math.cos(glm.deg2rad(camera.rotation.x));
      camera.position.x += speed * Math.sin(glm.deg2rad(camera.rotation.x));
      log(camera);
    }
    if (event.code === 'KeyS') {
      camera.position.z += speed * Math.cos(glm.deg2rad(camera.rotation.x));
      camera.position.x -= speed * Math.sin(glm.deg2rad(camera.rotation.x));
      log(camera);
    }
    if (event.code === 'KeyD') { //reset camera rotation
      camera.position.z += speed * Math.sin(glm.deg2rad(camera.rotation.x));
      camera.position.x += speed * Math.cos(glm.deg2rad(camera.rotation.x));
      log(camera);
      log(camera);
    }
    if (event.code === 'KeyA') { //reset camera rotation
      camera.position.z -= speed * Math.sin(glm.deg2rad(camera.rotation.x));
      camera.position.x -= speed * Math.cos(glm.deg2rad(camera.rotation.x));
      log(camera);
    }
    if (event.code === 'KeyQ') { //set camera to line3
      camera.rotation.x = 113;
      camera.rotation.y = 9;
      camera.position.x = -38;
      camera.position.y = 5;
      camera.position.z = -72;
    }
    if (event.code === 'KeyE') { //set camera to line3
      switchToNextPredPos();
    }

  });
}
/**
 * By pressing the key 'E' you can switch to special locations in the scene
 */
function switchToNextPredPos() {
  console.log("switched to pred Pos " + predPosInd + " " + predPos[predPosInd][5]);
  camera.rotation.x = predPos[predPosInd][0];
  camera.rotation.y = predPos[predPosInd][1];
  camera.position.x = predPos[predPosInd][2];
  camera.position.y = predPos[predPosInd][3];
  camera.position.z = predPos[predPosInd][4];
  predPosInd++;
  if (predPosInd >= predPos.length) {
    predPosInd = 0;
  }


}
/**
 * Function used for console output
 * @param {} what 
 */
function log(what) { // write debug log
  console.log(what);
}

var test_init = true; // some test variables
var lastTime=0;       
var fire2_init = true; // turns of second fire

function render(timeInMilliseconds) {

  //basic Setup stuff
  checkForWindowResize(gl);
  gl.viewport(0, 0, gl.drawingBufferWidth,gl.drawingBufferHeight);
  //set background color to light gray
  gl.clearColor(136 / 255, 191 / 255, 255 / 255, 1.0);
  //clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //set local parameters for animation
  const context = createSGContext(gl);
  context.timeInMilliseconds = timeInMilliseconds;
  context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 200);

  if (fire2_init) { // let the 2nd fire fall down the sky...
    log("Fire2 started " +  timeInMilliseconds);
    for (let j = 0; j < 5; j++) {
      fire2.children[0].chekForSpawn(15000 + j * 100);
    }
    fire2.children[0].igniteFire(timeInMilliseconds);
    fire2_init = false
  }


  if (!flightmode) { //set correct cameraposition depending on user interaction, if we are not in flightmode anymore
    context.viewMatrix = mat4.create();
    context.viewMatrix = mat4.multiply(mat4.create(), context.viewMatrix, glm.rotateX(camera.rotation.y));
    context.viewMatrix = mat4.multiply(mat4.create(), context.viewMatrix, glm.rotateY(camera.rotation.x));
    context.viewMatrix = mat4.multiply(mat4.create(), context.viewMatrix, glm.translate(-camera.position.x, -camera.position.y, -camera.position.z));
  }

  if(!fireTime){ //wheels should only rotate when it is moving, in the firetime the ship does not move
   wheelRotate.matrix = new glm.rotateX(timeInMilliseconds * .6);
  }
  //matrix for manipulating the moving object - the ship
  var shipTransformationMatrix = mat4.create();

  if (timeInMilliseconds > cb1TimeStart) {
    tm = ((timeInMilliseconds - cb1TimeStart) % 5000) / 1000;
    v = moveCbNode.speed;
    moveCbNode.matrix = glm.translate(tm * 2 * v, tm * v - 4 * tm * tm);
  }

  //we are driving on the last road, where the ship gets burned at the end
  if (asphalt3road) {
    //update camera matrix, so we can follow the driving ship
    if (flightmode) { //only animates camera in the flightmode
      context.viewMatrix = mat4.lookAt(mat4.create(), [camera.position.x + asphalt3roaddistance * 1.1, camera.position.y, camera.position.z + asphalt3roaddistance * 1 - 45], [camera.view.x + asphalt3roaddistance, camera.view.y, camera.view.z], [0, 1, 0]);
    }
    shipTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(asphalt3roaddistance, 0, -60)); //move on the z-axis depending on the millisec
    shipTransformationMatrix = mat4.multiply(mat4.create(), shipTransformationMatrix, glm.rotateY(-90));//ship need to be rotated in order to drive upwards
    shipTransfddormationMatrix = mat4.multiply(mat4.create(), shipTransformationMatrix, glm.translate(0, 0, 0)); //first to origin, for rotation around own axis
    //updating the way the ship has already made, depending on the milliseconds
    asphalt3roaddistance = (-1) * (timeInMilliseconds - (totaltimebefore)) * travelfactor + 60; //has to be multiplied by -1, in order to move along negative z axis
    if (asphalt3roaddistance <= 20) { //at this postion, the cannonball hits the torch of the ship
      torchfalldown = true;
    }
    if (asphalt3roaddistance <= -30) { //now we have to switch to the first road, the asphalt1road
      asphalt3road = false; 
      fireTime = true;
      fire.children[0].igniteFire(timeInMilliseconds); // ignite the fire
      log("Fire started " +  timeInMilliseconds);

      totaltimebefore = timeInMilliseconds; //reset the totaltimes until now, so we can calc for later path again
      //camera preperation for next road
      if (flightmode) { //only animates camera in the flightmode
        camera.position.x = -45 //fix cameraposition for next path
        camera.position.y = 5 
        camera.position.z = -62;

        camera.rotation.x = 200;
        camera.rotation.y = 10;
        
        camera.view.x = 1;
        camera.view.y = 8;
        camera.view.z = 0;
        
      }
    }
  }

  //here we are moving upwards again, this is the 3rd road we are driving at. Here we have a lot of spotlights
  if (asphalt2road) {
    //update camera matrix, so we can follow the driving ship
    if (flightmode) { //only animates camera in the flightmode
      context.viewMatrix = mat4.lookAt(mat4.create(), [camera.position.x, camera.position.y, camera.position.z + asphalt2roaddistance], [camera.view.x, camera.view.y, camera.view.z + asphalt2roaddistance], [0, 1, 0]);
    }
    shipTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(60, 0, asphalt2roaddistance)); //move on the z-axis depending on the millisec
    shipTransformationMatrix = mat4.multiply(mat4.create(), shipTransformationMatrix, glm.rotateY(180));//ship need to be rotated in order to drive upwards
    shipTransformationMatrix = mat4.multiply(mat4.create(), shipTransformationMatrix, glm.translate(0, 0, 0)); //first to origin, for rotation around own axis
    //updating the way the ship has already made, depending on the milliseconds
    asphalt2roaddistance = (-1) * (timeInMilliseconds - (totaltimebefore)) * travelfactor + 60; //has to be multiplied by -1, in order to move along negative z axis
    if (asphalt2roaddistance <= -60) { //now we have to switch to the third road, the asphalt2road
      asphalt2roaddistance = 60; //set back to default
      asphalt2road = false; //turn off waterroad, we are now going to asphalt3
      asphalt3road = true; //next road
      totaltimebefore = timeInMilliseconds; //reset the totaltimes until now, so we can calc for later path again
      //camera preperation for next road
      if (flightmode) { //only animates camera in the flightmode
        camera.position.x = -30; //0; //fix cameraposition for next path
        camera.position.z = -20; //-15;
        camera.view.x = 0;//also update a new view of the camera for next path
        camera.view.z = -60;//also update a new view of the camera for next path
        cb1TimeStart = timeInMilliseconds + 1000;

      }
    }
  }

  //now we are moving sideways in the scene, trough a beautiful waterpark, this is road number 2
  if (waterroad) {
    fishjump = true; //let fish jump out of the water
    if (flightmode) { //only animates camera in the flightmode
      //update camera matrix, so we can follow the driving ship
      context.viewMatrix = mat4.lookAt(mat4.create(), [camera.position.x + waterroaddistance, camera.position.y, camera.position.z], [camera.view.x + waterroaddistance, camera.view.y, camera.view.z], [0, 1, 0]);
    }
    shipTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(waterroaddistance, -0.5, 60)); //move on the x-axis depending on the millisec
    shipTransformationMatrix = mat4.multiply(mat4.create(), shipTransformationMatrix, glm.rotateY(90));//ship need to be rotated in order to drive sideways
    shipTransformationMatrix = mat4.multiply(mat4.create(), shipTransformationMatrix, glm.translate(0, 0, 0)); //first to origin, for rotation around own axis
    //updating the way the ship has already made, depending on the milliseconds
    waterroaddistance = (timeInMilliseconds - (totaltimebefore)) * travelfactor - 60;
    if (waterroaddistance >= 60) { //now we have to switch to the third road, the asphalt2road
      waterroaddistance = -60; //set back to default
      waterroad = false; //turn off waterroad, we are now going to asphalt2
      asphalt2road = true; //next road
      fishjump = false; //turn off fishjumps
      totaltimebefore = timeInMilliseconds; //reset the totaltimes until now, so we can calc for later path again
      if (flightmode) { //only animates camera in the flightmode
        //camera preperation for next road
        camera.position.x = 60; //fix cameraposition for next path
        camera.position.y += 10;
        camera.position.z = 40;
        camera.view.x = 60;//also update a new view of the camera for next path
        camera.view.z = 5;//also update a new view of the camera for next path
      }
    }
  }

  //ship is driving on the startroad
  if (apshalt1road) {
    if (flightmode) { //only animates camera in the flightmode
      //autoupdate camera position
      context.viewMatrix = mat4.lookAt(mat4.create(), [camera.position.x - 60, camera.position.y, camera.position.z + aphalt1distance], [camera.view.x - 60, camera.view.y, camera.view.z + aphalt1distance], [0, 1, 0]);
    }
    shipTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(-60, 0, aphalt1distance));
    aphalt1distance = (timeInMilliseconds - (totaltimebefore)) * travelfactor - 60;
    if (aphalt1distance >= 0 && aphalt1distance <= 1) { //we launch the flight for the ramp on the road
      launchflight = true;
    }
    if (aphalt1distance >= 60) { //now we have to switch to the second road, the waterroad
      aphalt1distance = -60; //set back to deafault
      apshalt1road = false; //turns of this path
      waterroad = true; //activate next path
      totaltimebefore = timeInMilliseconds; //reset the totaltimes until now, so we can calc for later path again
      if (flightmode) { //only animates camera in the flightmode
        camera.position.x = 20;//fix cameraposition for next path
        camera.position.z = 90;
        camera.view.x = -50;//also update a new view of the camera for next path
      }
    }
  }

  //*********************************/
  //ROAD-DEPENDING SPECIAL MOVEMENTS
  //*********************************/
  //prepares the ship for rotation in the air, when  going up the ramp.
  //the flight is only possible at apshalt1road
  if (launchflight) {
    if (flightmode) { //only animates camera in the flightmode
      //autoupdate camera position
      context.viewMatrix = mat4.lookAt(mat4.create(), [-60, camera.position.y, camera.position.z + aphalt1distance], [-60, camera.view.y, camera.view.z + aphalt1distance], [0, 1, 0]);
    }
    apshalt1road = false;//turn off normal driving(normal means just going along the x or z axis)
    shipTransformationMatrix = mat4.multiply(mat4.create(), shipTransformationMatrix, glm.translate(-60, jumpheight, aphalt1distance));
    shipTransformationMatrix = mat4.multiply(mat4.create(), shipTransformationMatrix, glm.rotateX(-45)); //if we rotate the ship a little bit, it looks more realistic
    shipTransformationMatrix = mat4.multiply(mat4.create(), shipTransformationMatrix, glm.translate(0, 0, 0));
    aphalt1distance = (timeInMilliseconds - (totaltimebefore)) * travelfactor - 60;
    jumpheight = jumpheight + 0.1; //getting the ship into the air to rotate
    if (jumpheight >= 5.5) { //height reached, ready to rotate
      launchflight = false;
      rotateShip = true;
    }

  }

  //the rotateShip flag is used to let the ship rotate after jumping on the asphaltroad1
  if (rotateShip) {
    if (flightmode) { //only animates camera in the flightmode
      //autoupdate camera position
      context.viewMatrix = mat4.lookAt(mat4.create(), [camera.position.x - 60, camera.position.y, camera.position.z + aphalt1distance], [camera.view.x - 60, camera.view.y, camera.view.z + aphalt1distance], [0, 1, 0]);
    }
    //in order to rotate around own axis, you have to place object in origin, rotate and then put back to the position it belongs
    shipTransformationMatrix = mat4.multiply(mat4.create(), shipTransformationMatrix, glm.translate(-60, jumpheight, aphalt1distance));
    shipTransformationMatrix = mat4.multiply(mat4.create(), shipTransformationMatrix, glm.rotateZ(rotateDegrees));
    shipTransformationMatrix = mat4.multiply(mat4.create(), shipTransformationMatrix, glm.translate(0, 0, 0));
    aphalt1distance = (timeInMilliseconds - (totaltimebefore)) * travelfactor - 60;
    rotateDegrees += 8; //if set tho higher value, ship will rotate faster around its own axis
    //check if ship has turned over one full round, then reset parameters
    if (rotateDegrees == 360) {
      rotateShip = false;
      rotateDegrees = 0;
      falldown = true;
    }
  }

  //falldown gets activated, after ship has rotatetd at the asphaltroad1 jump over the ramp
  if (falldown) {
    if (flightmode) { //only animates camera in the flightmode
      //autoupdate camera position
      context.viewMatrix = mat4.lookAt(mat4.create(), [camera.position.x - 60, camera.position.y, camera.position.z + aphalt1distance], [camera.view.x - 60, camera.view.y, camera.view.z + aphalt1distance], [0, 1, 0]);
    }
    aphalt1distance = (timeInMilliseconds - (totaltimebefore)) * travelfactor - 60; //sets new distance of the ship
    jumpheight = jumpheight - (timeInMilliseconds - (totaltimebefore)) * 0.00008 ; //ship goes back down to the floor step by step
    shipTransformationMatrix = mat4.multiply(mat4.create(), shipTransformationMatrix, glm.translate(-60, jumpheight, aphalt1distance));
    if (jumpheight <= 0.9) { //normal height is reached again
      falldown = false;
      apshalt1road = true;
    }
  }

  //if fishjump is set, two fishes are going to rotate around the ship - done on the waterroad
  if (fishjump) {
    //simply let fish 1 and 2 rotate around the axis of the ship
    fish1TransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.rotateZ(rotateFishDegrees));
    fish1TransformationMatrix = mat4.multiply(mat4.create(), fish1TransformationMatrix, glm.translate(0.3, 35, 0));
    fish1TransformationMatrix = mat4.multiply(mat4.create(), fish1TransformationMatrix, glm.scale(6, 6, 6));

    fish2TransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.rotateZ(rotateFishDegrees - 180));//rotate on the opposite side of the ship
    fish2TransformationMatrix = mat4.multiply(mat4.create(), fish2TransformationMatrix, glm.translate(0.3, 35, 0));
    fish2TransformationMatrix = mat4.multiply(mat4.create(), fish2TransformationMatrix, glm.scale(6, 6, 6));

    //here we set, how fast the ship rotates around the ship, looks best with 2
    rotateFishDegrees += 2;//radiant - set to a higher value, fish gonna rotate faster around the ship

    //setting the transformation matrices for both fish
    fishTransformationNode2.setMatrix(fish2TransformationMatrix);
    fishTransformationNode1.setMatrix(fish1TransformationMatrix);
  } else {//fish should disappear under the ground, so we set the y-coordinate to -1000
    fish1TransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(0.3, -1000, 0));
    fish2TransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(0.3, -1000, 0));
    fishTransformationNode2.setMatrix(fish2TransformationMatrix);
    fishTransformationNode1.setMatrix(fish1TransformationMatrix);
  }

  //this flag gets set, when the torch has fallen on the ground 
  if(fireTime){
    if (flightmode) { //only animates camera in the flightmode
      context.viewMatrix = mat4.lookAt(mat4.create(), [camera.position.x +10+ asphalt3roaddistance, camera.position.y, camera.position.z + asphalt3roaddistance + 4], [asphalt3roaddistance, 0, -60], [0, 1, 0]);
    }
    shipTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(asphalt3roaddistance, 0, -60)); //move on the z-axis depending on the millisec
    shipTransformationMatrix = mat4.multiply(mat4.create(), shipTransformationMatrix, glm.rotateY(-90));//ship need to be rotated in order to drive upwards
    shipTransformationMatrix = mat4.multiply(mat4.create(), shipTransformationMatrix, glm.translate(0, 0, 0)); //first to origin, for rotation around own axis
    var timeOver = timeInMilliseconds - (totaltimebefore);
    if(timeOver >= 2500){
      asphalt3roaddistance = 60;
      apshalt1road = true;
      fireTime = false;
      totaltimebefore = timeInMilliseconds; //reset the totaltimes until now, so we can calc for later path again
      flightmode = false;
      torchFlameTransformationSGNode.setMatrix(oldtorchMatrix);
      torchheight = 6.0;
      fire.children[0].extinguishFire();
      log("Fire extinguished " +  timeInMilliseconds);


    }

  }
    //this flag is activated, when the torch of the ship gets hit by the cannonball and needs to fall down on the ground
    if (torchfalldown) {
      torchheight = torchheight - (timeInMilliseconds - (totaltimebefore)) * 0.000018 ; //go back down to the floor step by step
      sgMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(0, torchheight, 2));
      sgMatrix = mat4.multiply(mat4.create(), sgMatrix, glm.rotateZ(rotateDegrees));
      sgMatrix = mat4.multiply(mat4.create(), sgMatrix, glm.scale(0.3,0.3,0.3));
      sgMatrix = mat4.multiply(mat4.create(), sgMatrix, glm.translate(0, 0, 0));
      rotateDegrees += 8;
      torchFlameTransformationSGNode.setMatrix(sgMatrix);
      if (torchheight <= 1.0) { //floor of boat is reached, restore parameters
        //delete the next line, in order to remove the big torch after fallen down completely
       // torchFlameTransformationSGNode.setMatrix(mat4.create(), mat4.create(), glm.translate(0, -10, 2));
       torchfalldown = false;
       rotateDegrees = 0;
      // torchheight = 6.0;
       //torchFlameTransformationSGNode.setMatrix(oldtorchMatrix);
      }
    }
  //set matrix of the ship depending on the road it is passing.
  rootTravelNode.setMatrix(shipTransformationMatrix);
  rootTravelNode_texture.setMatrix(shipTransformationMatrix);

  //start rendering the scenegraph root
  root.render(context); 
  //animate
  requestAnimationFrame(render);
}




