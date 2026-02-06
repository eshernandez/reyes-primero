<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin() || $user->isAuxiliar();
    }

    public function view(User $user, Project $project): bool
    {
        if ($user->isSuperAdmin() || $user->isAdmin()) {
            return true;
        }

        return $user->isAuxiliar() && $user->assignedProjects()->where('projects.id', $project->id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function update(User $user, Project $project): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function delete(User $user, Project $project): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function restore(User $user, Project $project): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function forceDelete(User $user, Project $project): bool
    {
        return $user->isSuperAdmin();
    }
}
