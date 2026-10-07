$urls = @(
    "http://localhost:3000/",
    "http://localhost:3000/materials",
    "http://localhost:3000/materials/carpet-tile",
    "http://localhost:3000/materials/wallpaper",
    "http://localhost:3000/materials/wallpaper/china",
    "http://localhost:3000/materials/wallpaper/korea",
    "http://localhost:3000/materials/window-blinds/roller-blinds",
    "http://localhost:3000/our-work",
    "http://localhost:3000/services",
    "http://localhost:3000/reviews",
    "http://localhost:3000/consultation",
    "http://localhost:3000/materials/carpet-tile/greenland"
)

foreach ($url in $urls) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing
        Write-Host "$url : $($response.StatusCode)"
    } catch {
        Write-Host "$url : FAILED - $($_.Exception.Message)"
    }
}
