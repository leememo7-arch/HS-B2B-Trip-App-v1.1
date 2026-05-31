$content = [System.IO.File]::ReadAllText("d:\project\Index.html", [System.Text.Encoding]::UTF8)
# 마지막 script 태그 전체를 찾아서 외부 app.js 링크로 치환
$regex = [regex] '(?s)<script>(?!.*<script>).*?</script>'
$newContent = $regex.Replace($content, '<script src="app.js"></script>')
[System.IO.File]::WriteAllText("d:\project\Index.html", $newContent, [System.Text.Encoding]::UTF8)
Write-Output "Success: Index.html script tag replaced"
