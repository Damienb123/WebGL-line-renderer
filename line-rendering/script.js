let canvas = document.getElementById('glCanvas');
let gl = canvas.getContext('webgl');

// Initialize shaders
let vertexShaderSource = `
    attribute vec2 a_position;
    uniform float u_pointSize;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        gl_PointSize = u_pointSize;
    }
`;

let fragmentShaderSource = `
    precision mediump float;
    void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);  // Black line color
    }
`;

// Compile shaders
function compileShader(gl, source, type) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

let vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
let fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

// Link program
let program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking failed:', gl.getProgramInfoLog(program));
}
gl.useProgram(program);

// Get attribute and uniform locations
let positionLocation = gl.getAttribLocation(program, "a_position");
let pointSizeLocation = gl.getUniformLocation(program, "u_pointSize");

// Initialize buffer to store line vertices
let lineVertices = [];
let lineBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.DYNAMIC_DRAW);

// Set up WebGL to draw
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(1.0, 1.0, 1.0, 1.0); // White background
gl.clear(gl.COLOR_BUFFER_BIT);

// Draw function
function drawLine() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Set line width from user input
    let lineWidth = document.getElementById('lineWidth').value;
    gl.uniform1f(pointSizeLocation, lineWidth);

    // Bind and update buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.DYNAMIC_DRAW);

    // Enable position attribute
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Draw the line
    gl.drawArrays(gl.LINE_STRIP, 0, lineVertices.length / 2);
}

// Add a random point to the line
document.getElementById('addPoint').addEventListener('click', () => {
    let x = (Math.random() * 2) - 1;  // Random X in normalized device coordinates
    let y = (Math.random() * 2) - 1;  // Random Y in normalized device coordinates
    lineVertices.push(x, y);
    drawLine();
});

// Add point on canvas click
canvas.addEventListener('click', (event) => {
    let rect = canvas.getBoundingClientRect();
    let x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    let y = ((rect.height - (event.clientY - rect.top)) / canvas.height) * 2 - 1;
    lineVertices.push(x, y);
    drawLine();
});
