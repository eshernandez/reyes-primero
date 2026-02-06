<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FolderManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_folders_index(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $response = $this->actingAs($user)->get(route('folders.index'));

        $response->assertOk();
    }

    public function test_super_admin_can_view_folders_index(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $response = $this->actingAs($user)->get(route('folders.index'));

        $response->assertOk();
    }

    public function test_auxiliar_cannot_view_folders_index(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_AUXILIAR]);
        $response = $this->actingAs($user)->get(route('folders.index'));

        $response->assertForbidden();
    }

    public function test_admin_can_create_folder(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $fieldDef = ['field_name' => 'campo1', 'label' => 'Campo 1', 'type' => 'text', 'required' => false, 'order' => 1];
        $payload = [
            'name' => 'Carpeta Test',
            'description' => 'Descripción test',
            'version' => '1.0',
            'fields' => ['version' => '1.0', 'last_modified' => now()->toIso8601String(), 'fields' => [$fieldDef]],
            'is_default' => false,
        ];

        $response = $this->actingAs($user)->post(route('folders.store'), $payload);

        $response->assertRedirect(route('folders.index'));
        $this->assertDatabaseHas('folders', ['name' => 'Carpeta Test', 'version' => '1.0']);
    }
}
