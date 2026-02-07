<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function view(User $user, User $model): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function update(User $user, User $model): bool
    {
        return $user->isSuperAdmin();
    }

    public function delete(User $user, User $model): bool
    {
        if ($user->id === $model->id) {
            return false;
        }

        if ($model->isSuperAdmin() && User::query()->where('role', User::ROLE_SUPER_ADMIN)->count() <= 1) {
            return false;
        }

        return $user->isSuperAdmin();
    }

    public function restore(User $user, User $model): bool
    {
        return $user->isSuperAdmin();
    }

    public function forceDelete(User $user, User $model): bool
    {
        return $user->isSuperAdmin();
    }
}
