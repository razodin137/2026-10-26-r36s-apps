/* Snake, the reference cartridge.
 *
 * It shows the whole cartridge API in one file: reading the D-pad, reading a
 * stick, drawing to the screen, and keeping a save file between visits.
 */

const CELL = 16
const COLUMNS = 20
const ROWS = 15
const TICK = 120

const canvas = document.getElementById( "screen" )
const context = canvas.getContext( "2d" )

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
}

let snake = []
let food = null
let direction = DIRECTIONS.right
let queued = null
let score = 0
let best = 0
let state = "ready"
let lastTick = 0

function reset() {
  snake = [ { x: 8, y: 7 }, { x: 7, y: 7 }, { x: 6, y: 7 } ]
  direction = DIRECTIONS.right
  queued = null
  score = 0
  state = "ready"
  placeFood()
}

function placeFood() {
  const free = []

  for ( let y = 0; y < ROWS; y += 1 ) {
    for ( let x = 0; x < COLUMNS; x += 1 ) {
      if ( !snake.some( ( segment ) => segment.x === x && segment.y === y ) ) {
        free.push( { x, y } )
      }
    }
  }

  food = free.length > 0 ? free[ Math.floor( Math.random() * free.length ) ] : null
}

function turn( next ) {
  queued = next
}

function step() {
  if ( queued && ( queued.x !== -direction.x || queued.y !== -direction.y ) ) {
    direction = queued
  }

  const head = snake[ 0 ]
  const next = { x: head.x + direction.x, y: head.y + direction.y }
  const hitsWall = next.x < 0 || next.y < 0 || next.x >= COLUMNS || next.y >= ROWS
  const hitsSelf = snake.some( ( segment ) => segment.x === next.x && segment.y === next.y )

  if ( hitsWall || hitsSelf ) {
    state = "over"
    saveBest()

    return
  }

  snake.unshift( next )

  if ( food && next.x === food.x && next.y === food.y ) {
    score += 1
    saveBest()
    placeFood()
  } else {
    snake.pop()
  }
}

function saveBest() {
  if ( score <= best ) {
    return
  }

  best = score
  R36S.save( { best } )
}

function readSave() {
  const save = R36S.load()

  best = save && Number.isFinite( save.best ) ? save.best : 0
}

function readDirection() {
  if ( R36S.input.pressed( "up" ) ) {
    return DIRECTIONS.up
  }

  if ( R36S.input.pressed( "down" ) ) {
    return DIRECTIONS.down
  }

  if ( R36S.input.pressed( "left" ) ) {
    return DIRECTIONS.left
  }

  if ( R36S.input.pressed( "right" ) ) {
    return DIRECTIONS.right
  }

  const axis = R36S.input.axis( "left" )

  if ( Math.abs( axis.x ) > Math.abs( axis.y ) ) {
    return axis.x > 0 ? DIRECTIONS.right : DIRECTIONS.left
  }

  if ( Math.abs( axis.y ) > 0.5 ) {
    return axis.y > 0 ? DIRECTIONS.down : DIRECTIONS.up
  }

  return null
}

function update( time ) {
  const stick = readDirection()

  if ( stick ) {
    turn( stick )
  }

  if ( R36S.input.pressed( "a" ) ) {
    if ( state === "ready" ) {
      state = "playing"
    } else if ( state === "playing" ) {
      state = "paused"
    } else {
      reset()
      state = "playing"
    }
  }

  if ( R36S.input.pressed( "start" ) ) {
    reset()
    state = "playing"
  }

  if ( state === "playing" && time - lastTick >= TICK ) {
    lastTick = time
    step()
  }
}

function drawText( text, x, y ) {
  context.fillStyle = "#c9d1d9"
  context.font = "10px ui-monospace, Menlo, Consolas, monospace"
  context.fillText( text, x, y )
}

function drawPanel( text ) {
  context.fillStyle = "rgba(16, 19, 26, 0.85)"
  context.fillRect( 0, canvas.height / 2 - 18, canvas.width, 36 )

  context.fillStyle = "#e6edf3"
  context.font = "bold 14px ui-monospace, Menlo, Consolas, monospace"
  context.textAlign = "center"
  context.fillText( text, canvas.width / 2, canvas.height / 2 + 5 )
  context.textAlign = "left"
}

function draw() {
  context.fillStyle = "#10131a"
  context.fillRect( 0, 0, canvas.width, canvas.height )

  context.fillStyle = "#1b2230"
  for ( let y = 0; y < ROWS; y += 1 ) {
    for ( let x = 0; x < COLUMNS; x += 1 ) {
      context.fillRect( x * CELL, y * CELL, CELL - 1, CELL - 1 )
    }
  }

  if ( food ) {
    context.fillStyle = "#ff5c5c"
    context.fillRect( food.x * CELL + 3, food.y * CELL + 3, CELL - 7, CELL - 7 )
  }

  context.fillStyle = "#7ee787"
  snake.forEach( ( segment, index ) => {
    context.globalAlpha = index === 0 ? 1 : 0.75
    context.fillRect( segment.x * CELL, segment.y * CELL, CELL - 1, CELL - 1 )
  } )
  context.globalAlpha = 1

  drawText( `SCORE ${score}`, 8, 16 )
  drawText( `BEST ${best}`, 8, 30 )

  if ( state === "ready" ) {
    drawPanel( "PRESS A TO START" )
  } else if ( state === "paused" ) {
    drawPanel( "PAUSED" )
  } else if ( state === "over" ) {
    drawPanel( "GAME OVER" )
  }
}

R36S.on( "ready", () => {
  readSave()
  reset()
  R36S.setTitle( "Snake" )
} )

R36S.frame( ( time ) => {
  update( time )
  draw()
} )
