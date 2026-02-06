<?php

namespace App\Policies;

use App\Models\Folder;
use App\Models\User;

class FolderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function view(User $user, Folder $folder): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function update(User $user, Folder $folder): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function delete(User $user, Folder $folder): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function restore(User $user, Folder $folder): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function forceDelete(User $user, Folder $folder): bool
    {
        return $user->isSuperAdmin();
    }
}
