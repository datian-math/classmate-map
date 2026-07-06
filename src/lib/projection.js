/**
 * Simple Mercator projection for China map.
 * Bypasses d3-geo which has a bug with this GeoJSON data.
 */

const DEG_TO_RAD = Math.PI / 180

export function createProjection(width, height, centerLng = 104, centerLat = 35.5, scale = 780) {
  function project(lng, lat) {
    const x = (lng - centerLng) * DEG_TO_RAD * scale + width / 2
    const latRad = lat * DEG_TO_RAD
    const centerLatRad = centerLat * DEG_TO_RAD
    const y = (centerLatRad - latRad) * scale + height / 2
    return [x, y]
  }

  return project
}

/**
 * Convert GeoJSON coordinates to SVG path string
 */
export function geoToPath(geometry, project) {
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates
      .map((polygon) => polygonToPath(polygon, project))
      .filter(Boolean)
      .join(' ')
  }
  if (geometry.type === 'Polygon') {
    return polygonToPath(geometry.coordinates, project)
  }
  return ''
}

function polygonToPath(polygon, project) {
  return polygon
    .map((ring, i) => {
      const points = ring.map(([lng, lat]) => {
        const [x, y] = project(lng, lat)
        return `${x},${y}`
      })
      const cmd = i === 0 ? 'M' : 'L'
      return `${cmd}${points.join('L')}Z`
    })
    .join(' ')
}

/**
 * Compute centroid of a GeoJSON feature using its bounding box
 */
export function computeCentroid(geometry, project) {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity

  function traverseCoords(coords) {
    if (typeof coords[0] === 'number') {
      minLng = Math.min(minLng, coords[0])
      maxLng = Math.max(maxLng, coords[0])
      minLat = Math.min(minLat, coords[1])
      maxLat = Math.max(maxLat, coords[1])
    } else {
      coords.forEach(traverseCoords)
    }
  }

  traverseCoords(geometry.coordinates)
  return project((minLng + maxLng) / 2, (minLat + maxLat) / 2)
}
