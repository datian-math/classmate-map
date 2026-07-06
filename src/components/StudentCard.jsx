export default function StudentCard({ student, onHover, onClick }) {
  return (
    <button
      className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium
        bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors cursor-pointer
        border-none"
      onMouseEnter={(e) => {
        const rect = e.target.getBoundingClientRect()
        onHover?.({
          student,
          x: rect.left,
          y: rect.top - 10,
        })
      }}
      onMouseLeave={() => onHover?.(null)}
      onClick={onClick}
    >
      {student.name}
    </button>
  )
}
