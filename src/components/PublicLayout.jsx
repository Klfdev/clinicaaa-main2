import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100">
            {/* Simple Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm py-4">
                <div className="container mx-auto px-4 flex justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <span className="text-white font-bold text-xl">P</span>
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                            PetClínica
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <Outlet />
            </main>

            {/* Simple Footer */}
            <footer className="py-6 text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} PetClínica. Agendamento Online.</p>
            </footer>
        </div>
    );
}
