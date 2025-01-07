
function drawSignal(r, zone, signal, state) {
    const first = zone.layout[signal.first];
    const second = zone.layout[signal.second];
    const diffX = second.x - first.x;
    const diffY = second.y - first.y;
    const diffL = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
    const x = first.x + diffX * signal.offset;
    const y = first.y + diffY * signal.offset;
    const cornerX = x + diffY / diffL;
    const cornerY = y - diffX / diffL;
    const bottomX = cornerX + diffX / diffL;
    const bottomY = cornerY + diffY / diffL;
    r.drawLine(x, y, cornerX, cornerY, 0.125, [64, 64, 64]);
    r.drawLine(cornerX, cornerY, bottomX, bottomY, 0.125, [64, 64, 64]);
    switch(signal.aspect) {
        case 4:
            if(state == SignalState.PREL_CAUTION) {
                const topX = bottomX + diffX / diffL * 0.5;
                const topY = bottomY + diffY / diffL * 0.5;
                r.drawCircle(topX, topY, 0.25, [255, 255, 0]);
            }
        case 3:
            let bt_color;
            switch(state) {
                case SignalState.PROCEED: bt_color = [0, 255, 0]; break;
                case SignalState.PREL_CAUTION:
                case SignalState.CAUTION: bt_color = [255, 255, 0]; break;
                case SignalState.DANGER: bt_color = [255, 0, 0]; break;
            }
            r.drawCircle(bottomX, bottomY, 0.25, bt_color);
            break;
        case 2:
            r.drawRect(
                bottomX - 0.125, bottomY - 0.125, 0.25, 0.25, 
                state === SignalState.DANGER? [255, 0, 0] : [255, 255, 255]
            );
            break;
    }
}

function drawPlatformBase(r, zone, platform) {
    const first = zone.layout[platform.first];
    const second = zone.layout[platform.second];
    const diffX = second.x - first.x;
    const diffY = second.y - first.y;
    const diffL = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
    const aX = first.x + diffY / diffL;
    const aY = first.y - diffX / diffL;
    const bX = second.x - diffY / diffL;
    const bY = second.y + diffX / diffL;
    r.drawRect(aX, aY, bX - aX, bY - aY, [64, 64, 64]);
}

function drawPlatformNumber(r, zone, platform) {
    const first = zone.layout[platform.first];
    const second = zone.layout[platform.second];
    const x = first.x + (second.x - first.x) / 2;
    const y = first.y + (second.y - first.y) / 2;
    r.drawText(
        x, y, 1, [255, 255, 255], platform.platform,
        650, `"Noto Sans Mono"`
    );
}