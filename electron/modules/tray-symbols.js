function drawCactusPath(ctx, x, y, width, height) {
    const px = (offset) => x + width * offset;
    const py = (offset) => y + height * offset;

    ctx.beginPath();
    ctx.moveTo(px(-0.18), py(0.5));
    ctx.lineTo(px(-0.18), py(0.25));
    ctx.lineTo(px(-0.32), py(0.25));
    ctx.bezierCurveTo(
        px(-0.42), py(0.25),
        px(-0.5), py(0.17),
        px(-0.5), py(0.07)
    );
    ctx.lineTo(px(-0.5), py(-0.1));
    ctx.bezierCurveTo(
        px(-0.5), py(-0.22),
        px(-0.3), py(-0.22),
        px(-0.3), py(-0.1)
    );
    ctx.lineTo(px(-0.3), py(0.02));
    ctx.lineTo(px(-0.18), py(0.02));
    ctx.lineTo(px(-0.18), py(-0.3));
    ctx.bezierCurveTo(
        px(-0.18), py(-0.54),
        px(0.18), py(-0.54),
        px(0.18), py(-0.3)
    );
    ctx.lineTo(px(0.18), py(0.08));
    ctx.lineTo(px(0.3), py(0.08));
    ctx.lineTo(px(0.3), py(-0.1));
    ctx.bezierCurveTo(
        px(0.3), py(-0.22),
        px(0.5), py(-0.22),
        px(0.5), py(-0.1)
    );
    ctx.lineTo(px(0.5), py(0.16));
    ctx.bezierCurveTo(
        px(0.5), py(0.27),
        px(0.42), py(0.34),
        px(0.32), py(0.34)
    );
    ctx.lineTo(px(0.18), py(0.34));
    ctx.lineTo(px(0.18), py(0.5));
    ctx.closePath();
}

function drawHeartPath(ctx, x, y, width, height) {
    const leftX = x - width / 2;
    const rightX = x + width / 2;
    const topY = y - height / 2;
    const bottomY = y + height / 2;
    const midY = y;
    const heartTopY = topY + height * 0.15;
    const cleftY = topY + height * 0.25;

    ctx.beginPath();
    ctx.moveTo(x, bottomY);
    ctx.bezierCurveTo(
        leftX + width * 0.25, bottomY - height * 0.1,
        leftX, midY,
        leftX + width * 0.1, heartTopY
    );
    ctx.bezierCurveTo(
        leftX + width * 0.15, topY + height * 0.05,
        x - width * 0.05, topY + height * 0.1,
        x, cleftY
    );
    ctx.bezierCurveTo(
        x + width * 0.05, topY + height * 0.1,
        rightX - width * 0.15, topY + height * 0.05,
        rightX - width * 0.1, heartTopY
    );
    ctx.bezierCurveTo(
        rightX, midY,
        rightX - width * 0.25, bottomY - height * 0.1,
        x, bottomY
    );
    ctx.closePath();
}

function drawTraySymbolPath(ctx, symbol, x, y, width, height) {
    if (symbol === 'heart') {
        drawHeartPath(ctx, x, y, width, height);
        return;
    }

    drawCactusPath(ctx, x, y, width, height);
}

module.exports = { drawCactusPath, drawHeartPath, drawTraySymbolPath };
