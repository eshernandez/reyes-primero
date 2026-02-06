<?php

namespace App\Policies;

use App\Models\Titular;
use App\Models\User;

class TitularPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin() || $user->isAuxiliar();
    }

    public function view(User $user, Titular $titular): bool
    {
        if ($user->isSuperAdmin() || $user->isAdmin()) {
            return true;
        }

        return $user->isAuxiliar() && $user->assignedProjects()->where('projects.id', $titular->project_id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function update(User $user, Titular $titular): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function delete(User $user, Titular $titular): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function restore(User $user, Titular $titular): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function forceDelete(User $user, Titular $titular): bool
    {
        return $user->isSuperAdmin();
    }
}
