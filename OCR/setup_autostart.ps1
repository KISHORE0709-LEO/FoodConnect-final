# PowerShell script to create Task Scheduler entry for OCR API auto-start
# Run as Administrator

$taskName = "FoodConnect OCR API"
$scriptPath = "d:\Kishore\New_project\FoodConnect-final\OCR\start_api_server.bat"

# Create the scheduled task
$action = New-ScheduledTaskAction -Execute $scriptPath
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive

# Register the task
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force

Write-Host "Task '$taskName' created successfully!"
Write-Host "The OCR API will now start automatically when Windows boots."
Write-Host ""
Write-Host "To manage the task:"
Write-Host "- Open Task Scheduler (taskschd.msc)"
Write-Host "- Look for '$taskName' in Task Scheduler Library"
Write-Host ""
Write-Host "To test now: Start-ScheduledTask -TaskName '$taskName'"