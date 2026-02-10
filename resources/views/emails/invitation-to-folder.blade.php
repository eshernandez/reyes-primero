<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? 'Invitación a tu carpeta' }}</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #1a1a1a;">Invitación a tu carpeta privada</h1>
    <p>Hola{{ $recipientName ? " {$recipientName}" : '' }},</p>
    <p>Has sido invitado a acceder a tu carpeta privada.</p>
    <p style="margin: 16px 0;"><strong>Tu clave de acceso (código de 6 dígitos):</strong></p>
    <p style="font-size: 24px; letter-spacing: 0.2em; font-weight: bold; margin: 8px 0 24px 0;">{{ $accessCode ?? '' }}</p>
    <p>Utiliza el siguiente enlace para entrar e ingresa la clave cuando te la soliciten:</p>
    <p style="margin: 24px 0;">
        <a href="{{ $accessUrl }}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">Acceder a mi carpeta</a>
    </p>
    <p style="font-size: 14px; color: #666;">O copia este enlace en tu navegador:</p>
    <p style="word-break: break-all; font-size: 14px;">{{ $accessUrl }}</p>
    <p style="margin-top: 32px; font-size: 14px; color: #666;">Si no esperabas este correo, puedes ignorarlo.</p>
</body>
</html>
