<?php

namespace Tests\Feature\Titular;

use App\Models\Folder;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TitularManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_titulares_index(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $response = $this->actingAs($user)->get(route('titulares.index'));

        $response->assertOk();
    }

    public function test_auxiliar_can_view_titulares_index_for_assigned_projects_only(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_AUXILIAR]);
        $project = Project::query()->create([
            'title' => 'Proyecto Test',
            'description' => null,
            'valor_ingreso' => 0,
            'status' => 'activo',
            'created_by' => $user->id,
        ]);
        $user->assignedProjects()->attach($project->id);

        $response = $this->actingAs($user)->get(route('titulares.index'));

        $response->assertOk();
    }

    public function test_admin_can_create_titular(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $project = Project::query()->create([
            'title' => 'Proyecto Test',
            'description' => null,
            'valor_ingreso' => 0,
            'status' => 'activo',
            'created_by' => $user->id,
        ]);
        $folder = Folder::query()->create([
            'name' => 'Carpeta Test',
            'description' => null,
            'version' => '1.0',
            'fields' => ['version' => '1.0', 'fields' => []],
            'is_default' => false,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->post(route('titulares.store'), [
            'nombre' => 'Titular Test',
            'project_id' => $project->id,
            'folder_id' => $folder->id,
        ]);

        $response->assertRedirect(route('titulares.index'));
        $this->assertDatabaseHas('titulares', [
            'nombre' => 'Titular Test',
            'project_id' => $project->id,
            'folder_id' => $folder->id,
        ]);
    }
}
