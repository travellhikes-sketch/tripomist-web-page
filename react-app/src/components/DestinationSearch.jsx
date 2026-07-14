import React from 'react';

export default function DestinationSearch({ value, onChange, placeholder = "Search here" }) {
  return (
    <div className="relative flex items-center bg-white rounded-full h-12 w-full shadow-[0_4px_15px_-3px_rgba(0,0,0,0.1)] border border-gray-100">
      <input 
        type="text" 
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full h-full bg-transparent outline-none text-[15px] text-gray-700 placeholder-[#136b8a]/90 font-medium px-6 rounded-l-full"
      />
      <div className="absolute right-[-4px] top-[-4px] w-[56px] h-[56px] rounded-full bg-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-gray-100 cursor-pointer text-[#136b8a] hover:bg-gray-50 transition-colors">
        <span className="material-symbols-outlined text-[26px]">search</span>
      </div>
    </div>
  );
}
