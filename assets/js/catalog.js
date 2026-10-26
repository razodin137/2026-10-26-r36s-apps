/* The cartridge catalog.
 *
 * The shell asks the server what cartridges exist by fetching a single JSON
 * file. The dev server rebuilds that file on every request, so a folder
 * dropped into `cartridges/` appears in the menu straight away.
 */

const CATALOG_URLS = [ "cartridges/catalog.json", "/cartridges/catalog.json" ]

function normalize( cartridge ) {
  return {
    slug: String( cartridge.slug || "" ),
    title: String( cartridge.title || cartridge.slug || "Untitled" ),
    author: String( cartridge.author || "Unknown" ),
    version: String( cartridge.version || "0.0.0" ),
    description: String( cartridge.description || "" ),
    entry: String( cartridge.entry || "index.html" ),
    url: String( cartridge.url || "" ),
    tags: Array.isArray( cartridge.tags ) ? cartridge.tags.map( String ) : []
  }
}

export async function loadCatalog( urls = CATALOG_URLS ) {
  let failure = null

  for ( const url of urls ) {
    try {
      const response = await fetch( url, { cache: "no-store" } )

      if ( !response.ok ) {
        continue
      }

      const catalog = await response.json()

      return {
        version: Number( catalog.version || 1 ),
        generatedAt: String( catalog.generatedAt || "" ),
        cartridges: ( catalog.cartridges || [] ).map( normalize )
      }
    } catch ( error ) {
      failure = error
    }
  }

  throw new Error( failure ? failure.message : "Could not load the cartridge catalog" )
}
