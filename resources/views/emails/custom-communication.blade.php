<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? 'Comunicación' }}</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #1a1a1a;">{{ $subject ?? 'Comunicación' }}</h1>
    <div style="margin-top: 24px;">
        {!! nl2br(e($body ?? '')) !!}
    </div>
</body>
</html>
