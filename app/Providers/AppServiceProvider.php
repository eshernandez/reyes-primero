<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
            $appUrl = config('app.url');
            if ($appUrl) {
                $appUrl = preg_replace('#^http://#', 'https://', $appUrl);
                URL::forceRootUrl(rtrim($appUrl, '/'));
            }
        } elseif ($this->app->environment('local')) {
            URL::forceScheme('http');
            $appUrl = config('app.url');
            if ($appUrl) {
                $appUrl = preg_replace('#^https://#', 'http://', $appUrl);
                config(['app.url' => $appUrl]);
                URL::forceRootUrl(rtrim($appUrl, '/'));
            }
        }

        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
