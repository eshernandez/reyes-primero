<?php

namespace Tests\Feature;

use App\Models\Aporte;
use App\Models\Folder;
use App\Models\Plan;
use App\Models\Project;
use App\Models\Titular;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AporteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_admin_can_view_aportes_index(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $response = $this->actingAs($user)->get(route('aportes.index'));

        $response->assertOk();
    }

    public function test_admin_can_approve_aporte(): void
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
        $titular = Titular::query()->create([
            'nombre' => 'Titular Test',
            'access_code' => 'code123',
            'unique_url' => 'unique-123',
            'project_id' => $project->id,
            'folder_id' => $folder->id,
            'folder_version' => '1.0',
            'status' => Titular::STATUS_EN_PROCESO,
            'is_active' => true,
            'created_by' => $user->id,
        ]);
        $plan = Plan::query()->create([
            'nombre' => 'Plan Test',
            'descripcion' => null,
            'valor_ingreso' => 1000,
            'fecha_cierre' => null,
            'created_by' => $user->id,
        ]);
        $aporte = Aporte::query()->create([
            'titular_id' => $titular->id,
            'valor' => 500,
            'estado' => Aporte::ESTADO_PENDIENTE,
        ]);

        $response = $this->actingAs($user)->put(route('aportes.update', $aporte), [
            'plan_id' => $plan->id,
            'estado' => 'aprobado',
        ]);

        $response->assertRedirect(route('aportes.show', $aporte));
        $aporte->refresh();
        $this->assertSame('aprobado', $aporte->estado);
        $this->assertSame($plan->id, $aporte->plan_id);
        $this->assertNotNull($aporte->approved_at);
        $this->assertSame($user->id, $aporte->approved_by);
    }

    public function test_titular_can_store_aporte(): void
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
        $titular = Titular::query()->create([
            'nombre' => 'Titular Test',
            'access_code' => 'code123',
            'unique_url' => 'unique-123',
            'project_id' => $project->id,
            'folder_id' => $folder->id,
            'folder_version' => '1.0',
            'status' => Titular::STATUS_EN_PROCESO,
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        $this->actingAs($titular, 'titular');

        $file = UploadedFile::fake()->create('soporte.pdf', 100, 'application/pdf');

        $response = $this->post(route('titular.aportes.store'), [
            'valor' => 300,
            'soporte' => $file,
        ]);

        $response->assertRedirect(route('titular.aportes.index'));
        $this->assertDatabaseHas('aportes', [
            'titular_id' => $titular->id,
            'valor' => 300,
            'estado' => Aporte::ESTADO_PENDIENTE,
        ]);
    }

    public function test_auxiliar_only_sees_aportes_from_assigned_projects(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $auxiliar = User::factory()->create(['role' => User::ROLE_AUXILIAR]);

        $projectAssigned = Project::query()->create([
            'title' => 'Proyecto Asignado',
            'description' => null,
            'valor_ingreso' => 0,
            'status' => 'activo',
            'created_by' => $admin->id,
        ]);
        $auxiliar->assignedProjects()->attach($projectAssigned->id);

        $projectOther = Project::query()->create([
            'title' => 'Otro Proyecto',
            'description' => null,
            'valor_ingreso' => 0,
            'status' => 'activo',
            'created_by' => $admin->id,
        ]);

        $folder = Folder::query()->create([
            'name' => 'Carpeta Test',
            'description' => null,
            'version' => '1.0',
            'fields' => ['version' => '1.0', 'fields' => []],
            'is_default' => false,
            'created_by' => $admin->id,
        ]);

        $titularAssigned = Titular::query()->create([
            'nombre' => 'Titular Asignado',
            'access_code' => 'code1',
            'unique_url' => 'unique-1',
            'project_id' => $projectAssigned->id,
            'folder_id' => $folder->id,
            'folder_version' => '1.0',
            'status' => Titular::STATUS_EN_PROCESO,
            'is_active' => true,
            'created_by' => $admin->id,
        ]);
        $titularOther = Titular::query()->create([
            'nombre' => 'Titular Otro',
            'access_code' => 'code2',
            'unique_url' => 'unique-2',
            'project_id' => $projectOther->id,
            'folder_id' => $folder->id,
            'folder_version' => '1.0',
            'status' => Titular::STATUS_EN_PROCESO,
            'is_active' => true,
            'created_by' => $admin->id,
        ]);

        Aporte::query()->create([
            'titular_id' => $titularAssigned->id,
            'valor' => 100,
            'estado' => Aporte::ESTADO_PENDIENTE,
        ]);
        $aporteOther = Aporte::query()->create([
            'titular_id' => $titularOther->id,
            'valor' => 200,
            'estado' => Aporte::ESTADO_PENDIENTE,
        ]);

        $responseIndex = $this->actingAs($auxiliar)->get(route('aportes.index'));
        $responseIndex->assertOk();
        $aportesData = $responseIndex->viewData('page')['props']['aportes']['data'] ?? [];
        $this->assertCount(1, $aportesData);
        $this->assertSame('100.00', $aportesData[0]['valor']);

        $responseShow = $this->actingAs($auxiliar)->get(route('aportes.show', $aporteOther));
        $responseShow->assertForbidden();
    }
}
