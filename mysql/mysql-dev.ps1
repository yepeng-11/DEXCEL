# DEXCEL 本地 MySQL 8.4 启停脚本（数据目录在仓库内，已被 .gitignore 排除）
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('start', 'stop', 'status')]
    [string]$Action
)

$MySQLBin = 'C:\Program Files\MySQL\MySQL Server 8.4\bin'
$MyIni = Join-Path $PSScriptRoot 'my.ini'
$ClientArgs = @('-h', '127.0.0.1', '-P', '3306', '-u', 'root', '--skip-password')

switch ($Action) {
    'start' {
        $proc = Get-Process mysqld -ErrorAction SilentlyContinue
        if ($proc) { Write-Output "MySQL already running (PID $($proc.Id))"; exit 0 }
        Start-Process -FilePath (Join-Path $MySQLBin 'mysqld.exe') `
            -ArgumentList "--defaults-file=`"$MyIni`"", '--console' -NoNewWindow
        Start-Sleep -Seconds 3
        & (Join-Path $MySQLBin 'mysqladmin.exe') @ClientArgs ping
    }
    'stop' {
        & (Join-Path $MySQLBin 'mysqladmin.exe') @ClientArgs shutdown
        Write-Output 'MySQL shutdown requested.'
    }
    'status' {
        & (Join-Path $MySQLBin 'mysqladmin.exe') @ClientArgs ping
    }
}
