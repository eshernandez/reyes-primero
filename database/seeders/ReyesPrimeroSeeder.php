<?php

namespace Database\Seeders;

use App\Models\Consent;
use App\Models\Folder;
use App\Models\Project;
use App\Models\Titular;
use App\Models\User;
use App\Services\TitularAuthService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ReyesPrimeroSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $authService = new TitularAuthService;

        $superAdmin = User::query()->create([
            'name' => 'Super Administrador',
            'email' => 'super@reyesprimero.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_SUPER_ADMIN,
            'is_active' => true,
        ]);

        $admin = User::query()->create([
            'name' => 'Administrador',
            'email' => 'admin@reyesprimero.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_ADMIN,
            'is_active' => true,
        ]);

        $auxiliar = User::query()->create([
            'name' => 'Auxiliar de Prueba',
            'email' => 'auxiliar@reyesprimero.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_AUXILIAR,
            'is_active' => true,
        ]);

        $project = Project::query()->create([
            'title' => 'Proyecto Inicial',
            'description' => 'Proyecto de prueba inicial del sistema',
            'valor_ingreso' => 1000000.00,
            'fecha_inicio' => now()->toDateString(),
            'fecha_fin' => null,
            'status' => Project::STATUS_ACTIVO,
            'created_by' => $superAdmin->id,
        ]);

        $folder = Folder::query()->create([
            'name' => 'Datos Personales Completos',
            'description' => 'Formulario completo para captación de datos personales, bancarios y financieros',
            'version' => '1.0',
            'fields' => [
                'version' => '1.0',
                'last_modified' => now()->toIso8601String(),
                'sections' => $this->defaultFolderSections(),
            ],
            'versions_history' => null,
            'is_default' => true,
            'created_by' => $superAdmin->id,
        ]);

        $consent = Consent::query()->create([
            'title' => 'Consentimiento Informado de Datos Personales',
            'content' => '<p>Al enviar este formulario usted consiente el tratamiento de sus datos personales de acuerdo con la política de privacidad.</p>',
            'version' => '1.0',
            'is_active' => true,
            'created_by' => $superAdmin->id,
        ]);

        $folder->consents()->attach($consent->id, ['order' => 1]);
        $project->auxiliares()->attach($auxiliar->id);

        $accessCode = $authService->generateAccessCode();
        $uniqueUrl = $authService->generateUniqueUrl();

        Titular::query()->create([
            'nombre' => 'Titular de Prueba',
            'access_code' => $accessCode,
            'unique_url' => $uniqueUrl,
            'project_id' => $project->id,
            'folder_id' => $folder->id,
            'folder_version' => '1.0',
            'data' => [],
            'consents_accepted' => [],
            'completion_percentage' => 0,
            'is_active' => true,
            'created_by' => $superAdmin->id,
        ]);

        $this->command->info('Código de acceso titular de prueba: '.$accessCode);
        $this->command->info('URL única: /titular/access/'.$uniqueUrl);
    }

    /**
     * @return array<int, array{name: string, order: int, fields: array<int, array<string, mixed>>}>
     */
    private function defaultFolderSections(): array
    {
        $byName = [];
        $order = 0;
        foreach ($this->defaultFolderFields() as $f) {
            $f['order'] = ++$order;
            $byName[$f['field_name']] = $f;
        }

        $pick = function (array $names, int $startOrder) use (&$byName): array {
            $out = [];
            foreach ($names as $i => $name) {
                if (isset($byName[$name])) {
                    $f = $byName[$name];
                    $f['order'] = $startOrder + $i + 1;
                    $out[] = $f;
                }
            }

            return $out;
        };

        return [
            ['name' => 'Identificación', 'order' => 1, 'fields' => $pick([
                'nif_razon_social', 'nombres', 'apellidos', 'documento_identidad', 'pasaporte',
                'fecha_emision_pasaporte', 'fecha_vencimiento_pasaporte', 'entidad_emite',
                'fecha_nacimiento', 'fecha_expedicion_cedula',
            ], 0)],
            ['name' => 'Contacto', 'order' => 2, 'fields' => $pick([
                'celular', 'correo_electronico', 'usuario_telegram', 'direccion',
                'ciudad', 'departamento', 'pais',
            ], 10)],
            ['name' => 'Información Bancaria', 'order' => 3, 'fields' => $pick([
                'banco', 'codigo_banco', 'nombre_real_banco', 'numero_cuenta',
                'tipo_cuenta', 'llave_interbancaria',
            ], 17)],
            ['name' => 'Información Financiera', 'order' => 4, 'fields' => $pick([
                'fecha_primer_aporte', 'valor_oxigenacion_inicial', 'aporte_base', 'numero_consignacion',
                'promesa_final', 'regalo', 'fecha_aporte_oxigenacion_2025', 'aportado_multi_oxigena',
                'numero_recibo_oxigenacion', 'quien_recibio', 'factor_multiplicacion', 'oxigenacion_final',
            ], 23)],
            ['name' => 'Información Adicional', 'order' => 5, 'fields' => $pick([
                'tipo_usuario', 'marca_billetera', 'codigo_billetera', 'red_monabit',
                'tarjeta_monabit', 'pergaminos', 'plataformas',
            ], 35)],
            ['name' => 'Coequipero', 'order' => 6, 'fields' => $pick([
                'coequipero_codigo', 'coequipero_nombre',
            ], 42)],
            ['name' => 'Observaciones', 'order' => 7, 'fields' => $pick([
                'observaciones',
            ], 44)],
            ['name' => 'Archivos', 'order' => 8, 'fields' => $pick([
                'archivo_documento', 'archivo_certificacion', 'archivo_otros',
            ], 45)],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function defaultFolderFields(): array
    {
        return [
            ['field_name' => 'nif_razon_social', 'label' => 'N.I.F. / Razón Social', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:100'], 'help_text' => null, 'order' => 1],
            ['field_name' => 'nombres', 'label' => 'Nombres', 'type' => 'text', 'required' => true, 'validation' => ['required', 'string', 'min:3', 'max:100'], 'help_text' => 'Ingrese sus nombres como aparecen en el documento', 'order' => 2],
            ['field_name' => 'apellidos', 'label' => 'Apellidos', 'type' => 'text', 'required' => true, 'validation' => ['required', 'string', 'min:3', 'max:100'], 'help_text' => null, 'order' => 3],
            ['field_name' => 'documento_identidad', 'label' => 'Documento de Identidad / DNI', 'type' => 'text', 'required' => true, 'validation' => ['required', 'string', 'max:20'], 'help_text' => null, 'order' => 4],
            ['field_name' => 'pasaporte', 'label' => 'Pasaporte', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:20'], 'help_text' => null, 'order' => 5],
            ['field_name' => 'fecha_emision_pasaporte', 'label' => 'Fecha Emisión Pasaporte', 'type' => 'date', 'required' => false, 'validation' => ['date'], 'help_text' => null, 'order' => 6],
            ['field_name' => 'fecha_vencimiento_pasaporte', 'label' => 'Fecha Vencimiento Pasaporte', 'type' => 'date', 'required' => false, 'validation' => ['date'], 'help_text' => null, 'order' => 7],
            ['field_name' => 'entidad_emite', 'label' => 'Entidad que Emite', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:100'], 'help_text' => null, 'order' => 8],
            ['field_name' => 'fecha_nacimiento', 'label' => 'Fecha de Nacimiento', 'type' => 'date', 'required' => false, 'validation' => ['date'], 'help_text' => null, 'order' => 9],
            ['field_name' => 'fecha_expedicion_cedula', 'label' => 'Fecha Expedición Cédula', 'type' => 'date', 'required' => false, 'validation' => ['date'], 'help_text' => null, 'order' => 10],
            ['field_name' => 'celular', 'label' => 'Celular', 'type' => 'text', 'required' => true, 'validation' => ['required', 'string', 'max:20'], 'help_text' => 'Número de contacto principal', 'order' => 11],
            ['field_name' => 'correo_electronico', 'label' => 'Correo Electrónico', 'type' => 'email', 'required' => true, 'validation' => ['required', 'email', 'max:100'], 'help_text' => null, 'order' => 12],
            ['field_name' => 'usuario_telegram', 'label' => 'Usuario Telegram', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:50'], 'help_text' => 'Incluir @ al inicio (ej: @usuario)', 'order' => 13],
            ['field_name' => 'direccion', 'label' => 'Dirección', 'type' => 'textarea', 'required' => false, 'validation' => ['string', 'max:500'], 'help_text' => null, 'order' => 14],
            ['field_name' => 'ciudad', 'label' => 'Ciudad', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:100'], 'help_text' => null, 'order' => 15],
            ['field_name' => 'departamento', 'label' => 'Departamento', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:100'], 'help_text' => null, 'order' => 16],
            ['field_name' => 'pais', 'label' => 'País', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:100'], 'help_text' => null, 'order' => 17],
            ['field_name' => 'banco', 'label' => 'Banco', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:100'], 'help_text' => null, 'order' => 18],
            ['field_name' => 'codigo_banco', 'label' => 'Código Banco', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:20'], 'help_text' => null, 'order' => 19],
            ['field_name' => 'nombre_real_banco', 'label' => 'Nombre Real Banco', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:100'], 'help_text' => null, 'order' => 20],
            ['field_name' => 'numero_cuenta', 'label' => 'Número de Cuenta', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:30'], 'help_text' => null, 'order' => 21],
            ['field_name' => 'tipo_cuenta', 'label' => 'Tipo de Cuenta', 'type' => 'select', 'required' => false, 'options' => ['AHORROS', 'CORRIENTE'], 'validation' => ['in:AHORROS,CORRIENTE'], 'help_text' => null, 'order' => 22],
            ['field_name' => 'llave_interbancaria', 'label' => 'Llave Interbancaria', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:50'], 'help_text' => null, 'order' => 23],
            ['field_name' => 'fecha_primer_aporte', 'label' => 'Fecha Primer Aporte', 'type' => 'date', 'required' => false, 'validation' => ['date'], 'help_text' => null, 'order' => 24],
            ['field_name' => 'valor_oxigenacion_inicial', 'label' => 'Valor Oxigenación Inicial', 'type' => 'number', 'required' => false, 'validation' => ['numeric', 'min:0'], 'help_text' => null, 'order' => 25],
            ['field_name' => 'aporte_base', 'label' => 'Aporte Base', 'type' => 'number', 'required' => false, 'validation' => ['numeric', 'min:0'], 'help_text' => null, 'order' => 26],
            ['field_name' => 'numero_consignacion', 'label' => 'Número de Consignación', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:100'], 'help_text' => null, 'order' => 27],
            ['field_name' => 'promesa_final', 'label' => 'Promesa Final', 'type' => 'number', 'required' => false, 'validation' => ['numeric', 'min:0'], 'help_text' => null, 'order' => 28],
            ['field_name' => 'regalo', 'label' => 'Regalo', 'type' => 'textarea', 'required' => false, 'validation' => ['string', 'max:500'], 'help_text' => null, 'order' => 29],
            ['field_name' => 'fecha_aporte_oxigenacion_2025', 'label' => 'Fecha Aporte Oxigenación 2025', 'type' => 'date', 'required' => false, 'validation' => ['date'], 'help_text' => null, 'order' => 30],
            ['field_name' => 'aportado_multi_oxigena', 'label' => '$ Aportado Multi Oxigena', 'type' => 'number', 'required' => false, 'validation' => ['numeric', 'min:0'], 'help_text' => null, 'order' => 31],
            ['field_name' => 'numero_recibo_oxigenacion', 'label' => 'Número Recibo Oxigenación', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:100'], 'help_text' => null, 'order' => 32],
            ['field_name' => 'quien_recibio', 'label' => 'Quién Recibió', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:100'], 'help_text' => null, 'order' => 33],
            ['field_name' => 'factor_multiplicacion', 'label' => 'Factor Multiplicación Oxigenación', 'type' => 'number', 'required' => false, 'validation' => ['numeric', 'min:0'], 'help_text' => null, 'order' => 34],
            ['field_name' => 'oxigenacion_final', 'label' => 'Oxigenación Final', 'type' => 'number', 'required' => false, 'validation' => ['numeric', 'min:0'], 'help_text' => null, 'order' => 35],
            ['field_name' => 'tipo_usuario', 'label' => 'Tipo Usuario', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:50'], 'help_text' => null, 'order' => 36],
            ['field_name' => 'marca_billetera', 'label' => 'Marca Billetera', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:50'], 'help_text' => null, 'order' => 37],
            ['field_name' => 'codigo_billetera', 'label' => 'Código Billetera', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:100'], 'help_text' => null, 'order' => 38],
            ['field_name' => 'red_monabit', 'label' => 'Red Monabit Jorge Eliecer', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:100'], 'help_text' => null, 'order' => 39],
            ['field_name' => 'tarjeta_monabit', 'label' => 'Tarjeta Monabit', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:100'], 'help_text' => null, 'order' => 40],
            ['field_name' => 'pergaminos', 'label' => 'Pergaminos', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:100'], 'help_text' => null, 'order' => 41],
            ['field_name' => 'plataformas', 'label' => 'Plataformas', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:100'], 'help_text' => null, 'order' => 42],
            ['field_name' => 'coequipero_codigo', 'label' => 'Código Coequipero', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:50'], 'help_text' => null, 'order' => 43],
            ['field_name' => 'coequipero_nombre', 'label' => 'Nombre Coequipero', 'type' => 'text', 'required' => false, 'validation' => ['string', 'max:100'], 'help_text' => null, 'order' => 44],
            ['field_name' => 'observaciones', 'label' => 'Observaciones', 'type' => 'textarea', 'required' => false, 'validation' => ['string', 'max:1000'], 'help_text' => null, 'order' => 45],
            ['field_name' => 'archivo_documento', 'label' => 'Documento de Identidad (Archivo)', 'type' => 'file', 'required' => false, 'validation' => ['file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'], 'help_text' => 'PDF o imagen, máximo 10MB', 'order' => 46],
            ['field_name' => 'archivo_certificacion', 'label' => 'Certificación Bancaria (Archivo)', 'type' => 'file', 'required' => false, 'validation' => ['file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'], 'help_text' => 'PDF o imagen, máximo 10MB', 'order' => 47],
            ['field_name' => 'archivo_otros', 'label' => 'Otros Documentos', 'type' => 'file', 'required' => false, 'validation' => ['file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:10240'], 'help_text' => 'Documentos adicionales, máximo 10MB', 'order' => 48],
        ];
    }
}
