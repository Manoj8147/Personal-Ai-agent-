cd $PSScriptRoot
$env:SECRET_KEY = if ($env:SECRET_KEY) { $env:SECRET_KEY } else { 'dev-secret-key' }
$python = 'C:/Users/Manoj/AppData/Local/Python/pythoncore-3.14-64/python.exe'
& $python desktop_app.py
