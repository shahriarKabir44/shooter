var canvas = document.getElementById('cnv')

var ctx = canvas.getContext('2d')

$(document).ready(() => {
    $('#my-modal1').modal({ show: true })
})

canvas.width = window.innerWidth
canvas.height = window.innerHeight
var wid = canvas.width
var hgt = canvas.height
var cent = {
    x: wid / 2,
    y: hgt / 2
}
var player = {
    x: wid / 2,
    y: hgt / 2,
    rad: 15,
    color: 'blue',
    render: function () {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.rad, 0, 2 * Math.PI, false)
        ctx.fillStyle = this.color
        ctx.fill()
    }
}
player.render()
var bullets = {}
var counter = 0

var enemies = {}
var enemyCounter = 0

class Bullet {
    constructor(x, y, color, vlc, index) {
        this.x = x
        this.y = y
        this.color = color
        this.vlc = vlc
        this.rad = 6
        this.index = index
    }
    render() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.rad, 0, 2 * Math.PI, false)
        ctx.fillStyle = this.color
        ctx.fill()
    }

    move() {
        this.x += this.vlc.x * 10;
        this.y += this.vlc.y * 10;
        if ((this.x <= 0 || this.x >= wid) || (this.y <= 0 || this.y >= hgt)) {
            this.destroy
            return
        }
        this.render()

    }
    destroy() {
        delete bullets[this.index];
    }

}
var ammo = 25
var friction = 0.99
class ExplosionParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.alpha = 1
        this.dir = {
            x: (Math.random() - 0.5) * (Math.random() * 4 + 7),
            y: (Math.random() - 0.5) * (Math.random() * 4 + 7),

        }
    }

    render() {
        ctx.save()
        ctx.globalAlpha = this.alpha;
        this.alpha -= 0.01
        ctx.beginPath()
        ctx.arc(this.x, this.y, 3, 0, 2 * Math.PI, false)
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.restore()
    }
    move() {
        this.x += this.dir.x;
        this.y += this.dir.y;
        this.dir.x *= friction
        this.dir.y *= friction
        this.render()

    }
}



class Enemy {
    constructor(index, life) {
        this.life = life
        this.rad = this.life * 10 + 10
        this.possibleLocs = [
            [0, Math.floor(Math.random() * hgt)],
            [wid, Math.floor(Math.random() * hgt)],
            [Math.floor(Math.random() * wid), 0],
            [Math.floor(Math.random() * wid), hgt],
        ]
        this.randomState = this.possibleLocs[Math.floor(Math.random() * 4)]
        this.x = this.randomState[0]
        this.y = this.randomState[1]
        this.color = `hsl(${Math.floor(Math.random() * 360)},30%,50%)`

        this.vlc = this.calculateDir()

        this.index = index
        this.speed = 1
    }
    destroy() {
        delete enemies[this.index];
    }
    takeHit() {
        this.rad--

        setTimeout(() => {
            if (this.rad % 10 && this.rad > 0) {
                this.takeHit()
            }
        }, 20)

    }
    calculateDir() {
        var angle = Math.atan2(cent.y - this.y, cent.x - this.x);
        var dir = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        return dir
    }
    render() {
        //this.rad = this.life * 10 + 10
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.rad, 0, 2 * Math.PI, false)
        ctx.fillStyle = this.color
        ctx.fill()

    }
    move() {
        this.x += this.vlc.x * this.speed;
        this.y += this.vlc.y * this.speed;
        if ((this.x <= 0 || this.x >= wid) || (this.y <= 0 || this.y >= hgt)) {
            this.destroy()
            return
        }
        this.render()

    }
}
var colors = ['white']

function reload() {
    ammo++;
    ammo = Math.min(ammo, 25)
}

setInterval(reload, 300)

function generateEnemies() {
    var enm = new Enemy(enemyCounter, Math.floor(Math.random() * 3) + 1)
    enemies[enemyCounter] = enm;
    enemyCounter++
    setTimeout(() => {
        generateEnemies()
    }, 900)
}
generateEnemies()
var stillAlive = 1
var score = 0
var particles = []
function runGame() {
    stillAlive = requestAnimationFrame(runGame)
    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(0, 0, wid, hgt)
    player.render()

    ctx.fill()
    var killed = []
    var success = []
    for (bullet in bullets) {
        bullets[bullet].move()
        for (let enemy in enemies) {
            var dist = Math.hypot(bullets[bullet].x - enemies[enemy].x, bullets[bullet].y - enemies[enemy].y);
            if (dist <= bullets[bullet].rad + enemies[enemy].rad) {
                enemies[enemy].takeHit()
                for (let n = 0; n < enemies[enemy].life * 7; n++) {
                    particles.push(new ExplosionParticle(enemies[enemy].x, enemies[enemy].y, enemies[enemy].color))
                }
                enemies[enemy].life--;
                if (enemies[enemy].life == 0) {
                    killed.push(enemies[enemy])
                    score++

                }
                success.push(bullets[bullet])

            }
        }
    }
    for (let enemy in enemies) {
        enemies[enemy].move()
        var dist = Math.hypot(player.x - enemies[enemy].x, player.y - enemies[enemy].y)
        if (dist <= player.rad + enemies[enemy].rad) {
            document.getElementById('sc').innerHTML = score
            $('#my-modal').modal({ show: true })
            cancelAnimationFrame(stillAlive)
        }
    }
    particles.forEach((part, ind) => {
        part.move();
        if (part.alpha <= 0) particles.splice(ind, 1)
    })

    for (el of killed) el.destroy()
    for (el of success) el.destroy()
    ctx.font = "20px Comic Sans MS";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(`Ammo: ${ammo} Score: ${score}`, 100, 30);

}
window.onclick = (e) => {
    ammo -= 1
    if (ammo < 0) ammo = 0
    if (ammo > 0) {
        var angle = Math.atan2((e.clientY - cent.y), (e.clientX - cent.x))
        var xx = Math.cos(angle)
        var yx = Math.sin(angle)
        var blt1 = new Bullet(player.x, player.y, colors[Math.floor(Math.random() * colors.length)], { x: xx, y: yx }, counter)
        bullets[counter] = blt1
        counter++
    }

}


