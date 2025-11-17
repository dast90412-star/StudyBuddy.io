<#
check-dns.ps1
Checks that the apex domain has GitHub Pages A records and that www has a CNAME to the GitHub Pages hostname.

Usage:
  .\check-dns.ps1 -Domain studybuddy.com.in
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain
)

$githubA = @('185.199.108.153','185.199.109.153','185.199.110.153','185.199.111.153')

Write-Host "Checking A records for $Domain ..." -ForegroundColor Cyan
try {
    $ares = Resolve-DnsName -Name $Domain -Type A -ErrorAction Stop | Select-Object -ExpandProperty IPAddress
} catch {
    Write-Host "Failed to resolve A records for $Domain:`n $_" -ForegroundColor Red
    exit 2
}

if ($ares.Count -eq 0) {
    Write-Host "No A records found for $Domain" -ForegroundColor Yellow
} else {
    Write-Host "A records:" -ForegroundColor Green
    $ares | ForEach-Object { Write-Host " - $_" }
}

$missing = $githubA | Where-Object { $_ -notin $ares }
if ($missing.Count -eq 0) {
    Write-Host "A records match GitHub Pages IPs." -ForegroundColor Green
} else {
    Write-Host "A records are missing the following GitHub IP(s):" -ForegroundColor Yellow
    $missing | ForEach-Object { Write-Host " - $_" }
}

$www = "www.$Domain"
Write-Host "`nChecking CNAME for $www ..." -ForegroundColor Cyan
try {
    $cname = Resolve-DnsName -Name $www -Type CNAME -ErrorAction Stop | Select-Object -ExpandProperty NameHost -ErrorAction SilentlyContinue
} catch {
    $cname = $null
}

if ($null -eq $cname) {
    Write-Host "No CNAME record for $www (this is OK if you don't use www)." -ForegroundColor Yellow
} else {
    Write-Host "CNAME for $www -> $cname" -ForegroundColor Green
}

Write-Host "`nSummary:" -ForegroundColor Cyan
if ($missing.Count -eq 0) { Write-Host " - Apex A records OK" -ForegroundColor Green } else { Write-Host " - Apex A records NOT OK" -ForegroundColor Red }
if ($null -ne $cname) { Write-Host " - www CNAME found: $cname" -ForegroundColor Green } else { Write-Host " - www CNAME not found" -ForegroundColor Yellow }

Write-Host "`nIf you're using Cloudflare, ensure the proxy is disabled (DNS-only) while GitHub verifies the domain." -ForegroundColor Magenta

exit 0
