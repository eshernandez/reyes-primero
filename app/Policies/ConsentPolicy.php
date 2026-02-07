<?php

namespace App\Policies;

use App\Models\Consent;
use App\Models\User;

class ConsentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function view(User $user, Consent $consent): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function update(User $user, Consent $consent): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function delete(User $user, Consent $consent): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function restore(User $user, Consent $consent): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function forceDelete(User $user, Consent $consent): bool
    {
        return $user->isSuperAdmin();
    }
}
