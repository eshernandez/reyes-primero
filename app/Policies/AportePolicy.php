<?php

namespace App\Policies;

use App\Models\Aporte;
use App\Models\User;

class AportePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin() || $user->isAuxiliar();
    }

    public function view(User $user, Aporte $aporte): bool
    {
        if ($user->isSuperAdmin() || $user->isAdmin()) {
            return true;
        }
        if ($user->isAuxiliar()) {
            $projectId = $aporte->titular()->value('project_id');

            return $user->assignedProjects()->where('projects.id', $projectId)->exists();
        }

        return false;
    }

    public function update(User $user, Aporte $aporte): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }
}
