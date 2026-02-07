<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_view_usuarios_index(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $response = $this->actingAs($user)->get(route('usuarios.index'));

        $response->assertOk();
    }

    public function test_admin_can_view_usuarios_index(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $response = $this->actingAs($user)->get(route('usuarios.index'));

        $response->assertOk();
    }

    public function test_auxiliar_cannot_view_usuarios_index(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_AUXILIAR]);
        $response = $this->actingAs($user)->get(route('usuarios.index'));

        $response->assertForbidden();
    }

    public function test_super_admin_can_access_create_form(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $response = $this->actingAs($user)->get(route('usuarios.create'));

        $response->assertOk();
    }

    public function test_admin_cannot_access_create_form(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $response = $this->actingAs($user)->get(route('usuarios.create'));

        $response->assertForbidden();
    }

    public function test_super_admin_can_store_user(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $payload = [
            'name' => 'Nuevo Usuario',
            'email' => 'nuevo@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => User::ROLE_AUXILIAR,
            'is_active' => true,
        ];

        $response = $this->actingAs($user)->post(route('usuarios.store'), $payload);

        $response->assertRedirect(route('usuarios.index'));
        $this->assertDatabaseHas('users', [
            'name' => 'Nuevo Usuario',
            'email' => 'nuevo@example.com',
            'role' => User::ROLE_AUXILIAR,
        ]);
    }

    public function test_super_admin_can_update_user(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $target = User::factory()->create(['role' => User::ROLE_AUXILIAR]);
        $payload = [
            'name' => 'Nombre Actualizado',
            'email' => $target->email,
            'role' => User::ROLE_ADMIN,
            'is_active' => false,
        ];

        $response = $this->actingAs($admin)->put(route('usuarios.update', $target), $payload);

        $response->assertRedirect(route('usuarios.index'));
        $target->refresh();
        $this->assertSame('Nombre Actualizado', $target->name);
        $this->assertSame(User::ROLE_ADMIN, $target->role);
        $this->assertFalse($target->is_active);
    }

    public function test_super_admin_can_destroy_user(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $target = User::factory()->create(['role' => User::ROLE_AUXILIAR]);

        $response = $this->actingAs($admin)->delete(route('usuarios.destroy', $target));

        $response->assertRedirect(route('usuarios.index'));
        $this->assertSoftDeleted('users', ['id' => $target->id]);
    }

    public function test_user_cannot_destroy_self(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);

        $response = $this->actingAs($user)->delete(route('usuarios.destroy', $user));

        $response->assertForbidden();
    }
}
