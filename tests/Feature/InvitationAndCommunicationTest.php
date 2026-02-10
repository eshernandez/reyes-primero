<?php

namespace Tests\Feature;

use App\Mail\CustomCommunicationMail;
use App\Mail\InvitationToFolderMail;
use App\Models\Communication;
use App\Models\Folder;
use App\Models\Project;
use App\Models\Titular;
use App\Models\User;
use App\Services\TitularAuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class InvitationAndCommunicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_send_invitation_to_titular_with_email(): void
    {
        Mail::fake();

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
        $authService = new TitularAuthService;
        $titular = Titular::query()->create([
            'nombre' => 'Titular Con Email',
            'access_code' => $authService->generateAccessCode(),
            'unique_url' => $authService->generateUniqueUrl(),
            'project_id' => $project->id,
            'folder_id' => $folder->id,
            'folder_version' => $folder->version,
            'data' => [
                'correo_electronico' => 'titular@test.com',
                'nombre' => 'Juan',
            ],
            'consents_accepted' => [],
            'completion_percentage' => 0,
            'status' => Titular::STATUS_EN_PROCESO,
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->post(route('titulares.send-invitation', $titular));

        $response->assertRedirect();
        $response->assertSessionHas('success');
        Mail::assertSent(InvitationToFolderMail::class, function ($mail) {
            return $mail->hasTo('titular@test.com');
        });
        $this->assertDatabaseHas('communications', [
            'titular_id' => $titular->id,
            'to_email' => 'titular@test.com',
            'type' => Communication::TYPE_INVITATION,
            'status' => Communication::STATUS_SENT,
        ]);
        $titular->refresh();
        $this->assertNotNull($titular->invitation_sent_at);
    }

    public function test_send_invitation_fails_when_titular_has_no_email(): void
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
        $authService = new TitularAuthService;
        $titular = Titular::query()->create([
            'nombre' => 'Titular Sin Email',
            'access_code' => $authService->generateAccessCode(),
            'unique_url' => $authService->generateUniqueUrl(),
            'project_id' => $project->id,
            'folder_id' => $folder->id,
            'folder_version' => $folder->version,
            'data' => [],
            'consents_accepted' => [],
            'completion_percentage' => 0,
            'status' => Titular::STATUS_EN_PROCESO,
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->post(route('titulares.send-invitation', $titular));

        $response->assertRedirect();
        $response->assertSessionHasErrors('email');
    }

    public function test_communications_index_is_accessible_to_authorized_user(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $response = $this->actingAs($user)->get(route('communications.index'));

        $response->assertOk();
    }

    public function test_admin_can_send_custom_communication(): void
    {
        Mail::fake();

        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $response = $this->actingAs($user)->post(route('communications.store'), [
            'to_email' => 'destino@test.com',
            'subject' => 'Asunto prueba',
            'body' => 'Cuerpo del mensaje',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        Mail::assertSent(CustomCommunicationMail::class, function ($mail) {
            return $mail->hasTo('destino@test.com');
        });
        $this->assertDatabaseHas('communications', [
            'type' => Communication::TYPE_CUSTOM,
            'to_email' => 'destino@test.com',
            'subject' => 'Asunto prueba',
            'status' => Communication::STATUS_SENT,
        ]);
    }
}
