# Folder-only MongoDB: runs a single-node replica set with its data inside this project
# (backend\.mongo-data), on port 27018, independent of the Windows MongoDB service.
# Usage (from backend/):  powershell -File scripts\mongo-local.ps1
# Then set in .env:       MONGODB_URI=mongodb://127.0.0.1:27018/oddsly?replicaSet=rs0
$ErrorActionPreference = "Stop"
$mongod = (Get-ChildItem "C:\Program Files\MongoDB\Server\*\bin\mongod.exe" | Sort-Object FullName -Descending | Select-Object -First 1).FullName
$data = Join-Path $PSScriptRoot "..\.mongo-data"
New-Item -ItemType Directory -Force $data | Out-Null

Start-Process -FilePath $mongod -ArgumentList "--dbpath `"$data`" --port 27018 --bind_ip 127.0.0.1 --replSet rs0" -WindowStyle Hidden
Start-Sleep 4
mongosh --quiet --port 27018 --eval "try { rs.status().ok } catch (e) { printjson(rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27018'}]})) }"
Write-Host "Local replica set ready on 127.0.0.1:27018"
