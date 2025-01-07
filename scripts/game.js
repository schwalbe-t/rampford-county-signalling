
const play = (() => {

    const BACKGROUND_COLOR = [10, 10, 10];
    const GRID_COLOR = [30, 30, 30];
    const LINE_COLOR = [128, 128, 128];
    const TRAIN_COLOR_ON_TIME = [0, 255, 0];
    const TRAIN_COLOR_BEHIND = [255, 185, 0];
    const TRAIN_COLOR_SEMI_LATE = [255, 128, 0];
    const TRAIN_COLOR_LATE = [255, 0, 0];
    const HEADCODE_COLOR = [255, 255, 255];

    function drawGame(r, zone, s, t) {
        r.fill(BACKGROUND_COLOR);
        r.drawGrid(GRID_COLOR);
        for(const platform of zone.platforms) {
            drawPlatformBase(r, zone, platform);
        }
        for(let signalI = 0; signalI < zone.signals.length; signalI += 1) {
            const signal = zone.signals[signalI];
            const state = s.states[signalI].state;
            drawSignal(r, zone, signal, state);
        }
        for(const node of zone.layout) {
            if(node === null) { continue; } 
            for(const destI of node.to) {
                const dest = zone.layout[destI];
                r.drawLine(node.x, node.y, dest.x, dest.y, 1, LINE_COLOR);
            }
        }
        for(const node of zone.layout) {
            if(node === null) { continue; } 
            r.drawCircle(node.x, node.y, 0.5, LINE_COLOR);
        }
        for(const platform of zone.platforms) {
            drawPlatformNumber(r, zone, platform);
        }
        for(const train of t.trains) {
            const last = zone.layout[train.lastN];
            const next = zone.layout[train.nextN];
            const x = last.x + train.offset * (next.x - last.x);
            const y = last.y + train.offset * (next.y - last.y);
            let color = TRAIN_COLOR_ON_TIME;
            if(train.lateness >= 1 * 60) { color = TRAIN_COLOR_BEHIND; }
            if(train.lateness >= 5 * 60) { color = TRAIN_COLOR_SEMI_LATE; }
            if(train.lateness >= 10 * 60) { color = TRAIN_COLOR_LATE; }
            r.drawCircle(x, y, 0.5, color);
            r.drawText(
                x, y - 0.1, 0.75, HEADCODE_COLOR, train.headcode,
                650, `"Noto Sans Mono"`
            );
        }
    }



    let camAnchor = null;

    function moveCamera(r) {
        if(!r.input.buttonDown(0) && !r.input.buttonDown(1)) {
            camAnchor = null;
            return;
        }
        if(camAnchor === null) {
            camAnchor = {
                cursorX: r.input.cursor.x, cursorY: r.input.cursor.y,
                camX: r.camera.x, camY: r.camera.y
            };
        }
        r.camera.x = camAnchor.camX 
            + (camAnchor.cursorX - r.input.cursor.x) / r.camera.scale;
        r.camera.y = camAnchor.camY 
            + (camAnchor.cursorY - r.input.cursor.y) / r.camera.scale;
    }

    const zoomInBounds = d => Math.min(Math.max(d, 10), 100);

    function adjustZoom(r) {
        const ctrl = r.input.keyDown("ControlLeft")
            || r.input.keyDown("ControlRight");
        if((ctrl && r.input.keyPressed("Equal")) || r.input.keyPressed("KeyI")) {
            r.camera.distance -= 5;
        }
        if((ctrl && r.input.keyPressed("Minus")) || r.input.keyPressed("KeyO")) {
            r.camera.distance += 5;
        }
        r.camera.distance = zoomInBounds(r.camera.distance);
    }

    function updateGame(r, s, t) {
        moveCamera(r);
        adjustZoom(r);
        s.updateStates();
        t.moveTrains(s);
        t.updateTrainLateness();
    }



    function play(zone_text) {
        document.getElementById("home").style.display = "none";
        const zone = JSON.parse(zone_text);
        const r = renderer();
        const s = signalEngine(r, zone);
        const t = trainController(r, zone);

        t.spawnTrain();

        r.onFrame = () => {
            updateGame(r, s, t);
            drawGame(r, zone, s, t);
        };
    }

    return play;
})();