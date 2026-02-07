<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_view_plans_index(): void
    {
        $response = $this->get(route('plans.index'));
        $response->assertRedirect(route('login'));
    }

    public function test_admin_can_view_plans_index(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $response = $this->actingAs($user)->get(route('plans.index'));

        $response->assertOk();
    }

    public function test_admin_can_create_plan(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);

        $response = $this->actingAs($user)->post(route('plans.store'), [
            'nombre' => 'Plan Test',
            'descripcion' => 'Descripción del plan',
            'valor_ingreso' => 1000,
            'fecha_cierre' => now()->addMonth()->format('Y-m-d'),
        ]);

        $response->assertRedirect(route('plans.index'));
        $this->assertDatabaseHas('plans', [
            'nombre' => 'Plan Test',
            'valor_ingreso' => 1000,
            'created_by' => $user->id,
        ]);
    }

    public function test_admin_can_update_plan(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $plan = Plan::query()->create([
            'nombre' => 'Plan Original',
            'descripcion' => null,
            'valor_ingreso' => 500,
            'fecha_cierre' => null,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->put(route('plans.update', $plan), [
            'nombre' => 'Plan Actualizado',
            'descripcion' => 'Nueva descripción',
            'valor_ingreso' => 750,
            'fecha_cierre' => now()->addMonths(2)->format('Y-m-d'),
        ]);

        $response->assertRedirect(route('plans.index'));
        $plan->refresh();
        $this->assertSame('Plan Actualizado', $plan->nombre);
        $this->assertSame(750.0, (float) $plan->valor_ingreso);
    }

    public function test_auxiliar_cannot_view_plans_index(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_AUXILIAR]);
        $response = $this->actingAs($user)->get(route('plans.index'));

        $response->assertForbidden();
    }
}
