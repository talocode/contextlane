# Citation Tracking

Every ingested chunk is tracked with a citation that includes:

- Source ID
- File name or URL label
- Line range (start line, end line)
- Content quote (first 200 chars)

## Citation Format

```
[filename:line_number]
```

## Example

```
[README.md:1]
```

Citations are stored in `citations.json` in each run's artifact folder and linked to facts, decisions, and actions.
