# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/e2e.spec.ts >> Vekil Application - Full Test Suite >> STAGE 7: Announcements >> 7.1 - Announcements page loads
- Location: tests/e2e.spec.ts:301:9

# Error details

```
Error: page.evaluate: SyntaxError: "undefined" is not valid JSON
    at JSON.parse (<anonymous>)
    at eval (eval at evaluate (:302:30), <anonymous>:2:26)
    at UtilityScript.evaluate (<anonymous>:304:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
```

# Page snapshot

```yaml
- 'heading "Application error: a client-side exception has occurred while loading vekil.tasci.cloud (see the browser console for more information)." [level=2] [ref=e4]'
```