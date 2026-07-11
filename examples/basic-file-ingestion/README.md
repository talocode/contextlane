# Basic File Ingestion

```bash
# Create a sample file
echo "# My Project
This project is awesome.
TODO: Write tests
Decision: Use TypeScript
" > sample.md

# Ingest it
contextlane ingest sample.md

# Recall what we learned
contextlane recall "My Project"
```
