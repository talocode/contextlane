# Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Build: `npm run build`
4. Test: `npm test`
5. Pack: `npm pack`
6. Verify: `npm install -g ./talocode-contextlane-*.tgz` then `contextlane demo`
7. Publish: `npm publish --access public`
8. Git tag: `git tag v<version> && git push origin v<version>`
9. Release: `gh release create v<version> ...`
