<?php

namespace Tests\Feature;

use App\Models\Consent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConsentTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_view_consents_index(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $response = $this->actingAs($user)->get(route('consents.index'));

        $response->assertOk();
    }

    public function test_admin_can_view_consents_index(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $response = $this->actingAs($user)->get(route('consents.index'));

        $response->assertOk();
    }

    public function test_auxiliar_cannot_view_consents_index(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_AUXILIAR]);
        $response = $this->actingAs($user)->get(route('consents.index'));

        $response->assertForbidden();
    }

    public function test_super_admin_can_access_create_form(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $response = $this->actingAs($user)->get(route('consents.create'));

        $response->assertOk();
    }

    public function test_super_admin_can_store_consent(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $payload = [
            'title' => 'Consentimiento Test',
            'content' => 'Contenido del consentimiento.',
            'version' => '1.0',
            'is_active' => true,
        ];

        $response = $this->actingAs($user)->post(route('consents.store'), $payload);

        $response->assertRedirect(route('consents.index'));
        $this->assertDatabaseHas('consents', [
            'title' => 'Consentimiento Test',
            'version' => '1.0',
            'created_by' => $user->id,
        ]);
    }

    public function test_super_admin_can_access_edit_form(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $consent = Consent::query()->create([
            'title' => 'Test',
            'content' => 'Content',
            'version' => '1.0',
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->get(route('consents.edit', $consent));

        $response->assertOk();
    }

    public function test_super_admin_can_update_consent(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $consent = Consent::query()->create([
            'title' => 'Test',
            'content' => 'Content',
            'version' => '1.0',
            'is_active' => true,
            'created_by' => $user->id,
        ]);
        $payload = [
            'title' => 'Consentimiento Actualizado',
            'content' => 'Contenido actualizado.',
            'version' => '1.1',
            'is_active' => false,
        ];

        $response = $this->actingAs($user)->put(route('consents.update', $consent), $payload);

        $response->assertRedirect(route('consents.index'));
        $consent->refresh();
        $this->assertSame('Consentimiento Actualizado', $consent->title);
        $this->assertSame('1.1', $consent->version);
        $this->assertFalse($consent->is_active);
    }

    public function test_super_admin_can_destroy_consent(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $consent = Consent::query()->create([
            'title' => 'Test',
            'content' => 'Content',
            'version' => '1.0',
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->delete(route('consents.destroy', $consent));

        $response->assertRedirect(route('consents.index'));
        $this->assertSoftDeleted('consents', ['id' => $consent->id]);
    }
}
