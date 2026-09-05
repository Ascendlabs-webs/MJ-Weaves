/* MJ Weaves — Sanity live product source.
 *
 * Reads products from the public Sanity dataset over the CDN (no tokens
 * in the browser). Loaded BEFORE the main product script in index.html.
 *
 * Contract with index.html:
 *   window.__MJ_SANITY__.fetchProducts() -> Promise<[{id,img,title,color,hex,price,desc,soldOut}]>
 * Any failure (no project id, network blocked, empty CMS) rejects, and
 * index.html silently falls through to products.json, then to the
 * embedded FALLBACK_PRODUCTS. The shop never breaks because of Sanity.
 */
(function () {
  "use strict";

  // TODO: set after creating the Sanity project (sanity.io/manage).
  // Kept as a plain const: safe to commit, public dataset needs no secret.
  var PROJECT_ID = "SANITY_PROJECT_ID";
  var DATASET = "production";
  var API_VERSION = "v2025-01-01";

  function isConfigured() {
    return !!PROJECT_ID && PROJECT_ID !== "SANITY_PROJECT_ID";
  }

  // "image-<assetId>-<WxH>-<format>" -> CDN URL with sizing params.
  function sanityImageUrl(ref, w) {
    var m = /^image-([A-Za-z0-9]+)-(\d+x\d+)-([a-z]+)$/.exec(ref || "");
    if (!m) return "";
    return (
      "https://cdn.sanity.io/images/" +
      PROJECT_ID + "/" + DATASET + "/" +
      m[1] + "-" + m[2] + "." + m[3] +
      "?w=" + (w || 800) + "&auto=format"
    );
  }

  // Sanity product doc -> the exact shape the grid/quick-view code expects.
  function mapProduct(doc) {
    var photoRef = doc.photoRef || (doc.photo && doc.photo.asset && doc.photo.asset._ref) || "";
    return {
      id: doc.code,
      img: photoRef
        ? sanityImageUrl(photoRef, 800)
        : (doc.photoUrl || doc.legacyImg || ""),
      title: doc.name,
      color: doc.shade,
      hex: doc.shadeHex || "#B8892B",
      price: doc.price,
      desc: doc.description || "",
      category: doc.category || "",
      kind: doc.kind || "saree",
      sizes: doc.sizes && doc.sizes.length ? doc.sizes : undefined,
      // 'held' also shows the sold-out badge (matches current storefront behaviour)
      soldOut: doc.status ? doc.status !== "in-stock" : !!doc.soldOut,
    };
  }

  var QUERY = encodeURIComponent(
    '*[_type == "product"]{code, name, shade, shadeHex, price, description, status, featured, category, kind, sizes, ' +
    '"photoRef": photo.asset._ref, photoUrl, legacyImg, soldOut} | order(featured desc, code asc)'
  );

  function fetchProducts() {
    if (!isConfigured()) return Promise.reject(new Error("sanity: project id not set"));
    return fetch(
      "https://" + PROJECT_ID + ".api.sanity.io/" + API_VERSION +
      "/data/query/" + DATASET + "?query=" + QUERY
    )
      .then(function (r) {
        if (!r.ok) throw new Error("sanity: HTTP " + r.status);
        return r.json();
      })
      .then(function (j) {
        var docs = ((j && j.result) || []).filter(function (d) { return d && d.code && d.name; });
        if (!docs.length) throw new Error("sanity: no products published");
        return docs.map(mapProduct);
      });
  }

  window.__MJ_SANITY__ = {
    fetchProducts: fetchProducts,
    isConfigured: isConfigured,
    mapProduct: mapProduct,
  };
})();
