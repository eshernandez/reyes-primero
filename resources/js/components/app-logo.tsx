import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-11 shrink-0 items-center justify-center overflow-hidden rounded-md">
                <AppLogoIcon className="size-11 object-contain" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    Reyes Primero
                </span>
            </div>
        </>
    );
}
