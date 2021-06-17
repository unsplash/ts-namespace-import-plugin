# unsplash-code-actions

## Contribute

- Build latest extension code by doing `yarn run compile`
- Run `yarn link` from the root project
- Run `yarn link "ts-refactor-tools"` from the `_extension` folder.
- Open a new VSCode directly from the `_extension` folder and press `F5` which will compile the extension code as well
as embedding the plugin code. Next a new VSCode will open with the extension loaded, you can then test it there.
- From now on, the plugin needs to be re-compiled when changes are made. The extension _technically_ watches changes automatically.
- Don't forget to "Reload Window" in the extension host window to apply latest changes

### Improvements

- Insert suggestions in VSCode's completion https://github.com/Asana/typescript-namespace-imports-vscode-plugin/blob/05ca34e350166b0d2189f0625712cb3228e28e1d/src/extension.ts#L29-L30
- Re-configure code actions when user's settings change to avoid having the reload the window
