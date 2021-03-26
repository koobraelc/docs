var seed = parseInt(tokenData.hash.slice(0, 16), 16);

var DEFAULT_SIZE = 500
var DIM = Math.min(window.innerWidth, window.innerHeight)
var M = DIM/DEFAULT_SIZE // Keep things relative
var STEP = 100 * M

function weird_line(x, y, width, height) {
  stroke(255)
  strokeWeight(rnd_num(1,10) * M)
  strokeJoin(ROUND)
  if(rnd_num() > 0.5) {
    line(x, y, x+width, y+height)
    line(y, x, y+height, x+width)
  } else {
    line(x+width, y, x, y+height)
    line(y, x-width, y+height, x)
  }
}
function setup() {
  createCanvas(DIM, DIM)
  background(0)
  for(let x = 0; x < DIM+1; x += STEP) {
    for(let y = 0; y < DIM+1; y += STEP) {
      weird_line(x, y, STEP, STEP)
    }
  }
}

function rnd_dec() {
  seed ^= seed << 13
  seed ^= seed >> 17
  seed ^= seed << 5
  return ((seed < 0 ? ~seed + 1 : seed) % 1000) / 1000
}
function rnd_num(a, b) {
  return a + (b - a) * rnd_dec()
}