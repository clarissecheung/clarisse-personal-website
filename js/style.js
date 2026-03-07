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

// locally stored data
const data = {
  'click-bed':   { glow: '#glow-bed',   text: '#about-me-text' },
  'click-desk':  { glow: '#glow-desk',  text: '#projects-text' },
  'click-shoes': { glow: '#glow-shoes', text: '#experiences-text' }
}

let activeTextId = null

// just to set up the initial position
function setup () {
  const sprite = nn.get('.sprite')
  sprite.data.frame = 0
  sprite.data.facing = 'right'
  sprite.data.moved = false

  nn.get('.pop-up-exit').on('click', hidePopUp)
  const glowOn = id => document.getElementById(id).style.visibility === 'visible'
  nn.get('#bed').on('click',   () => { if (glowOn('glow-bed'))   showPopUp('#about-me-text')   })
  nn.get('#desk').on('click',  () => { if (glowOn('glow-desk'))  showPopUp('#projects-text')   })
  nn.get('#chair').on('click', () => { if (glowOn('glow-desk'))  showPopUp('#projects-text')   })
  nn.get('#shoes').on('click', () => { if (glowOn('glow-shoes')) showPopUp('#experiences-text') })

  // show instructions on load
  activeTextId = '#instructions-text'
  nn.get('.pop-up-text').css('visibility', 'visible')
  nn.get('.pop-up-exit').css('visibility', 'visible')
  nn.get('.pop-up-exit').css('pointer-events', 'auto')
  nn.get('#instructions-text').css('visibility', 'visible')
}

function showPopUp (textId) {
  if (activeTextId) nn.get(activeTextId).css('visibility', 'hidden')
  activeTextId = textId
  nn.get('.pop-up-text').css('visibility', 'visible')
  nn.get('.pop-up-exit').css('visibility', 'visible')
  nn.get('.pop-up-exit').css('pointer-events', 'auto')
  nn.get(textId).css('visibility', 'visible')
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
    nn.get('#lights-off').css('display', 'none')
    sprite.css('background-image', 'url(images/sprite-sheet.png)')
    sprite.data.moved = true
  }

  const bounds = document.getElementById('bounds-box').getBoundingClientRect()
  const sw = sprite.width
  const sh = sprite.height

  const candX = Math.max(bounds.left, Math.min(newX, bounds.right - sw))
  const candY = Math.max(bounds.top, Math.min(newY, bounds.bottom - sh))

  const obstacles = ['shoes', 'door', 'bed-box', 'desk-box', 'chair-box']
    .map(id => document.getElementById(id).getBoundingClientRect())

  let x = candX
  let y = candY
  for (const obs of obstacles) {
    if (x < obs.right && x + sw > obs.left && curY < obs.bottom && curY + sh > obs.top) {
      x = x > curX ? obs.left - sw : obs.right
    }
    if (curX < obs.right && curX + sw > obs.left && y < obs.bottom && y + sh > obs.top) {
      y = y > curY ? obs.top - sh : obs.bottom
    }
  }

  const scale = sprite.width / FRAME_W
  const sx = -(CROP_X + frame * STEP_X) * scale
  const sy = -(CROP_Y + row  * STEP_Y) * scale

  sprite.position(x, y)
  sprite.css('background-size', `${614 * scale}px ${455 * scale}px`)
  sprite.css('background-position', `${sx}px ${sy}px`)

  sprite.data.frame  = frame
  sprite.data.facing = facing
  sprite.data.relX = (x - bounds.left) / bounds.width
  sprite.data.relY = (y - bounds.top)  / bounds.height
  nearObject()
}

function sit (e) {
  const movementKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's']
  if (!movementKeys.includes(e.key)) return

  const sprite = nn.get('.sprite')
  if (!sprite.data.moved) return

  const row = sprite.data.facing === 'left' ? ROW_LEFT_SIT : ROW_RIGHT_SIT
  const scale = sprite.width / FRAME_W
  const sx = -(CROP_X) * scale
  const sy = -(CROP_Y + row * STEP_Y) * scale
  sprite.css('background-size', `${614 * scale}px ${455 * scale}px`)
  sprite.css('background-position', `${sx}px ${sy}px`)
  nearObject()
}

const glowMap = [
  { box: 'shoes',     glow: '#glow-shoes' },
  { box: 'bed-box',   glow: '#glow-bed'   },
  { box: 'desk-box',  glow: '#glow-desk'  },
  { box: 'chair-box', glow: '#glow-desk'  }
]

function nearObject () {
  const sprite = nn.get('.sprite')
  if (!sprite.data.moved) return

  const dogCX = sprite.left + sprite.width  / 2
  const dogCY = sprite.top  + sprite.height / 2

  const glowVisible = {}
  for (const { box, glow } of glowMap) {
    const rect = document.getElementById(box).getBoundingClientRect()
    const closestX = Math.max(rect.left, Math.min(dogCX, rect.right))
    const closestY = Math.max(rect.top,  Math.min(dogCY, rect.bottom))
    const dist = Math.hypot(dogCX - closestX, dogCY - closestY)
    if (dist < 100) glowVisible[glow] = true
  }
  for (const { glow } of glowMap) {
    nn.get(glow).css('visibility', glowVisible[glow] ? 'visible' : 'hidden')
  }

  document.getElementById('bed').style.cursor   = glowVisible['#glow-bed']   ? 'pointer' : 'default'
  document.getElementById('desk').style.cursor  = glowVisible['#glow-desk']  ? 'pointer' : 'default'
  document.getElementById('chair').style.cursor = glowVisible['#glow-desk']  ? 'pointer' : 'default'
  document.getElementById('shoes').style.cursor = glowVisible['#glow-shoes'] ? 'pointer' : 'default'
}

function hidePopUp () {
  if (activeTextId) nn.get(activeTextId).css('visibility', 'hidden')
  activeTextId = null
  nn.get('.pop-up-text').css('visibility', 'hidden')
  nn.get('.pop-up-exit').css('visibility', 'hidden')
  nn.get('.pop-up-exit').css('pointer-events', 'none')
}

function reposition () {
  const sprite = nn.get('.sprite')
  if (!sprite.data.moved || sprite.data.relX === undefined) return

  const bounds = document.getElementById('bounds-box').getBoundingClientRect()
  const x = bounds.left + sprite.data.relX * bounds.width
  const y = bounds.top  + sprite.data.relY * bounds.height

  sprite.position(x, y)

  const scale = sprite.width / FRAME_W
  const row = sprite.data.facing === 'left' ? ROW_LEFT_SIT : ROW_RIGHT_SIT
  const sx = -CROP_X * scale
  const sy = -(CROP_Y + row * STEP_Y) * scale
  sprite.css('background-size', `${614 * scale}px ${455 * scale}px`)
  sprite.css('background-position', `${sx}px ${sy}px`)
  nearObject()
}

nn.on('load', setup)
nn.on('keydown', move)
nn.on('keyup', sit)
nn.on('resize', reposition)
