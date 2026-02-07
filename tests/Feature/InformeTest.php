<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InformeTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_view_informes(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $response = $this->actingAs($user)->get(route('informes.index'));

        $response->assertOk();
    }

    public function test_admin_can_view_informes(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $response = $this->actingAs($user)->get(route('informes.index'));

        $response->assertOk();
    }

    public function test_auxiliar_cannot_view_informes(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_AUXILIAR]);
        $response = $this->actingAs($user)->get(route('informes.index'));

        $response->assertForbidden();
    }

    public function test_informes_page_contains_stats(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $response = $this->actingAs($user)->get(route('informes.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('informes/index')
            ->has('stats')
            ->has('statusLabels')
            ->has('projectsForFilter')
            ->has('foldersForFilter'));
    }

    public function test_super_admin_can_download_titulares_excel(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $response = $this->actingAs($user)->get(route('informes.titulares.excel'));

        $response->assertOk();
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->assertStringContainsString('titulares-', $response->headers->get('Content-Disposition', ''));
        $this->assertStringContainsString('.xlsx', $response->headers->get('Content-Disposition', ''));
    }

    public function test_super_admin_can_download_titulares_aportes_excel(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $response = $this->actingAs($user)->get(route('informes.titulares.aportes.excel'));

        $response->assertOk();
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->assertStringContainsString('titulares-aportes-planes-', $response->headers->get('Content-Disposition', ''));
        $this->assertStringContainsString('.xlsx', $response->headers->get('Content-Disposition', ''));
    }
}
