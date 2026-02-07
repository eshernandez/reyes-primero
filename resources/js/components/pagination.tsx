import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginationProps = {
    links: PaginationLink[];
    className?: string;
};

export function Pagination({ links, className }: PaginationProps) {
    if (links.length <= 1) {
        return null;
    }
    const prevLink = links[0];
    const nextLink = links[links.length - 1];
    const pageLinks = links.slice(1, -1);

    return (
        <nav role="navigation" aria-label="Paginación" className={cn('flex items-center justify-center gap-1', className)}>
            <Button
                variant="outline"
                size="sm"
                asChild={!!prevLink?.url}
                disabled={!prevLink?.url}
                className="min-w-[2rem]"
            >
                {prevLink?.url ? (
                    <Link href={prevLink.url}>
                        <span dangerouslySetInnerHTML={{ __html: prevLink.label }} />
                    </Link>
                ) : (
                    <span dangerouslySetInnerHTML={{ __html: prevLink?.label ?? 'Anterior' }} />
                )}
            </Button>
            <div className="flex items-center gap-1">
                {pageLinks.map((link, i) => (
                    <Button
                        key={i}
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
                        asChild={!!link.url && !link.active}
                        disabled={!link.url}
                        className="min-w-[2rem]"
                    >
                        {link.url && !link.active ? (
                            <Link href={link.url}>
                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                            </Link>
                        ) : (
                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                        )}
                    </Button>
                ))}
            </div>
            <Button
                variant="outline"
                size="sm"
                asChild={!!nextLink?.url}
                disabled={!nextLink?.url}
                className="min-w-[2rem]"
            >
                {nextLink?.url ? (
                    <Link href={nextLink.url}>
                        <span dangerouslySetInnerHTML={{ __html: nextLink.label }} />
                    </Link>
                ) : (
                    <span dangerouslySetInnerHTML={{ __html: nextLink?.label ?? 'Siguiente' }} />
                )}
            </Button>
        </nav>
    );
}
