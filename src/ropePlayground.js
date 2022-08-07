const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const nodes = [];
const links = [];

let nodeRadius = 20;
let nonElasticity = 100;
let rigid = true;
let gravity = 0.02;

let isRunning = false;
let lastNodeClicked = null;

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    multiply(coeff) {
        this.x *= coeff;
        this.y *= coeff;
        return this;
    }

    divide(coeff) {
        if (coeff != 0) {
            this.x /= coeff;
            this.y /= coeff;
        }
        return this;
    }

    scale(scaledNorm) {
        if (scaledNorm > 0) {
            const norm = this.norm();
            this.divide(norm)
                .multiply(scaledNorm);
        }
        return this;
    }

    norm() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }

    static sub(v1, v2) {
        return new Vector(v1.x - v2.x, v1.y - v2.y);
    }

    static add(v1, v2) {
        return new Vector(v1.x + v2.x, v1.y + v2.y);
    }

    static multiply(v, coeff) {
        return new Vector(v.x*coeff, v.y*coeff);
    }
}

class Node {
    constructor(x, y, isFixed) {
        this.position = new Vector(x, y);
        this.velocity = new Vector(0, 0);
        this.isFixed = isFixed;
    }

    draw() {
        ctx.fillStyle = (this.isFixed) ? 'red' : 'white';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, nodeRadius, 0, 2*Math.PI);
        ctx.fill();
    }

    computeNewState() {
        if (!this.isFixed) {
            this.velocity.y += gravity;
            this.position.add(this.velocity);
        }
    }
}

class Link {
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
        this.length = Vector.sub(node1.position, node2.position).norm();
    }

    draw() {
        drawLink(this.node1.position, this.node2.position);
    }

    computeNewState() {
        const linkVector = Vector.sub(this.node1.position, this.node2.position);

        if (rigid || linkVector.norm() > this.length) {
            const linkCenter = Vector.add(this.node1.position, this.node2.position).divide(2);
            const linkDirection = linkVector.scale(1);

            if (!this.node1.isFixed && !this.node2.isFixed) {
                this.node1.position = Vector.add(linkCenter, Vector.multiply(linkDirection, this.length / 2));
                this.node2.position = Vector.sub(linkCenter, Vector.multiply(linkDirection, this.length / 2));
            }
            if (this.node1.isFixed && !this.node2.isFixed) {
                this.node2.position = Vector.sub(this.node1.position, Vector.multiply(linkDirection, this.length));
            }
            if (this.node2.isFixed && !this.node1.isFixed) {
                this.node1.position = Vector.add(this.node2.position, Vector.multiply(linkDirection, this.length));
            }
        }
    }
}

window.addEventListener('resize', () => {
    resizeCanvas();
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    if (mouse.dragging && isRunning) {
        links.forEach((link, index, linksLooping) => {
            const xmin = Math.min(link.node1.position.x, link.node2.position.x);
            const xmax = Math.max(link.node1.position.x, link.node2.position.x);
            const ymin = Math.min(link.node1.position.y, link.node2.position.y);
            const ymax = Math.max(link.node1.position.y, link.node2.position.y);

            if (mouse.x >= xmin - 3 && mouse.x <= xmax + 3 && mouse.y >= ymin - 3 && mouse.y <= ymax + 3) {
                linksLooping.splice(index, 1);
            }
        });
    }
});

window.addEventListener('mousedown', () => {
    mouse.dragging = true;

    if (!isRunning) {
        nodes.forEach((node) => {
            if (Vector.sub(node.position, new Vector(mouse.x, mouse.y)).norm() <= nodeRadius) {
                lastNodeClicked = node;
            }
        });
    }
})

window.addEventListener('mouseup', () => {
    mouse.dragging = false;
    if (!isRunning) {
        nodes.forEach((node) => {
            if (Vector.sub(node.position, new Vector(mouse.x, mouse.y)).norm() <= nodeRadius && lastNodeClicked !== null) {
                if (lastNodeClicked === node) {
                    node.isFixed = !node.isFixed;
                } else {
                    links.push(new Link(lastNodeClicked, node));
                }
            }
        });
        if (lastNodeClicked === null) nodes.push(new Node(mouse.x, mouse.y, false));
        lastNodeClicked = null;
    }
})

window.addEventListener('keydown', (e) => {
    if (e.key === " ") {
        document.getElementById("indication").style.display = "none";
        isRunning = true;
    }
})

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isRunning) {
        nodes.forEach((node) => {
            node.computeNewState()
        });

        for (let i = 0; i < nonElasticity; i++) {
            links.forEach((link) => {
                link.computeNewState();
            });
        }
    }

    links.forEach((link) => {
        link.draw();
    });

    if (mouse.dragging && !isRunning && lastNodeClicked !== null) {
        drawLink(lastNodeClicked.position, mouse);
    }

    nodes.forEach((node) => {
        node.draw();
    });
    requestAnimationFrame(animate);
}

function drawLink(position1, position2) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(position1.x, position1.y);
    ctx.lineTo(position2.x, position2.y);
    ctx.stroke();
}

const mouse = {
    x: 0,
    y: 0,
    dragging: false
}

resizeCanvas();
animate();