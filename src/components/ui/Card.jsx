import { cn } from '../../lib/utils';

export default function Card({ children, className, ...props }) {
    return (
        <div
            className={cn(
                'bg-[#fcf6e8] dark:bg-[#1e1e1e] rounded-xl shadow-md border border-[#D4AF37]/30 overflow-hidden transition-all hover:shadow-lg hover:border-[#D4AF37]/50',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className, ...props }) {
    return <div className={cn('p-6 border-b border-[#D4AF37]/20 bg-[#D4AF37]/5 dark:bg-[#D4AF37]/5', className)} {...props}>{children}</div>;
}

export function CardTitle({ children, className, ...props }) {
    return <h3 className={cn('text-lg font-bold text-[#1a1a1a] dark:text-[#D4AF37] font-display tracking-wide', className)} {...props}>{children}</h3>;
}

export function CardContent({ children, className, ...props }) {
    return <div className={cn('p-6', className)} {...props}>{children}</div>;
}
