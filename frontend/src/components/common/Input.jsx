const Input = ({ label, name, type = 'text', placeholder = '', value,
  onChange, error = '', required = false, disabled = false, icon, className = '' }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            {icon}
          </span>
        )}
        <input
          id={name} name={name} type={type} placeholder={placeholder}
          value={value} onChange={onChange} disabled={disabled} required={required}
          className={`
            w-full bg-gray-50 border rounded-xl px-4 py-3.5
            text-gray-800 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:border-transparent
            transition-all duration-200 disabled:opacity-50
            ${icon ? 'pl-11' : ''}
            ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'}
          `}
        />
      </div>
      {error && <p className="text-xs text-red-500">⚠️ {error}</p>}
    </div>
  );
};

export default Input;