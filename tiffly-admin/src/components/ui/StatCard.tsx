interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string; // background color (optional)
}

export const StatCard = ({ title, value, icon, color = "bg-indigo-50" }: StatCardProps) => {
  return (
    <div
      className={`flex items-center gap-4 p-6 rounded-xl shadow-sm border border-gray-200 ${color}`}
    >
      {/* Icon */}
      <div className="text-3xl text-indigo-600">{icon}</div>

      {/* Info */}
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
};
