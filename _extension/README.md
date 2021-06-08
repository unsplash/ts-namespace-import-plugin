# unsplash-code-actions

## Contribute

- Build latest extension code by doing `yarn run compile`
- Run `yarn link` from the root project
- Run `yarn link "ts-refactor-tools"` from the `_extension` folder.
- Open a new VSCode directly from the `_extension` folder and press `F5` which will compile the extension code as well
as embedding the plugin code. Next a new VSCode will open with the extension loaded, you can then test it there.
- From now on, the plugin needs to be re-compiled when changes are made. The extension _technically_ watches changes automatically.
- Don't forget to "Reload Window" in the extension host window to apply latest changes