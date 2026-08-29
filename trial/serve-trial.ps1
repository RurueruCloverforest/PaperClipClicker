param(
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$trialRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)
$server = $null
$port = $null

foreach ($candidatePort in 4173..4192) {
    $candidateServer = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidatePort)
    try {
        $candidateServer.Start()
        $server = $candidateServer
        $port = $candidatePort
        break
    }
    catch {
        $candidateServer.Stop()
    }
}

if (-not $server -or -not $port) {
    Write-Host 'Could not start the local server. Ports 4173-4192 are unavailable.' -ForegroundColor Red
    Read-Host 'Press Enter to close'
    exit 1
}

$url = "http://127.0.0.1:$port/"
$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.webp' = 'image/webp'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.svg'  = 'image/svg+xml'
    '.json' = 'application/json; charset=utf-8'
    '.ico'  = 'image/x-icon'
}

try {
    Write-Host "Paperclip Protocol trial server: $url"
    Write-Host 'Keep this window open while playing. Close it to stop the server.'
    if (-not $NoBrowser) {
        Start-Process $url
    }

    while ($true) {
        $client = $server.AcceptTcpClient()
        $stream = $null
        $reader = $null
        try {
            $stream = $client.GetStream()
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
            $requestLine = $reader.ReadLine()
            while ($reader.ReadLine()) { }

            $statusCode = 200
            $statusText = 'OK'
            $contentType = 'application/octet-stream'
            $body = [byte[]]::new(0)

            if ($requestLine -notmatch '^GET\s+([^\s]+)\s+HTTP/') {
                $statusCode = 405
                $statusText = 'Method Not Allowed'
                $body = [System.Text.Encoding]::UTF8.GetBytes('405 Method Not Allowed')
                $contentType = 'text/plain; charset=utf-8'
            }
            else {
                $requestTarget = $Matches[1].Split('?')[0]
                $relativePath = [System.Uri]::UnescapeDataString($requestTarget.TrimStart('/'))
                if ([string]::IsNullOrWhiteSpace($relativePath)) {
                    $relativePath = 'index.html'
                }

                $requestedPath = [System.IO.Path]::GetFullPath((Join-Path $trialRoot $relativePath))
                $trialPrefix = $trialRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
                $isInsideTrial = $requestedPath.StartsWith($trialPrefix, [System.StringComparison]::OrdinalIgnoreCase)

                if (-not $isInsideTrial -or -not [System.IO.File]::Exists($requestedPath)) {
                    $statusCode = 404
                    $statusText = 'Not Found'
                    $body = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
                    $contentType = 'text/plain; charset=utf-8'
                }
                else {
                    $extension = [System.IO.Path]::GetExtension($requestedPath).ToLowerInvariant()
                    if ($mimeTypes.ContainsKey($extension)) {
                        $contentType = $mimeTypes[$extension]
                    }
                    $body = [System.IO.File]::ReadAllBytes($requestedPath)
                }
            }

            $headers = "HTTP/1.1 $statusCode $statusText`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($body, 0, $body.Length)
            $stream.Flush()
        }
        catch {
            Write-Host $_.Exception.Message -ForegroundColor Yellow
        }
        finally {
            if ($reader) { $reader.Dispose() }
            if ($stream) { $stream.Dispose() }
            $client.Dispose()
        }
    }
}
finally {
    if ($server) {
        $server.Stop()
    }
}
