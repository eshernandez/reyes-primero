<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PrivateFileServe
{
    /**
     * Serve a file from the private disk (local or S3/Spaces).
     * Returns a response or null if file does not exist.
     */
    public static function response(string $path, string $downloadFilename): StreamedResponse|BinaryFileResponse|null
    {
        $disk = Storage::disk(config('filesystems.private_disk'));

        if (! $disk->exists($path)) {
            return null;
        }

        $mime = $disk->mimeType($path) ?: 'application/octet-stream';

        if (config('filesystems.private_disk') === 'local') {
            return response()->file($disk->path($path), [
                'Content-Type' => $mime,
                'Content-Disposition' => 'inline; filename="'.basename($downloadFilename).'"',
            ]);
        }

        return response()->streamDownload(
            fn () => print ($disk->get($path)),
            basename($downloadFilename),
            [
                'Content-Type' => $mime,
                'Content-Disposition' => 'inline; filename="'.basename($downloadFilename).'"',
            ],
            'inline'
        );
    }
}
