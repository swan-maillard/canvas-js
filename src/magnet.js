const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const nodes = [];

window.addEventListener('resize', () => {
    resizeCanvas();
})

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
})

const mouse = {
    x: 0,
    y: 0,
    radius: 100
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes.forEach((node) => {
        node.update();
        node.draw();
    });
    requestAnimationFrame(animate);
}

class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.initX = x;
        this.initY = y;
        this.radius = 5;
        this.color = 'white';
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        ctx.fill();
    }

    update() {
        if (this.isInMouseRange()) {
            this.x -= (mouse.x - this.x)*0.05;
            this.y -= (mouse.y - this.y)*0.05;
        }
        else if (this.canReturnInPosition()) {
            this.x += (this.initX - this.x)*0.1;
            this.y += (this.initY - this.y)*0.1;
        }
    }

    isInMouseRange() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.abs(Math.sqrt(dx*dx + dy*dy));
        return (distance <= mouse.radius);
    }

    canReturnInPosition() {
        const dx = mouse.x - this.initX;
        const dy = mouse.y - this.initY;
        const distance = Math.abs(Math.sqrt(dx*dx + dy*dy));
        return (distance > mouse.radius);
    }
}

resizeCanvas()
for (let i = 0; i < 5000; i++) {
    nodes.push(new Node(Math.floor(Math.random() * canvas.width), Math.floor(Math.random() * canvas.height)));
}
animate();