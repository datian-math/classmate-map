import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProjection, geoToPath, computeCentroid } from '../lib/projection'
import { provinceNameMap } from '../lib/provinceMap'

const WIDTH = 800
const HEIGHT = 600

// Build reverse lookup: Chinese name -> pinyin code
const nameToCode = {}
for (const [code, name] of Object.entries(provinceNameMap)) {
  nameToCode[name] = code
}

function findProvinceCode(featureName) {
  if (!featureName) return null
  if (nameToCode[featureName]) return nameToCode[featureName]
  const cleaned = featureName
    .replace(/壮族自治区/g, '')
    .replace(/回族自治区/g, '')
    .replace(/维吾尔自治区/g, '')
    .replace(/特别行政区/g, '')
    .replace(/自治区/g, '')
    .replace(/省/g, '')
    .replace(/市/g, '')
  if (nameToCode[cleaned]) return nameToCode[cleaned]
  for (const [code, name] of Object.entries(provinceNameMap)) {
    if (featureName.startsWith(name)) return code
  }
  return null
}

function getFill(code, provinceCounts) {
  const count = provinceCounts[code] || 0
  if (count === 0) return '#e8d5b7'
  if (count <= 2) return '#fdba74'
  if (count <= 5) return '#fb923c'
  if (count <= 10) return '#f97316'
  return '#ea580c'
}

function getHoverFill(code, provinceCounts) {
  const count = provinceCounts[code] || 0
  return count > 0 ? '#c2410c' : '#d4c4a8'
}

// Manual label offsets for provinces where centroid overlaps with neighbors
// or is outside the visible area
const labelOffsets = {
  beijing: { dx: 18, dy: -16 },    // 北京偏右上方
  tianjin: { dx: 18, dy: 6 },       // 天津偏右方
  hebei: { dx: -20, dy: -8 },       // 河北偏左
  shanghai: { dx: 16, dy: 0 },      // 上海偏右
  jiangsu: { dx: -8, dy: -12 },     // 江苏偏上
  zhejiang: { dx: 16, dy: 8 },      // 浙江偏右下
  anhui: { dx: -14, dy: 8 },        // 安徽偏左下
  xianggang: { dx: 14, dy: 8 },     // 香港偏右下
  aomen: { dx: 14, dy: -8 },        // 澳门偏右上
  hainan: { dy: -12 },              // 海南往上移
  ningxia: { dx: -16, dy: -10 },    // 宁夏偏左上
  chongqing: { dx: -14, dy: 8 },    // 重庆偏左下
  shaanxi: { dx: 8, dy: 12 },        // 陕西偏下
}

export default function ChinaMap({ students = [] }) {
  const [geoData, setGeoData] = useState(null)
  const [hoveredProvince, setHoveredProvince] = useState(null)
  const navigate = useNavigate()

  const provinceCounts = {}
  students.forEach((s) => {
    provinceCounts[s.province] = (provinceCounts[s.province] || 0) + 1
  })

  useEffect(() => {
    fetch('/maps/china.json')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Failed to load China map:', err))
  }, [])

  if (!geoData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        地图加载中...
      </div>
    )
  }

  const project = createProjection(WIDTH, HEIGHT)

  return (
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
        const code = findProvinceCode(feature.properties.name)
        const isHovered = hoveredProvince === code
        const shortName = (feature.properties.name || '')
          .replace(/壮族自治区/g, '')
          .replace(/回族自治区/g, '')
          .replace(/维吾尔自治区/g, '')
          .replace(/特别行政区/g, '')
          .replace(/自治区/g, '')
          .replace(/省/g, '')
          .replace(/市/g, '')
        const centroid = computeCentroid(feature.geometry, project)
        const offset = labelOffsets[code] || {}
        const labelX = centroid[0] + (offset.dx || 0)
        const labelY = centroid[1] + (offset.dy || 0)
        const count = provinceCounts[code] || 0

        return (
          <g key={i}>
            <path
              d={d}
              fill={isHovered ? getHoverFill(code, provinceCounts) : getFill(code, provinceCounts)}
              stroke={isHovered ? '#5a4030' : '#8b7355'}
              strokeWidth={isHovered ? 1.5 : 0.8}
              style={{ cursor: code ? 'pointer' : 'default' }}
              onMouseEnter={() => code && setHoveredProvince(code)}
              onMouseLeave={() => setHoveredProvince(null)}
              onClick={() => code && navigate(`/province/${code}`)}
            />
            {shortName && isFinite(labelX) && (
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={shortName.length > 3 ? 8 : 10}
                fill="#4a3728"
                style={{ pointerEvents: 'none' }}
              >
                {shortName}
              </text>
            )}
            {count > 0 && isFinite(centroid[0]) && (
              <>
                <circle
                  cx={centroid[0]}
                  cy={centroid[1] - 14}
                  r={9}
                  fill="#f97316"
                  stroke="#fff"
                  strokeWidth={1.5}
                  style={{ pointerEvents: 'none' }}
                />
                <text
                  x={centroid[0]}
                  y={centroid[1] - 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={9}
                  fontWeight="bold"
                  fill="#fff"
                  style={{ pointerEvents: 'none' }}
                >
                  {count}
                </text>
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}
