# ts-namespace-import-plugin

This plugin can help with importing common namespaces into your modules. What is a namespace import you may ask?
You can learn more about them [here](https://unsplash.com/blog/organizing-typescript-modules/) but in short it looks like the following:

```ts
import * as SomeNamespace from "path/to/module";

SomeNamespace.doStuff();
```

We like them because it gives context when a function is used as opposed to have a bunch of named imports. It also reduces naming conflicts.

## Installation

```sh
yarn add --dev @unsplash/ts-namespace-import-plugin
```

Then add the following to your `tsconfig.json`.

```json
{
  "compilerOptions": {
    // ...other options
    "plugins": [
      {
        "name": "@unsplash/ts-namespace-import-plugin"
      }
    ]
  }
}
```

## Configuration

```json
{
  "compilerOptions": {
    // ...other options
    "plugins": [
      {
        "name": "@unsplash/ts-namespace-import-plugin",
        "namespaces": {
          "MyNamespace": {
            "importPath": "path/to/module"
          }
        }
      }
    ]
  }
}
```

One configured, TS should prompt you with a code action whenever you write `MyNamespace` in any module, for instance:

```ts
// import * as MyNamespace from 'path/to/module'  <--- This would be added when the code action runs on `MyNamescape`
MyNamespace.doFoo();
```

## Contribute

```sh
yarn link # From this repo
yarn link @unsplash/ts-namespace-import-plugin # from another repo
yarn run compile # when you make changes here to reflect in your target repo
```

If you need to log things inside this plugin, they will show up in the `tsserver.log` which can be opened from your target repo using `CMD+SHIFT+P` > `Open TS Server Log`. Keep in mind that everytime you reload your VSCode to take latest changes into account, you'll have to run this again because the file may change location on your filesystem. You can also [read this](https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin#debugging) for more info.
