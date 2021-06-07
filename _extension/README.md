# unsplash-code-actions

- Open repo in VSCode
- Press `F5` to test, a new vscode window with the extension loaded will open
- Open the `sample-app` folder from the new window (located in `test/sample-app`)
- Use "Reload window" command in the test vscode window whenever you make a change to the extension code

### Building a new version

- Install `vsce` using `npm i -g vsce` (VSCode extension manager)
- Run `vsce package` and commit that change

### Installing the extension

This extension isn't published on the marketplace (yet) so we're using a `.vsix` file to install it. The `master` branch
should contain the latest `vsix` and we can run `code --install-extension {PATH_TO_VSIX}` to install

You can also uninstall it with `code --uninstall-extension {PATH_TO_VSIX}`.


### Improvements

- Don't provide a code action if the namespace is already in scope
- Insert suggestions in VSCode's completion https://github.com/Asana/typescript-namespace-imports-vscode-plugin/blob/05ca34e350166b0d2189f0625712cb3228e28e1d/src/extension.ts#L29-L30
- Re-configure code actions when user's settings change to avoid having the reload the window