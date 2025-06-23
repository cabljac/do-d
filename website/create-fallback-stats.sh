#!/bin/bash

echo "Creating fallback stats.html..."

# Get actual file sizes
HTML_SIZE=$(ls -lh dist/index.html | awk '{print $5}')
CSS_FILE=$(find dist/assets -name "*.css" | head -1)
CSS_SIZE=$(ls -lh "$CSS_FILE" | awk '{print $5}')
JS_FILE=$(find dist/assets -name "*.js" | head -1)
JS_SIZE=$(ls -lh "$JS_FILE" | awk '{print $5}')

cat > dist/stats.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bundle Analysis - Virtual Tabletop</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; }
        h1 { color: #333; }
        .file-list { background: #f8f9fa; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
        .file-item { margin: 0.5rem 0; padding: 0.5rem; background: white; border-radius: 4px; }
        .size { color: #666; font-family: monospace; }
        .timestamp { color: #999; font-size: 0.9em; margin-top: 2rem; }
    </style>
</head>
<body>
    <h1>Bundle Analysis</h1>
    <p>Bundle size analysis for the Virtual Tabletop application.</p>
    
    <div class="file-list">
        <h3>Generated Files:</h3>
        <div class="file-item">
            <strong>index.html</strong> <span class="size">$HTML_SIZE</span>
        </div>
        <div class="file-item">
            <strong>$(basename "$CSS_FILE")</strong> <span class="size">$CSS_SIZE</span>
        </div>
        <div class="file-item">
            <strong>$(basename "$JS_FILE")</strong> <span class="size">$JS_SIZE</span>
        </div>
    </div>
    
    <p class="timestamp">Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")</p>
    <p><em>Note: This is a simplified analysis. For detailed bundle visualization, check the build logs.</em></p>
</body>
</html>
EOF
echo "Fallback stats.html created"
ls -lh dist/stats.html 