
const edit = (() => {

    const propertiesWrapper = document.createElement("div");
    propertiesWrapper.style.width = "20vw";
    propertiesWrapper.style.height = "100vh";
    propertiesWrapper.style.position = "absolute";
    propertiesWrapper.style.top = "0px";
    propertiesWrapper.style.right = "0px";
    propertiesWrapper.style.background = "white";
    propertiesWrapper.style.overflowY = "auto";
    const properties = document.createElement("div");
    properties.style.paddingBottom = "25vh";
    propertiesWrapper.appendChild(properties);
    let propertiesShown = false;

    function showProperties() {
        if(propertiesShown) {
            properties.innerHTML = "";
        } else {
            document.body.appendChild(propertiesWrapper);
            propertiesShown = true;
        }
    }

    function addNewLine() {
        properties.appendChild(document.createElement("br"));
    }

    function addText(content) {
        properties.appendChild(document.createTextNode(content));
    }

    function addInputProperty(name, startValue, handler) {
        const label = document.createElement("label");
        label.innerText = name + " ";
        properties.appendChild(label);
        const value = document.createElement("input");
        value.oninput = () => { handler(value.value); };
        value.value = startValue;
        properties.appendChild(value);
        addNewLine();
    }

    function addButton(name, handler) {
        const button = document.createElement("button");
        button.onclick = () => { handler(); };
        button.innerText = name;
        properties.appendChild(button);
    }

    function hideProperties() {
        if(!propertiesShown) { return; }
        document.body.removeChild(propertiesWrapper);
        properties.innerHTML = "";
        propertiesShown = false;
    }


    let mode = "layout";
    let selected = null;
    let previewedSignal = null;
    let editedSchedule = null;

    function findNodeIndexAt(zone, x, y) {
        return zone.layout.findIndex(
            n => n !== null && n.x === x && n.y === y
        );
    }

    function findNodeAt(zone, x, y) {
        return zone.layout.find(
            n => n !== null && n.x === x && n.y === y
        );
    }

    function selectNode(r, zone, onDoubleSelect) {
        const x = Math.round(r.camera.toWorldX(r.input.cursor.x));
        const y = Math.round(r.camera.toWorldY(r.input.cursor.y));
        const hover = findNodeAt(zone, x, y);
        if(r.input.buttonPressed(0)) {
            if(!selected && hover) { selected = { x, y }; }
            else if(selected && x === selected.x && y === selected.y) { selected = null; } 
            else if(selected && hover && onDoubleSelect) {
                let firstI = findNodeIndexAt(zone, selected.x, selected.y);
                let secondI = findNodeIndexAt(zone, x, y);
                onDoubleSelect(firstI, secondI);
                selected = null;
            }
        }
        return [x, y];
    }


    const NO_SCHEDULE = -1;
    const SELECTING_SCHEDULE = -2;
    const SELECTING_NODE = -3;
    let choosingSchedule;
    let choosingSection;
    let choosingScrollHeight;

    function editSchedules(r, zone) {
        function chooseNode(scheduleI, sectionI) {
            choosingScrollHeight = propertiesWrapper.scrollHeight;
            editedSchedule = SELECTING_NODE;
            choosingSchedule = scheduleI;
            choosingSection = sectionI;
            showProperties();
            addText("Click a node to add.");
            addNewLine();
        }
        function editSchedule(scheduleI) {
            showProperties();
            editedSchedule = scheduleI;
            const schedule = zone.schedules[scheduleI];
            addButton("Delete Schedule", () => {
                zone.schedules = [
                    ...zone.schedules.slice(0, scheduleI),
                    ...zone.schedules.slice(scheduleI + 1, zone.schedules.length)
                ];
                editedSchedule = NO_SCHEDULE;
            });
            addButton("Done", () => {
                editedSchedule = NO_SCHEDULE;
            });
            addNewLine();
            addInputProperty("Schedule Name", schedule.name, v => {
                schedule.name = v;
            });
            addInputProperty("Starting Headcode", schedule.headcode, h => {
                schedule.headcode = h;
            });
            addNewLine();
            for(let sectionI = 0; sectionI < schedule.sections.length; sectionI += 1) {
                const section = schedule.sections[sectionI];
                addNewLine();
                if(section.type === "platform") { 
                    addInputProperty("Station Name", section.station, v => {
                        section.station = v;
                    });
                    addInputProperty("Platform Number", section.platform, p => {
                        try {
                            section.platform = parseInt(p);
                        } catch(e) {}
                    });
                    addInputProperty("Departure Time", section.departure, t => {
                        try {
                            section.departure = parseFloat(t);
                        } catch(e) {}
                    });
                    addInputProperty("Headcode", section.headcode, h => {
                        section.headcode = h;
                    });
                }
                for(const nodeI of section.nodes) {
                    addText(`Node #${nodeI}`);
                    addNewLine();
                }
                if(section.nodes.length > 0) {
                    addButton("Remove Node", () => {
                        section.nodes.pop();
                        editSchedule(scheduleI);
                    });
                }
                addButton("Add Node", () => {
                    chooseNode(scheduleI, sectionI);
                });
                addNewLine();
            }
            addNewLine();
            if(schedule.sections.length > 0) {
                addButton("Remove Section", () => {
                    schedule.sections.pop();
                    editSchedule(scheduleI);
                });
            }
            addButton("Add Fixed Section", () => {
                schedule.sections.push({
                    type: "fixed",
                    nodes: []
                });
                editSchedule(scheduleI);
            });
            addButton("Add Platform Section", () => {
                let headcode = schedule.headcode;
                for(const section of schedule.sections) {
                    if(section.type === "platform") { 
                        headcode = section.headcode; 
                    }
                }
                schedule.sections.push({
                    type: "platform",
                    station: "unknown",
                    platform: 0,
                    departure: 0.0,
                    headcode,
                    nodes: []
                });
                editSchedule(scheduleI);
                propertiesWrapper.scrollTo(0, propertiesWrapper.scrollHeight);
            });
            addNewLine();
        }
        function chooseSchedule() {
            editedSchedule = SELECTING_SCHEDULE;
            showProperties();
            addText("Choose a schedule to edit:");
            addNewLine();
            for(let scheduleI = 0; scheduleI < zone.schedules.length; scheduleI += 1) {
                addButton(zone.schedules[scheduleI].name, () => {
                    editSchedule(scheduleI);
                });
                addNewLine();
            }
            addButton("<Create New Schedule>", () => {
                zone.schedules.push({
                    name: `Schedule ${zone.schedules.length + 1}`,
                    headcode: "??",
                    sections: []
                });
                editSchedule(zone.schedules.length - 1);
            });
            addNewLine();
        }
        if(editedSchedule === NO_SCHEDULE) { chooseSchedule(); }
        if(editedSchedule === SELECTING_NODE && r.input.buttonPressed(0)) {
            const x = Math.round(r.camera.toWorldX(r.input.cursor.x));
            const y = Math.round(r.camera.toWorldY(r.input.cursor.y));
            const hover = findNodeIndexAt(zone, x, y);
            if(hover !== -1) {
                zone.schedules[choosingSchedule]
                    .sections[choosingSection]
                    .nodes.push(hover);
                editSchedule(choosingSchedule);
                propertiesWrapper.scrollTo(0, choosingScrollHeight);
            }
        }
    }


    function editPlatforms(r, zone) {
        editedSchedule = NO_SCHEDULE;
        previewedSignal = null;
        selectNode(r, zone, (firstI, secondI) => {
            const existingI = zone.platforms.findIndex(
                p => (p.first === firstI && p.second === secondI)
                  || (p.first === secondI && p.second === firstI)
            );
            if(existingI !== -1) {
                const existing = zone.platforms[existingI];
                showProperties();
                addInputProperty("Station Name", existing.name, v => {
                    existing.name = v;
                });
                addInputProperty("Platform Number", existing.platform, v => {
                    try {
                        existing.platform = parseInt(v);
                    } catch(e) {}
                });
            } else {
                zone.platforms.push({
                    first: firstI, second: secondI, 
                    name: "unnamed", platform: 0
                });
                hideProperties();
            }
        });
        if(r.input.keyPressed("Escape")) {
            hideProperties();
        }
    }
    

    function editSignals(r, zone) {
        editedSchedule = NO_SCHEDULE;
        hideProperties();
        if(r.input.buttonPressed(0) && previewedSignal) {
            zone.signals.push(previewedSignal);
            previewedSignal = null;
        }
        selectNode(r, zone, (firstI, secondI) => {
            if(zone.layout[firstI].to.includes(secondI)) {
                previewedSignal = { first: firstI, second: secondI, offset: 0, aspect: 4 };
            }
        });
        if(previewedSignal) {
            if(r.input.keyPressed("KeyR")) {
                const oldFirst = previewedSignal.first;
                previewedSignal.first = previewedSignal.second;
                previewedSignal.second = oldFirst;
            }
            if(r.input.keyPressed("Digit2")) { previewedSignal.aspect = 2; }
            if(r.input.keyPressed("Digit3")) { previewedSignal.aspect = 3; }
            if(r.input.keyPressed("Digit4")) { previewedSignal.aspect = 4; }
            previewedSignal.offset = r.input.cursor.x / r.canvas.width;
        }
    }


    function editLayout(r, zone) {
        hideProperties();
        editedSchedule = NO_SCHEDULE;
        previewedSignal = null;
        const [x, y] = selectNode(r, zone, (startI, endI) => {
            const start = zone.layout[startI];
            const end = zone.layout[endI];
            if(start.to.includes(endI) || end.to.includes(startI)) {
                start.to = start.to.filter(i => i != endI);
                end.to = end.to.filter(i => i != startI);
                zone.signals = zone.signals.filter(s => {
                    return !(s.first === startI && s.second === endI)
                        && !(s.second === startI && s.first === endI)
                });
            } else {
                start.to.push(endI);
                end.to.push(startI);
            }
        });
        if(r.input.buttonPressed(0) && !findNodeAt(zone, x, y)) {
            zone.layout.push({ x, y, to: [] });
        }
        if(r.input.buttonPressed(2)) {
            selected = null;
            let removed = [];
            for(let nodeI = 0; nodeI < zone.layout.length; nodeI += 1) {
                const node = zone.layout[nodeI];
                if(node === null) { continue; }
                if(node.x !== x || node.y !== y) { continue; }
                removed.push(nodeI);
                zone.layout[nodeI] = null;
            }
            for(const node of zone.layout) {
                if(node === null) { continue; }
                node.to = node.to.filter(i => !removed.includes(i));
            }
            zone.signals = zone.signals.filter(
                s => !removed.includes(s.first) && !removed.includes(s.second)
            );
            zone.platforms = zone.platforms.filter(
                p => !removed.includes(p.first) && !removed.includes(p.second)
            );
        }
    }



    function drawLayout(r, zone) {
        for(const platform of zone.platforms) {
            drawPlatformBase(r, zone, platform);
        }
        const drawnSignals = previewedSignal
            ? [...zone.signals, previewedSignal]
            : zone.signals;
        for(const signal of drawnSignals) {
            drawSignal(r, zone, signal, SignalState.PREL_CAUTION);
        }
        for(const node of zone.layout) {
            if(node === null) { continue; } 
            for(const destI of node.to) {
                const dest = zone.layout[destI];
                r.drawLine(node.x, node.y, dest.x, dest.y, 1, [128, 128, 128]);
            }
        }
        for(const node of zone.layout) {
            if(node === null) { continue; } 
            r.drawCircle(node.x, node.y, 0.5, [192, 192, 192]);
        }
        for(const platform of zone.platforms) {
            drawPlatformNumber(r, zone, platform);
        }
        if(selected) {
            r.drawCircle(selected.x, selected.y, 0.5, [0, 0, 255]);
        }
    }

    const PLATFORM_SECTION_COLORS = [
        [255, 0, 0], [255, 64, 0], [255, 128, 0], [255, 191, 0], [255, 255, 0],
        [191, 255, 0], [128, 255, 0], [64, 255, 0], [0, 255, 0], [0, 255, 64],
        [0, 255, 128], [0, 255, 191], [0, 255, 255], [0, 191, 255], [0, 128, 255],
        [0, 64, 255], [0, 0, 255], [64, 0, 255], [128, 0, 255], [191, 0, 255],
        [255, 0, 255], [255, 0, 191], [255, 0, 128], [255, 0, 64]
    ];

    function drawSchedule(r, zone, schedule) {
        let lastNode = null;
        let lastFixedNode = null;
        for(let sectionI = 0; sectionI < schedule.sections.length; sectionI += 1) {
            const section = schedule.sections[sectionI];
            if(section.type === "platform") {
                lastNode = lastFixedNode;
            }
            for(const nodeI of section.nodes) {
                const node = zone.layout[nodeI];
                if(lastNode !== null) {
                    r.drawLine(
                        lastNode.x, lastNode.y, node.x, node.y,
                        0.1, 
                        PLATFORM_SECTION_COLORS[sectionI % PLATFORM_SECTION_COLORS.length]
                    );
                }
                lastNode = node;
            }
            if(section.type === "fixed" && section.nodes.length > 0) {
                lastFixedNode = zone.layout[
                    section.nodes[section.nodes.length - 1]
                ];
            }
        }
    }


    const CAMERA_SPEED = 10;

    function edit(zone_text) {
        if(!zone_text) {
            zone_text = `{ "layout": [], "signals": [], "platforms": [], "schedules": [] }`;
        }
        const zone = JSON.parse(zone_text);
        document.getElementById("home").style.display = "none";
        const r = renderer();
        r.onFrame = () => {
            if(r.input.keyPressed("KeyE")) {
                const blob = new Blob([JSON.stringify(zone)], { type: "text/plain" });
                navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
            }
            let velX = 0;
            let velY = 0;
            if(r.input.keyDown("KeyA")) { velX -= 1; }
            if(r.input.keyDown("KeyD")) { velX += 1; }
            if(r.input.keyDown("KeyW")) { velY -= 1; }
            if(r.input.keyDown("KeyS")) { velY += 1; }
            if(Math.abs(velX) > 0 || Math.abs(velY) > 0) {
                const l = Math.sqrt(Math.pow(velX, 2) + Math.pow(velY, 2));
                r.camera.x += velX / l * r.deltaTime * CAMERA_SPEED;
                r.camera.y += velY / l * r.deltaTime * CAMERA_SPEED;
            }
            if(r.input.keyPressed("KeyZ")) { r.camera.distance -= 5; }
            if(r.input.keyPressed("KeyX")) { r.camera.distance += 5; }

            if(r.input.keyPressed("KeyC")) { mode = "signals"; }
            if(r.input.keyPressed("KeyL")) { mode = "layout"; }
            if(r.input.keyPressed("KeyP")) { mode = "platforms"; }
            if(r.input.keyPressed("KeyT")) { mode = "schedules"; }
            switch(mode) {
                case "signals": editSignals(r, zone); break;
                case "layout": editLayout(r, zone); break;
                case "platforms": editPlatforms(r, zone); break;
                case "schedules": editSchedules(r, zone); break;
            }
    
            r.fill([10, 10, 10]);
            r.drawGrid([30, 30, 30]);
            drawLayout(r, zone);
            if(mode === "schedules" && editedSchedule >= 0) {
                drawSchedule(r, zone, zone.schedules[editedSchedule]);
            }
            r.drawText(
                r.camera.toWorldX(20),
                r.camera.toWorldY(30),
                20 / r.camera.scale,
                [128, 128, 128],
                `[mode] ${mode}`,
                650, `"Noto Sans Mono"`, "left"
            );
        };
    }

    return edit;
})();