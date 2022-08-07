const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
let s1, s2, s3;

window.addEventListener('resize', () => {
    resizeCanvas();
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    s1.angle += (0.4)*Math.PI/180;

    s3.x = s1.x + 2*s1.length*Math.cos(s1.angle)
    s3.y = s1.y;

    s2.x = s1.getEndPos(0);
    s2.y = s1.getEndPos(1)
    s2.angle = Math.atan2(s2.y - s3.y, s3.x - s2.x);


    s4.x = s3.getEndPos(0);
    s4.y = s3.getEndPos(1);
    s4.angle += (1.5)*Math.PI/180;

    s6.x = s4.x + 2*s4.length*Math.cos(s4.angle)
    s6.y = s4.y;

    s5.x = s4.getEndPos(0);
    s5.y = s4.getEndPos(1)
    s5.angle = Math.atan2(s5.y - s6.y, s6.x - s5.x);

    s1.draw();
    s2.draw();
    s3.draw();

    s4.draw();
    s5.draw();
    s6.draw();

    requestAnimationFrame(animate);
}

class Solid {
    constructor(x, y, angle, length) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.length = length;
    }

    getEndPos(i) {
        if (i === 0) {
            return (this.x + this.length*Math.cos(this.angle));
        } else if (i === 1) {
            return (this.y - this.length*Math.sin(this.angle));
        } else {
            return null;
        }
    }

    draw() {
        ctx.fillStyle = "white";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.getEndPos(0), this.getEndPos(1));
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, 2*Math.PI);
        ctx.fill();

        // ctx.strokeStyle = "red";
        // ctx.lineWidth = 1;
        // ctx.beginPath();
        // ctx.arc(this.x, this.y, this.length, 0, 2*Math.PI);
        // ctx.stroke();
    }
}


resizeCanvas();

s1 = new Solid(canvas.width/2, canvas.height/2, 0, 200);
s2 = new Solid(0, 0, 0, 200);
s3 = new Solid(0, 0, 0, 150);

s4 = new Solid(0, 0, 0, 100);
s5 = new Solid(0, 0, 0, 100);
s6 = new Solid(0, 0, 0, 150);

animate();