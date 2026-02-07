<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Registration is disabled; only the administrator creates users/titulares.
     */
    public function test_registration_screen_is_not_available_when_registration_is_disabled(): void
    {
        $response = $this->get('/register');

        $response->assertNotFound();
    }

    /**
     * Registration is disabled; only the administrator creates users/titulares.
     */
    public function test_new_users_cannot_register_when_registration_is_disabled(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertNotFound();
        $this->assertGuest();
    }
}
