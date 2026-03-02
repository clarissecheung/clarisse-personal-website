/* global nn */

const FRAME_SIZE = 250  // display px per frame (matches CSS width)
const TOTAL_FRAMES = 4  // walk frames: row 0, columns 0-3

function setup () {
  const sprite = nn.get('.sprite')
  sprite.data.frame  = 0
  sprite.data.facing = 'right'
}

function move (e) {
  if (e.key.startsWith('Arrow')) e.preventDefault()

  const sprite = nn.get('.sprite')
  let x      = sprite.x
  let y      = sprite.y
  let frame  = sprite.data.frame
  let facing = sprite.data.facing
  const speed = 25

  if (e.key === 'ArrowLeft' || e.key === 'a') {
    x -= speed
    facing = 'left'
    frame = (frame + 1) % TOTAL_FRAMES
  } else if (e.key === 'ArrowRight' || e.key === 'd') {
    x += speed
    facing = 'right'
    frame = (frame + 1) % TOTAL_FRAMES
  } else if (e.key === 'ArrowUp' || e.key === 'w') {
    y -= speed
    frame = (frame + 1) % TOTAL_FRAMES
  } else if (e.key === 'ArrowDown' || e.key === 's') {
    y += speed
    frame = (frame + 1) % TOTAL_FRAMES
  }

  // swap sprite sheet based on direction
  const sheet = facing === 'left'
    ? 'url(images/left-dog.png)'
    : 'url(images/right-dog.png)'
  sprite.css('background-image', sheet)

  // walk frames are always row 0
  const sx = -(frame * FRAME_SIZE)
  const sy = 0

  sprite.position(x, y)
  sprite.css('background-position', `${sx}px ${sy}px`)

  sprite.data.frame  = frame
  sprite.data.facing = facing
}

nn.on('load', setup)
nn.on('keydown', move)
