# TypeScript Design Patterns

TypeScript Design Patterns by Packt. It contains all the supporting project
files necessary to work through the book from start to finish.

## Instructions and Navigation

This is the code repository for
[TypeScript Design Patterns][typescript-design-patterns], published by Packt.
There are no additional code bundle for the following chapters:

- **Chapter 8** - SOLID Principles
- **Chapter 9** - The Road to Enterprise Application

Chapter 8 is mainly about explaining SOLID principles, so the code bundles are
about concepts without actual implementation. Chapter 9 is about a workflow and
related configurations, so it is rather trivial to put them as code bundles
into files.

### Cloning and Browsing

To clone this repository, you will need to install [Git][git] and run
`git clone` command with the URL of this repository:

```sh
git clone https://github.com/PacktPublishing/TypeScript-Design-Patterns.git
```

In `package.json` file, we have already added the dependency of TypeScript
module, and configured it as the language server of Visual Studio Code with
`.vscode/settings.json`. To browse code in this repository with Visual Studio
Code, you can simply install the dependency using `npm install` and then open
the root directory of this repository as a folder in Visual Studio Code.

### Compiling Code

To see how would the compiled JavaScript files look like, you can use command
`npm run tsc -- -p <chapter-folder>` to compile. For example, if you want to
compile code in `chapter-1`, execute following command after `npm install`:

```sh
npm run tsc -- -p chapter-1
```

If you have compatible TypeScript compiler installed globally, you can just use
the global `tsc` command to compile target code bundle.

Please see Chapter 1 of the book for more information.

## Description

TypeScript Design Patterns is a collection of the most important patterns you
need to improve your applications' performance and your productivity. The
journey starts by explaining the current challenges when designing and
developing an application and how you can solve these challenges by applying
the correct design pattern and best practices.

## Related Typescript Products:

- [TypeScript Essentials][typescript-essentials]
- [TypeScript Blueprints][typescript-blueprints]
- [Mastering TypeScript][mastering-typescript]

[typescript-design-patterns]: https://www.packtpub.com/application-development/typescript-design-patterns?utm_source=github&utm_medium=repository&utm_campaign=9781785280832
[git]: https://git-scm.com/
[typescript-essentials]: https://www.packtpub.com/web-development/typescript-essentials?utm_source=github&utm_medium=repository&utm_campaign=9781782170808
[typescript-blueprints]: https://www.packtpub.com/application-development/typescript-blueprints?utm_source=github&utm_medium=repository&utm_campaign=9781782170808
[mastering-typescript]: https://www.packtpub.com/web-development/mastering-typescript?utm_source=github&utm_medium=repository&utm_campaign=9781782170808
### Download a free PDF

 <i>If you have already purchased a print or Kindle version of this book, you can get a DRM-free PDF version at no cost.<br>Simply click on the link to claim your free PDF.</i>
<p align="center"> <a href="https://packt.link/free-ebook/9781785280832">https://packt.link/free-ebook/9781785280832 </a> </p>