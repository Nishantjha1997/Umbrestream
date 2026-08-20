[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $projectRoot 'app-tv\src\main\res\drawable\tv_banner.png'
$bitmap = [System.Drawing.Bitmap]::new(320, 180)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

try {
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#08070B'))

  $accentBrush = [System.Drawing.SolidBrush]::new(
    [System.Drawing.ColorTranslator]::FromHtml('#B99CFF')
  )
  $whiteBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
  $mutedBrush = [System.Drawing.SolidBrush]::new(
    [System.Drawing.ColorTranslator]::FromHtml('#B6A9C7')
  )
  $titleFont = [System.Drawing.Font]::new('Segoe UI', 22, [System.Drawing.FontStyle]::Bold)
  $subtitleFont = [System.Drawing.Font]::new('Segoe UI', 9, [System.Drawing.FontStyle]::Regular)

  try {
    $graphics.FillPolygon($accentBrush, @(
      [System.Drawing.PointF]::new(30, 50),
      [System.Drawing.PointF]::new(48, 50),
      [System.Drawing.PointF]::new(73, 90),
      [System.Drawing.PointF]::new(48, 130),
      [System.Drawing.PointF]::new(30, 130),
      [System.Drawing.PointF]::new(55, 90)
    ))
    $graphics.FillPolygon($whiteBrush, @(
      [System.Drawing.PointF]::new(63, 50),
      [System.Drawing.PointF]::new(81, 50),
      [System.Drawing.PointF]::new(106, 90),
      [System.Drawing.PointF]::new(81, 130),
      [System.Drawing.PointF]::new(63, 130),
      [System.Drawing.PointF]::new(88, 90)
    ))
    $graphics.DrawString('StreamFree', $titleFont, $whiteBrush, 122, 60)
    $graphics.DrawString('Movies  •  Series  •  Anime', $subtitleFont, $mutedBrush, 124, 101)
  } finally {
    $accentBrush.Dispose()
    $whiteBrush.Dispose()
    $mutedBrush.Dispose()
    $titleFont.Dispose()
    $subtitleFont.Dispose()
  }

  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $graphics.Dispose()
  $bitmap.Dispose()
}

Write-Output "Generated $outputPath"
