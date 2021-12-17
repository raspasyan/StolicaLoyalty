function animate(options) {
    var start = performance.now();

    requestAnimationFrame(function animate(time) {
        var timeFraction = (time - start) / options.duration;
        if (timeFraction > 1) timeFraction = 1;

        var progress = options.timing(timeFraction)

        options.draw(progress, options);

        if (timeFraction < 1) {
            requestAnimationFrame(animate);
        } else if (options.callback != undefined) {
            options.callback(options);
        }
    });
}
function makeEaseOut(timing) {
    return function(timeFraction) {
        return 1 - timing(1 - timeFraction);
    }
}
function elastic(x, timeFraction) {
    return Math.pow(2, 10 * (timeFraction - 1)) * Math.cos(20 * Math.PI * x / 3 * timeFraction)
}
function bounce(timeFraction) {
    for (let a = 0, b = 1, result; 1; a += b, b /= 2) {
        if (timeFraction >= (7 - 4 * a) / 11) {
        return -Math.pow((11 - 6 * a - 11 * timeFraction) / 4, 2) + Math.pow(b, 2)
        }
    }
}
function circ(timeFraction) {
    return 1 - Math.sin(Math.acos(timeFraction));
}
function back(timeFraction) {
    return Math.pow(timeFraction, 2) * ((1.5 + 1) * timeFraction - 1.5)
}
function quad(timeFraction) {
    return Math.pow(timeFraction, 2)
}
let bounceEaseOut = makeEaseOut(bounce);