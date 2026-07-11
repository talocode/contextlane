# Cloud Auth Mode

Local usage is open-source and keyless.

## Enabling Cloud Mode

```bash
export CONTEXTLANE_CLOUD_MODE=true
export TALOCODE_API_KEY=your_key_here
```

## Behavior

- Local mode: no API key needed, all endpoints open
- Cloud mode: mutation/search/recall endpoints require auth
- Health/capabilities/pricing remain public

## Auth Methods

Authorization header:

```
Authorization: Bearer <TALOCODE_API_KEY>
```

X-Api-Key header:

```
X-Api-Key: <TALOCODE_API_KEY>
```
