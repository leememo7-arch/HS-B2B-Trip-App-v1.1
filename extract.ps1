$content = [System.IO.File]::ReadAllText("d:\project\Index.html", [System.Text.Encoding]::UTF8)
$regex = [regex] '(?s)<script>(?!.*<script>)(.*?)</script>'
$match = $regex.Match($content)
if ($match.Success) {
    [System.IO.File]::WriteAllText("d:\project\app.js", $match.Groups[1].Value, [System.Text.Encoding]::UTF8)
    Write-Output "Success: app.js extracted"
} else {
    Write-Output "Failed to find match"
}
