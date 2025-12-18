
import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}> = ({ children, onClick, variant = 'primary', disabled, className = "", type = "button" }) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:scale-95",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 active:scale-95",
    outline: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:scale-95",
    danger: "bg-red-500 text-white hover:bg-red-600 active:scale-95"
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export const SectionTitle: React.FC<{ title: string; subtitle?: string; icon?: string }> = ({ title, subtitle, icon }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
      {icon && <i className={`${icon} text-blue-600`}></i>}
      {title}
    </h2>
    {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
  </div>
);

export const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white p-6 text-center">
    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-xl font-semibold mb-2">{message}</p>
    <p className="text-slate-300 animate-pulse">我们的AI正在构建您的梦想场景，请稍候...</p>
  </div>
);
