import { cn } from '../../lib/utils';


export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className,
    isLoading,
    disabled,
    ...props
}) {
    const variants = {
        primary: 'bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#b5952f] shadow-lg shadow-[#D4AF37]/30 font-bold tracking-wide',
        secondary: 'bg-[#1a1a1a] text-[#D4AF37] border border-[#D4AF37]/50 hover:bg-[#2c2c2c] shadow-sm',
        outline: 'border-2 border-[#D4AF37] text-[#1a1a1a] dark:text-[#D4AF37] hover:bg-[#D4AF37]/10',
        ghost: 'hover:bg-[#D4AF37]/10 text-[#1a1a1a] dark:text-[#f4ecd8]',
        danger: 'bg-red-900/90 text-white hover:bg-red-800 border border-red-700 shadow-red-900/20',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
        icon: 'p-2',
    };

    return (
        <button
            className={cn(
                'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <span className="mr-2">
                    <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                </span>
            )}
            {children}
        </button>
    );
}
