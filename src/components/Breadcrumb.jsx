import { Link } from 'react-router-dom'

export default function Breadcrumb({ items }) {
  return (
    <nav className="text-sm text-gray-500 mb-4">
      {items.map((item, index) => (
        <span key={index}>
          {index > 0 && <span className="mx-1">&gt;</span>}
          {item.to ? (
            <Link to={item.to} className="text-orange-500 hover:underline no-underline">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-800">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
