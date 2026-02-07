import { Link, usePage } from '@inertiajs/react';
import { Banknote, FileBarChart, FileCheck, FolderOpen, FolderTree, LayoutGrid, PiggyBank, UserCog, Users } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as aportesIndex } from '@/routes/aportes';
import { index as foldersIndex } from '@/routes/folders';
import { index as plansIndex } from '@/routes/plans';
import { index as projectsIndex } from '@/routes/projects';
import { index as titularesIndex } from '@/routes/titulares';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

function useMainNavItems(): NavItem[] {
    const { auth } = usePage().props as { auth?: { user?: { role?: string } } };
    const role = auth?.user?.role ?? '';

    const items: NavItem[] = [
        { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
    ];

    if (role === 'super_admin' || role === 'admin') {
        items.push({ title: 'Proyectos', href: projectsIndex().url, icon: FolderOpen });
        items.push({ title: 'Carpetas', href: foldersIndex().url, icon: FolderTree });
        items.push({ title: 'Planes', href: plansIndex().url, icon: Banknote });
        items.push({ title: 'Aportes', href: aportesIndex().url, icon: PiggyBank });
        items.push({ title: 'Consentimientos', href: '/consents', icon: FileCheck });
        items.push({ title: 'Usuarios', href: '/usuarios', icon: UserCog });
        items.push({ title: 'Informes', href: '/informes', icon: FileBarChart });
    }

    if (role === 'super_admin' || role === 'admin' || role === 'auxiliar') {
        items.push({ title: 'Titulares', href: titularesIndex().url, icon: Users });
    }

    return items;
}

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const mainNavItems = useMainNavItems();
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
