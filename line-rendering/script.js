let canvas = document.getElementById('glCanvas');
let gl = canvas.getContext('webgl', {preserveDrawingBuffer: true });

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
    uniform vec4 u_color;
    void main() {
        gl_FragColor = u_color;
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
let colorLocation = gl.getUniformLocation(program, "u_color");

// Initialize buffer to store line vertices
let lineVertices = [];
let lineBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.DYNAMIC_DRAW);

// Viewport and clear settings
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(1.0, 1.0, 1.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

// Smooth mode toggle
let smoothMode = false;
document.getElementById('toggleSmooth').addEventListener('click', () => {
    smoothMode = !smoothMode;
    drawLine();
});

// Draw function
function drawLine() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    let verticesToDraw = smoothMode ? calculateBezier(lineVertices) : lineVertices;

    let lineWidth = document.getElementById('lineWidth').value;
    gl.uniform1f(pointSizeLocation, lineWidth);

    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesToDraw), gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINE_STRIP, 0, verticesToDraw.length / 2);
}

// Bézier interpolation
function calculateBezier(vertices) {
    if (vertices.length < 4) return vertices;
    let smoothedVertices = [];
    for (let i = 0; i < vertices.length - 2; i += 2) {
        let x1 = vertices[i];
        let y1 = vertices[i + 1];
        let x2 = vertices[i + 2];
        let y2 = vertices[i + 3];

        for (let t = 0; t <= 1; t += 0.1) {
            let x = lerp(x1, x2, t);
            let y = lerp(y1, y2, t);
            smoothedVertices.push(x, y);
        }
    }
    smoothedVertices.push(vertices[vertices.length - 2], vertices[vertices.length - 1]);
    return smoothedVertices;
}

// Linear interpolation
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// Add point
canvas.addEventListener('click', (event) => {
    let rect = canvas.getBoundingClientRect();
    let x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    let y = ((rect.height - (event.clientY - rect.top)) / canvas.height) * 2 - 1;
    lineVertices.push(x, y);
    drawLine();
});

// Change line color
document.getElementById('lineColor').addEventListener('input', (event) => {
    let color = event.target.value;
    let r = parseInt(color.slice(1, 3), 16) / 255;
    let g = parseInt(color.slice(3, 5), 16) / 255;
    let b = parseInt(color.slice(5, 7), 16) / 255;
    gl.uniform4f(colorLocation, r, g, b, 1.0);
    drawLine();
});

// Undo last point
document.getElementById('undoLine').addEventListener('click', () => {
    if (lineVertices.length > 0) {
        lineVertices.pop();
        lineVertices.pop();
        drawLine();
    }
});

// Save line to file
document.getElementById('saveLine').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(lineVertices)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'line.json';
    a.click();
    URL.revokeObjectURL(url);
});

// Load line from file
document.getElementById('loadLineButton').addEventListener('click', () => {
    document.getElementById('loadLine').click();
});

document.getElementById('loadLine').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            lineVertices = JSON.parse(e.target.result);
            drawLine();
        };
        reader.readAsText(file);
    }
});

// Export image function
document.getElementById('exportImage').addEventListener('click', () => {
  let dataURL = canvas.toDataURL('image/png');
  let a = document.createElement('a');
  a.href = dataURL;
  a.download = 'line_renderer.png';
  a.click();
});


