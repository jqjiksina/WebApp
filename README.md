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

Here's detailed steps for deploying back-end project with python in Anaconda.

**Since I havenot wrapped the backend project into docker, so for now, just run the project on the host machine.**

### Firstly, import and apply the environment.yml with conda.

Open commmand line in `webAi_backEnd/`, and input commands below:
```sh
conda create -f environment.yml
```
And you will get the conda environment properly.

### Secondly, get into the environment and run it.

Open commmand line in root directory, and input commands below:
```sh
conda activate webAi
python webAi_backEnd/app/main.py
```
And it would be successfully running on `localhost:8888`.

If you want it running on different port, just open `main.py` and change contents below:
```python
if __name__ == '__main__':
    uvicorn.run('main:app',port=8888,host='localhost',reload=True) # 将port=8888改为想要发布的端口即可
```