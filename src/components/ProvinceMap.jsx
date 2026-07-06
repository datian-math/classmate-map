import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProjection, geoToPath, computeCentroid } from '../lib/projection'
import StudentCard from './StudentCard'

const WIDTH = 800
const HEIGHT = 600

export default function ProvinceMap({ provinceCode, students = [] }) {
  const [geoData, setGeoData] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const navigate = useNavigate()

  const cityStudents = {}
  students.forEach((s) => {
    if (!cityStudents[s.city]) cityStudents[s.city] = []
    cityStudents[s.city].push(s)
  })

  useEffect(() => {
    fetch(`/maps/provinces/${provinceCode}.json`)
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Failed to load province map:', err))
  }, [provinceCode])

  if (!geoData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        省份地图加载中...
      </div>
    )
  }

  // Compute province center and scale from actual coordinates
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
  geoData.features.forEach((f) => traverseCoords(f.geometry.coordinates))

  const centerLng = (minLng + maxLng) / 2
  const centerLat = (minLat + maxLat) / 2
  const lngSpan = maxLng - minLng
  const latSpan = maxLat - minLat

  // Calculate scale to fit the province in the SVG
  const padding = 60
  const scaleX = (WIDTH - padding * 2) / (lngSpan * Math.PI / 180)
  const scaleY = (HEIGHT - padding * 2) / (latSpan * Math.PI / 180)
  const scale = Math.min(scaleX, scaleY)

  const project = createProjection(WIDTH, HEIGHT, centerLng, centerLat, scale)

  function matchCity(featureName) {
    const cityName = featureName
      .replace(/土家族苗族自治州/g, '')
      .replace(/苗族侗族自治州/g, '')
      .replace(/壮族苗族自治州/g, '')
      .replace(/藏族自治州/g, '')
      .replace(/彝族自治州/g, '')
      .replace(/地区/g, '')
      .replace(/自治州/g, '')
      .replace(/市|盟|区|县|林区/g, '')
    return Object.keys(cityStudents).find(
      (c) => c.includes(cityName) || cityName.includes(c)
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-h-[500px]">
        <svg
          width={WIDTH}
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%', background: '#f5f0e8' }}
        >
          {geoData.features.map((feature, i) => {
            const d = geoToPath(feature.geometry, project)
            if (!d) return null
            const matchedCity = matchCity(feature.properties.name)
            const hasStudents = !!matchedCity
            const shortName = (feature.properties.name || '')
              .replace(/土家族苗族自治州/g, '')
              .replace(/苗族侗族自治州/g, '')
              .replace(/壮族苗族自治州/g, '')
              .replace(/藏族自治州/g, '')
              .replace(/彝族自治州/g, '')
              .replace(/地区/g, '')
              .replace(/自治州/g, '')
              .replace(/市|盟|区|县|林区/g, '')
            const centroid = computeCentroid(feature.geometry, project)

            return (
              <g key={i}>
                <path
                  d={d}
                  fill={hasStudents ? '#fed7aa' : '#e8d5b7'}
                  stroke="#8b7355"
                  strokeWidth={0.8}
                />
                {shortName && isFinite(centroid[0]) && (
                  <text
                    x={centroid[0]}
                    y={centroid[1] - 4}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight="bold"
                    fill="#4a3728"
                    style={{ pointerEvents: 'none' }}
                  >
                    {shortName}
                  </text>
                )}
                {hasStudents && isFinite(centroid[0]) && (
                  <text
                    x={centroid[0]}
                    y={centroid[1] + 10}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#ea580c"
                    style={{ pointerEvents: 'none' }}
                  >
                    {cityStudents[matchedCity].length}人
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="lg:w-72 bg-white rounded-xl shadow-sm p-4 max-h-[600px] overflow-y-auto">
        <h3 className="font-bold text-gray-800 mb-3">
          同学列表
          <span className="text-sm font-normal text-gray-400 ml-2">{students.length}人</span>
        </h3>
        {students.length === 0 ? (
          <p className="text-gray-400 text-sm">该省暂无同学</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(cityStudents).map(([city, list]) => (
              <div key={city}>
                <h4 className="text-sm font-medium text-gray-600 mb-1.5">{city}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((s) => (
                    <StudentCard
                      key={s.id}
                      student={s}
                      onHover={setTooltip}
                      onClick={() => navigate(`/student/${s.id}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {tooltip && (
        <div
          className="fixed bg-white shadow-lg rounded-lg p-3 border border-gray-200 z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y - 80 }}
        >
          <p className="font-bold text-gray-800">{tooltip.student.name}</p>
          <p className="text-sm text-gray-600">{tooltip.student.university}</p>
          {tooltip.student.phone && (
            <p className="text-sm text-gray-500">📱 {tooltip.student.phone}</p>
          )}
          {tooltip.student.wechat && (
            <p className="text-sm text-gray-500">💬 {tooltip.student.wechat}</p>
          )}
        </div>
      )}
    </div>
  )
}
