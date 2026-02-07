import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AppLayoutProps } from '@/types';

type Flash = { success?: string; error?: string };

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const flash = (usePage().props.flash as Flash | undefined) ?? {};

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {flash.success && (
                    <div className="px-4 pt-2">
                        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
                            <AlertDescription>{flash.success}</AlertDescription>
                        </Alert>
                    </div>
                )}
                {flash.error && (
                    <div className="px-4 pt-2">
                        <Alert variant="destructive">
                            <AlertDescription>{flash.error}</AlertDescription>
                        </Alert>
                    </div>
                )}
                {children}
            </AppContent>
        </AppShell>
    );
}
