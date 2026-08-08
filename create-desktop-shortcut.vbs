Set WshShell = CreateObject("WScript.Shell")
Set oShellLink = WshShell.CreateShortcut(WshShell.SpecialFolders("Desktop") & "\AI Trip Planner.lnk")
oShellLink.TargetPath = WshShell.CurrentDirectory & "\start.bat"
oShellLink.WorkingDirectory = WshShell.CurrentDirectory
oShellLink.Description = "AI Trip Planner - Auto Start"
oShellLink.IconLocation = "C:\Windows\System32\SHELL32.dll,13"
oShellLink.Save

MsgBox "Desktop shortcut created successfully!" & vbCrLf & vbCrLf & "You can now double-click 'AI Trip Planner' on your desktop to start the app.", vbInformation, "AI Trip Planner"
