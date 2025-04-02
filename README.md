# AiWeb_frontEnd

In this section, we will help you start deploying front-end project with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

# AiWeb_backEnd

In this section, we will help you start deploying back-end project with Python in Anaconda.

## Installing Anaconda

if you havenot installed Anaconda, I have to tell you Anaconda is a great environment manager for python project.

- convenient environment management

Anoconda manage python project primarily by commmands below:
```sh
conda env list                   # to see how many environments you have created in anaconda.
conda create env <your_env_name> # create a new environment named <your_env_name>
conda activate <your_env_name>   # activate and go into the environment
conda deactivate <your_env_name> # deactivate and go out of the environment
```
All the environments you create are **seperated**. This means you'll not get crazy about the collisions between packages of diffrent versions, and you'll be free to set up packages of diffrent versions in different environments.
