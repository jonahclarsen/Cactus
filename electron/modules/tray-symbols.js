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
    const px = (coordinate) => x - width / 2 + width * coordinate / 90;
    const py = (coordinate) => y - height / 2 + height * coordinate / 90;

    // Outer contour from the supplied SVG. Omitting its inner subpath keeps
    // the heart solid instead of cutting an outline-shaped hole through it.
    ctx.beginPath();
    ctx.moveTo(px(45), py(84.334));
    ctx.lineTo(px(6.802), py(46.136));
    ctx.bezierCurveTo(
        px(2.416), py(41.75),
        px(0), py(35.918),
        px(0), py(29.716)
    );
    ctx.bezierCurveTo(
        px(0), py(23.513),
        px(2.416), py(17.682),
        px(6.802), py(13.296)
    );
    ctx.bezierCurveTo(
        px(11.188), py(8.91),
        px(17.019), py(6.494),
        px(23.222), py(6.494)
    );
    ctx.bezierCurveTo(
        px(29.425), py(6.494),
        px(35.256), py(8.91),
        px(39.642), py(13.296)
    );
    ctx.lineTo(px(45), py(18.654));
    ctx.lineTo(px(50.358), py(13.296));
    ctx.bezierCurveTo(
        px(54.744), py(8.91),
        px(60.576), py(6.494),
        px(66.778), py(6.494)
    );
    ctx.bezierCurveTo(
        px(72.981), py(6.494),
        px(78.812), py(8.91),
        px(83.198), py(13.296)
    );
    ctx.bezierCurveTo(
        px(87.585), py(17.682),
        px(90), py(23.513),
        px(90), py(29.716)
    );
    ctx.bezierCurveTo(
        px(90), py(35.919),
        px(87.585), py(41.75),
        px(83.198), py(46.136)
    );
    ctx.lineTo(px(45), py(84.334));
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
