# ts-refactor-tools

Collection of code actions available as a typescript plugin.

## Installation

```sh
yarn add @unsplash/ts-refactor-tools
```

Then add the following to your `tsconfig.json`.

```json
{
  "compilerOptions": {
    // ...other options
    "plugins": [
      {
        "name": "@unsplash/ts-refactor-tools"
      }
    ]
  }
}
```

## Configuration

### Namespace imports

This plugin can help with importing common namespaces into your modules. You can learn more about namespace imports [here](https://unsplash.com/blog/organizing-typescript-modules/)

```json
{
  "compilerOptions": {
    // ...other options
    "plugins": [
      {
        "name": "@unsplash/ts-refactor-tools",
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
yarn link @unsplash/ts-refactor-tools from another repo
yarn run compile # when you make changes here to reflect in your target repo
```