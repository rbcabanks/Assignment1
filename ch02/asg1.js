// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +  // uniform変数
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

// global variables
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let canvas;
let display2;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 10;
let g_selectedType = POINT;
let g_segment=10;
let g_width=0.0;
let g_height=0.0;
let g_fliph=false;
let g_flipv=false;
let g_eql=false
var g_shapesList = [];
let bonsaiSaveArray=[]
let refImage=document.getElementById('img2')

function addActionsForUI() { // used this resource "https://www.w3schools.com/howto/howto_js_rangeslider.asp"
  document.getElementById('clear').onclick = function () { g_shapesList = []; renderAllShapes();};
  document.getElementById('delete').onclick = function () { g_shapesList.splice(-1); renderAllShapes();}; // wanted to add this function because thought it might be helpful for drawing 
  //document.getElementById('bonsai').onclick = function () {saveBonsai(); console.log(g_shapesList);};
  document.getElementById('bonsaip').onclick = function () {canvas.style.display = "none"; renderAllShapes(); display2.style.display="block"; refImage.style.display="block";printBonsai();};
  document.getElementById('return').onclick = function () {canvas.style.display = "block"; renderAllShapes(); display2.style.display="none"; refImage.style.display="none"};

  document.getElementById('fliph').onclick = function () {if(g_fliph==false){g_fliph=true}else{g_fliph=false};}; // wanted to add this function because thought it might be helpful for drawing 
  document.getElementById('flipv').onclick = function () {if(g_flipv==false){g_flipv=true}else{g_flipv=false};}; // wanted to add this function because thought it might be helpful for drawing 
  document.getElementById('redS').addEventListener('mouseup', function () { g_selectedColor[0] = this.value / 100;}); //g_selectedColor[0]=this.value/100;
  document.getElementById('blueS').addEventListener('mouseup', function () { g_selectedColor[2] = this.value / 100;});
  document.getElementById('greenS').addEventListener('mouseup', function () { g_selectedColor[1] = this.value / 100;});
  document.getElementById('size').addEventListener('mouseup', function () { g_selectedSize = this.value;});
  document.getElementById('square').onclick = function () { g_selectedType = POINT};
  document.getElementById('triangle').onclick = function () { g_selectedType = TRIANGLE};
  document.getElementById('circle').onclick = function () { g_selectedType = CIRCLE};
  document.getElementById('segment').addEventListener('mouseup', function () { g_segment= this.value;}); //g_selectedColor[0]=this.value/100;
  document.getElementById('eql').onclick = function () {if(g_eql==false){g_eql=true}else{g_eql=false};};
  document.getElementById('width').addEventListener('mouseup', function () { g_width= this.value; console.log('g_width'+g_width);}); //g_selectedColor[0]=this.value/100;
  document.getElementById('height').addEventListener('mouseup', function () { g_height= this.value; }); //g_selectedColor[0]=this.value/100;
}

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');
  display2 = document.getElementById("secondcanv");
  display2.style.display="none";

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true }); // magic runtime code
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }

}

function printBonsai(){
  gl.clear(gl.COLOR_BUFFER_BIT);
  // created a second 2d canvas to show my own image so I didn't have to write all the complexities needed to print a 2d image in the background of the webgl canvas.  
  const canvas2 = document.getElementById("secondcanv");
  const ctx = canvas2.getContext("2d");
  const imag = document.getElementById("img");
  ctx.drawImage(imag,-80,-30,1460,800);
}
function renderAllShapes() {
  //var startTime = performance.now();
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
  //var len = g_points.length;
  var len = g_shapesList.length;

  for (var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }
  //var duration = performance.now() - startTime;
  //sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration),'numdot')

}
/*function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID+" from HTML");
    return;
  }
  htmlElm.innerHTML=text;
}*/

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForUI();
  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function (ev) { if (ev.buttons == 1) { click(ev) } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

/*
var g_points = [];  // The array for the position of a mouse press
var g_colors = [];  // The array to store the color of a point
var g_sizes = [];  
*/
function click(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  let point = new Point();
  if (g_selectedType == POINT) {
    point = new Point();
  }
  else if (g_selectedType==CIRCLE){
    point = new Circle();
  }
  else {
    point = new Triangle();
  }

  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);

  /*// Store the coordinates to g_points array
  g_points.push([x, y]);
  g_colors.push(g_selectedColor.slice());
  g_sizes.push(g_selectedSize);
  //g_colors.push([g_selectedColor[0],g_selectedColor[1],g_selectedColor[2],g_selectedColor[3]]);
*/
  renderAllShapes();
}
