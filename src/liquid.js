const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

window.addEventListener('resize', () => {
    resizeCanvas();
})

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    metaball.update();
    metaball.draw();
    requestAnimationFrame(animate);
}

class Ball {
    constructor(metaball) {
        this.metaball = metaball;
        this.x = this.metaball.x;
        this.y = this.metaball.y;
        this.radius = Math.random() * 25 + 25;
        this.vx = Math.random() * 2 - 1;
        this.vy = Math.random() * 2 - 1;
    }

    update() {
        if (this.x <= this.metaball.x - this.metaball.size/2 + this.radius || this.x >= this.metaball.x + this.metaball.size/2 - this.radius) this.vx *= -1;
        if (this.y <= this.metaball.y - this.metaball.size/2 + this.radius || this.y >= this.metaball.y + this.metaball.size/2 - this.radius) this.vy *= -1;
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fill();
    }
}

class Metaball {
    constructor(nbBalls, color) {
        this.x = canvas.width/2;
        this.y = canvas.height/2;
        this.size = 300;
        this.balls = [];
        this.color = color;

        this.init(nbBalls);
    }

    init(nbBalls) {
        for (let i = 0; i < nbBalls; i++) {
            this.balls.push(new Ball(this));
        }
    }

    update() {
        this.balls.forEach(ball => ball.update());
    }

    draw() {
        ctx.fillStyle = this.color;
        this.balls.forEach(ball => ball.draw());
    }
}

resizeCanvas();
let metaball = new Metaball(20, "white");
animate();