/* global nn */

const FRAME_W = 145   // frame content width (242 * 0.6)
const FRAME_H = 106   // frame content height (176 * 0.6)
const STEP_X = 152   // (253 * 0.6)
const STEP_Y = 112   // (187 * 0.6)
const CROP_X = 7     // (11 * 0.6)
const CROP_Y = 7     // (11 * 0.6)
const WALK_FRAMES = 4     // number of walk animation columns

const ROW_RIGHT_WALK = 0
const ROW_RIGHT_SIT = 1
const ROW_LEFT_WALK = 2
const ROW_LEFT_SIT = 3

// returns true if next move is blocked, false if not
function isBlocked (x, y) {
  const sprite  = nn.get('.sprite')
  const blockers = document.querySelectorAll('.blocker')

  // temporarily move sprite to test position, read its viewport rect, then restore
  const origX = sprite.x
  const origY = sprite.y
  sprite.position(x, y)
  const dogLeft = sprite.left
  const dogRight = sprite.right
  const dogTop = sprite.top
  const dogBottom = sprite.bottom
  sprite.position(origX, origY)

  for (const b of blockers) {
    const r = b.getBoundingClientRect()
    if (dogRight > r.left && dogLeft < r.right &&
        dogBottom > r.top  && dogTop < r.bottom) {
      return true
    }
  }
  return false
}

// just to set up the initial position
function setup () {
  const sprite = nn.get('.sprite')
  sprite.data.frame = 0
  sprite.data.facing = 'right'
  sprite.data.moved = false

  nn.get('#click-bed').on('click', popUp)
  nn.get('#click-desk').on('click', popUp)
  nn.get('#click-shoes').on('click', popUp)
  nn.get('.pop-up-exit').on('click', hidePopUp)
}

function move (e) {
  if (e.key.startsWith('Arrow')) e.preventDefault()

  const sprite = nn.get('.sprite')
  const curX = sprite.x
  const curY = sprite.y
  let newX = curX
  let newY = curY
  let frame = sprite.data.frame
  let facing = sprite.data.facing
  const speed = 25
  let row

  if (e.key === 'ArrowLeft' || e.key === 'a') {
    newX -= speed
    facing = 'left'
    row = ROW_LEFT_WALK
    frame = (frame + 1) % WALK_FRAMES
  } else if (e.key === 'ArrowRight' || e.key === 'd') {
    newX += speed
    facing = 'right'
    row = ROW_RIGHT_WALK
    frame = (frame + 1) % WALK_FRAMES
  } else if (e.key === 'ArrowUp' || e.key === 'w') {
    newY -= speed
    row = facing === 'left' ? ROW_LEFT_WALK : ROW_RIGHT_WALK
    frame = (frame + 1) % WALK_FRAMES
  } else if (e.key === 'ArrowDown' || e.key === 's') {
    newY += speed
    row = facing === 'left' ? ROW_LEFT_WALK : ROW_RIGHT_WALK
    frame = (frame + 1) % WALK_FRAMES
  } else {
    return
  }

  // switch from laying-down to walking sprite on first movement
  if (!sprite.data.moved) {
    nn.get('.laying-down').css('display', 'none')
    sprite.css('background-image', 'url(images/sprite-sheet.png)')
    sprite.css('background-size', '614px 455px')
    sprite.data.moved = true
  }

  const x = isBlocked(newX, curY) ? curX : newX
  const y = isBlocked(curX, newY) ? curY : newY

  const sx = -(CROP_X + frame * STEP_X)
  const sy = -(CROP_Y + row  * STEP_Y)

  sprite.position(x, y)
  sprite.css('background-position', `${sx}px ${sy}px`)

  sprite.data.frame  = frame
  sprite.data.facing = facing
  nearObject()
}

function sit (e) {
  const movementKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's']
  if (!movementKeys.includes(e.key)) return

  const sprite = nn.get('.sprite')
  if (!sprite.data.moved) return

  const row = sprite.data.facing === 'left' ? ROW_LEFT_SIT : ROW_RIGHT_SIT
  const sx = -(CROP_X)
  const sy = -(CROP_Y + row * STEP_Y)
  sprite.css('background-position', `${sx}px ${sy}px`)
  nearObject()
}

function nearObject () {
  const sprite = nn.get('.sprite')
  if (!sprite.data.moved) return

  const dogCX = sprite.left + sprite.width  / 2
  const dogCY = sprite.top  + sprite.height / 2

  const objects = [
    { clicker: '#click-bed', glow: '#glow-bed', threshold: 75 },
    { clicker: '#click-desk', glow: '#glow-desk', threshold: 75 },
    { clicker: '#click-shoes', glow: '#glow-shoes', threshold: 100 }
  ]

  for (const obj of objects) {
    const element = nn.get(obj.clicker)
    const closestX = Math.max(element.left, Math.min(dogCX, element.right))
    const closestY = Math.max(element.top,  Math.min(dogCY, element.bottom))
    const dist = Math.hypot(dogCX - closestX, dogCY - closestY)
    nn.get(obj.glow).css('visibility', dist < obj.threshold ? 'visible' : 'hidden')
  }
}

function popUp () {
  const glowMap = {
    'click-bed':   '#glow-bed',
    'click-desk':  '#glow-desk',
    'click-shoes': '#glow-shoes'
  }
  const glowId = glowMap[this.id]
  if (document.querySelector(glowId).style.visibility !== 'visible') return
  nn.get('.pop-up-text').css('visibility', 'visible')
  nn.get('.pop-up-exit').css('visibility', 'visible')
  nn.get('.pop-up-exit').css('pointer-events', 'auto')
}

function hidePopUp () {
  nn.get('.pop-up-text').css('visibility', 'hidden')
  nn.get('.pop-up-exit').css('visibility', 'hidden')
  nn.get('.pop-up-exit').css('pointer-events', 'none')
}

nn.on('load', setup)
nn.on('keydown', move)
nn.on('keyup', sit)
