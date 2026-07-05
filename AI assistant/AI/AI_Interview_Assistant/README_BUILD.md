# Build and Run

## Run locally
Open PowerShell in this folder and run:

```powershell
./run_app.ps1
```

## Build Windows executable
```powershell
pyinstaller --onefile --windowed --name "AI Interview Assistant" desktop_app.py
```

The executable will be created in the `dist` folder.
