
function renderer() {
    const canvas = document.createElement("canvas");
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.oncontextmenu = e => {
        e.preventDefault();
    };
    document.body.appendChild(canvas);
    const g = canvas.getContext("2d");
    
    const r = {
        canvas, g,
        deltaTime: 0,

        input: {
            keys: {},
            last_keys: {},
            buttons: {},
            last_buttons: {},
            cursor: { x: 0, y: 0 },

            updateState: function() {
                this.last_keys = JSON.parse(JSON.stringify(this.keys));
                this.last_buttons = JSON.parse(JSON.stringify(this.buttons));
            },

            keyDown: function(key) { return this.keys[key] === true; },
            keyPressed: function(key) {
                return this.keys[key] === true
                    && this.last_keys[key] !== true;
            },
            buttonDown: function(button) { return this.buttons[button] === true; },
            buttonPressed: function(button) {
                return this.buttons[button] === true
                    && this.last_buttons[button] !== true;
            }
        },

        camera: {
            offsetX: 0,
            offsetY: 0,
            scale: 1,
            
            x: 0,
            y: 0,
            distance: 20,

            computeOffset: function() {
                this.scale = canvas.height / this.distance;
                this.offsetX = canvas.width / 2 - this.x * this.scale;
                this.offsetY = canvas.height / 2 - this.y * this.scale;
            },

            toScreenX: function(x) { return x * this.scale + this.offsetX; },
            toScreenY: function(y) { return y * this.scale + this.offsetY; },
            toWorldX: function(x) { return (x - this.offsetX) / this.scale; },
            toWorldY: function(y) { return (y - this.offsetY) / this.scale; }
        },
    
        onFrame: function() {},

        fill: function(color) {
            this.g.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            this.g.fillRect(0, 0, canvas.width, canvas.height);
        },

        drawLine: function(sx, sy, ex, ey, width, color) {
            this.g.lineWidth = width * this.camera.scale;
            this.g.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            this.g.beginPath();
            this.g.moveTo(
                sx * this.camera.scale + this.camera.offsetX, 
                sy * this.camera.scale + this.camera.offsetY
            );
            this.g.lineTo(
                ex * this.camera.scale + this.camera.offsetX, 
                ey * this.camera.scale + this.camera.offsetY
            );
            this.g.stroke();
        },

        drawCircle: function(x, y, radius, color) {
            this.g.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            this.g.beginPath();
            this.g.arc(
                x * this.camera.scale + this.camera.offsetX, 
                y * this.camera.scale + this.camera.offsetY, 
                radius * this.camera.scale, 
                0, 2 * Math.PI
            );
            this.g.fill();
        },

        drawRect: function(x, y, w, h, color) {
            this.g.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            this.g.fillRect(
                x * this.camera.scale + this.camera.offsetX, 
                y * this.camera.scale + this.camera.offsetY, 
                w * this.camera.scale, 
                h * this.camera.scale
            );
        },

        drawText: function(
            x, y, height, color, text, 
            weight = 600, family = `"Noto Sans Mono"`, align = "center"
        ) {
            this.g.textAlign = align;
            this.g.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            this.g.font = `${weight} ${height * this.camera.scale}px ${family}`;
            this.g.fillText(
                text,
                x * this.camera.scale + this.camera.offsetX,
                (y + height / 2) * this.camera.scale + this.camera.offsetY 
            );
        },

        drawGrid: function(color) {
            const startX = Math.floor(this.camera.toWorldX(0));
            const startY = Math.floor(this.camera.toWorldY(0));
            const endX = Math.ceil(this.camera.toWorldX(canvas.width));
            const endY = Math.ceil(this.camera.toWorldY(canvas.height));
            this.g.lineWidth = 1;
            this.g.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            for(let x = startX; x <= endX; x += 1) {
                const x_px = this.camera.toScreenX(x);
                this.g.beginPath();
                this.g.moveTo(x_px, 0);
                this.g.lineTo(x_px, canvas.height);
                this.g.stroke();
            }
            for(let y = startY; y <= endY; y += 1) {
                const y_px = this.camera.toScreenY(y);
                this.g.beginPath();
                this.g.moveTo(0, y_px);
                this.g.lineTo(canvas.width, y_px);
                this.g.stroke();
            }
        }
    }

    window.addEventListener("keydown", e => { 
        if(document.activeElement.tagName === "INPUT") { return; }
        r.input.keys[e.code] = true; 
    });
    window.addEventListener("keyup", e => { 
        if(document.activeElement.tagName === "INPUT") { return; }
        r.input.keys[e.code] = false; 
    });
    canvas.addEventListener("mousedown", e => {
        r.input.buttons[e.button] = true;
        r.input.cursor.x = e.clientX;
        r.input.cursor.y = e.clientY;
    });
    canvas.addEventListener("mouseup", e => {
        r.input.buttons[e.button] = false;
        r.input.cursor.x = e.clientX;
        r.input.cursor.y = e.clientY;
    });
    canvas.addEventListener("mousemove", e => {
        r.input.cursor.x = e.clientX;
        r.input.cursor.y = e.clientY;
    });

    let lastFrame = -1;
    const handleFrame = timestamp => {
        if(lastFrame !== -1) {
            const diff = timestamp - lastFrame;
            r.deltaTime = diff / 1000.0;
        }
        lastFrame = timestamp;
        r.canvas.width = r.canvas.offsetWidth;
        r.canvas.height = r.canvas.offsetHeight;
        r.camera.computeOffset();
        r.onFrame();
        r.input.updateState();
        window.requestAnimationFrame(handleFrame);
    };
    window.requestAnimationFrame(handleFrame);
    
    return r;
}