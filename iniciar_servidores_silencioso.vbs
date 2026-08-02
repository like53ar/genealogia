Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Obtener la ruta del directorio del proyecto dinámicamente
ProjectDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Rutas de herramientas
PythonExe = ProjectDir & "\backend\venv\Scripts\python.exe"
NpmCmd    = "C:\Program Files\nodejs\npm.cmd"

' Verificar que npm.cmd existe, sino buscar en ubicación alternativa
If Not fso.FileExists(NpmCmd) Then
    NpmCmd = "C:\Program Files (x86)\nodejs\npm.cmd"
End If

' Comando para iniciar Backend (FastAPI + Uvicorn)
BackendCmd = "cmd.exe /c """ & PythonExe & """ -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

' Comando para iniciar Frontend (Angular) - usa npm.cmd con ruta completa
FrontendCmd = "cmd.exe /c cd /d """ & ProjectDir & "\frontend"" && """ & NpmCmd & """ run serve"

' Ejecutar Backend en ventana oculta (0 = Oculto, False = Asíncrono)
WshShell.Run BackendCmd, 0, False

' Ejecutar Frontend en ventana oculta (0 = Oculto, False = Asíncrono)
WshShell.Run FrontendCmd, 0, False

' Esperar hasta que el frontend esté listo (máximo 90 segundos)
Dim maxWait, waited, frontendReady, checkCmd, oExec, output
maxWait = 90
waited = 0
frontendReady = False

Do While waited < maxWait And Not frontendReady
    WScript.Sleep 3000
    waited = waited + 3
    ' Comprobar si el puerto 4600 está escuchando
    checkCmd = "cmd.exe /c netstat -an | find ""4600"" | find ""LISTENING"""
    Set oExec = WshShell.Exec(checkCmd)
    output = oExec.StdOut.ReadAll()
    If InStr(output, "4600") > 0 Then
        frontendReady = True
    End If
Loop

' Abrir el navegador web predeterminado
WshShell.Run "http://localhost:4600"
