/* The shell.
 *
 * The shell is the console itself: the case, the screen, the buttons. It
 * draws the physical state of the device (which buttons are down, where the
 * sticks are pointing) and flips the device over to show the rear triggers.
 */

const SURFACE_WIDTH = 320
const SURFACE_HEIGHT = 240
const STICK_TRAVEL = 40

export class Shell {
  constructor( root, device ) {
    this.root = root
    this.device = device

    this.screen = root.querySelector( "[data-screen]" )
    this.surface = root.querySelector( "[data-screen-surface]" )
    this.buttons = new Map()
    this.sticks = new Map()

    root.querySelectorAll( "[data-button]" ).forEach( ( element ) => {
      this.buttons.set( element.dataset.button, element )
    } )

    root.querySelectorAll( "[data-stick]" ).forEach( ( element ) => {
      this.sticks.set( element.dataset.stick, element.querySelector( ".stick__cap" ) )
    } )

    this.fit = this.fit.bind( this )
    this.onResize = this.onResize.bind( this )

    window.addEventListener( "resize", this.onResize )

    if ( window.ResizeObserver ) {
      this.observer = new ResizeObserver( this.fit )
      this.observer.observe( this.screen )
    }

    this.fit()
  }

  onResize() {
    this.fit()
  }

  fit() {
    if ( !this.screen || !this.surface ) {
      return
    }

    const bounds = this.screen.getBoundingClientRect()
    const scale = Math.min( bounds.width / SURFACE_WIDTH, bounds.height / SURFACE_HEIGHT )

    this.surface.style.setProperty( "--screen-scale", String( scale ) )
  }

  showFront( showing ) {
    this.root.classList.toggle( "is-flipped", !showing )
  }

  toggle() {
    return this.root.classList.toggle( "is-flipped" )
  }

  setPowered( powered ) {
    this.root.classList.toggle( "is-off", !powered )
  }

  renderButton( name, pressed ) {
    const element = this.buttons.get( name )

    if ( element ) {
      element.classList.toggle( "is-pressed", pressed )
    }
  }

  renderStick( side, x, y ) {
    const cap = this.sticks.get( side )

    if ( cap ) {
      cap.style.transform = `translate( ${( x * STICK_TRAVEL ).toFixed( 2 ) }%, ${( y * STICK_TRAVEL ).toFixed( 2 )}% )`
    }
  }

  render( snapshot ) {
    Object.keys( snapshot.buttons ).forEach( ( name ) => {
      this.renderButton( name, snapshot.buttons[ name ] )
    } )

    Object.keys( snapshot.sticks ).forEach( ( side ) => {
      this.renderStick( side, snapshot.sticks[ side ].x, snapshot.sticks[ side ].y )
    } )
  }
}
