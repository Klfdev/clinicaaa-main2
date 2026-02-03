import { cn } from '../../lib/utils';

export default function Card({ children, className, ...props }) {
    return (
        <div
            className={cn(
                'bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-2xl',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className, ...props }) {
    return <div className={cn('p-6 border-b border-gray-100 dark:border-gray-700', className)} {...props}>{children}</div>;
}

export function CardTitle({ children, className, ...props }) {
    return <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-white', className)} {...props}>{children}</h3>;
}

export function CardContent({ children, className, ...props }) {
    return <div className={cn('p-6', className)} {...props}>{children}</div>;
}
