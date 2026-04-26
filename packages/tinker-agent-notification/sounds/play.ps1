param([string]$file)
Add-Type -AssemblyName presentationCore
$p = New-Object System.Windows.Media.MediaPlayer
$p.Open([uri]$file)
$p.Play()
Start-Sleep -Milliseconds 500
$d = $p.NaturalDuration.TimeSpan.TotalMilliseconds
if ($d -gt 0) { Start-Sleep -Milliseconds $d }
$p.Stop()
