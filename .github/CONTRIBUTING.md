# Contributing to Zirco

Are you looking for a chance to get involved in Zirco's development? Have you found a bug or a feature you'd like added to Zirco? If so, you're in the right place! This document will help you get started with contributing to Zirco.

Are you new to open source software in general? Please take a look at [opensource.guide](https://opensource.guide/) for a great introduction to the world of open source.

## I've found a bug!

Congratulations! Finding compiler bugs is a great feat. Please go to the "issues" tab at the top of our GitHub repository and create a bug report using the template you will find there. Don't worry if you aren't 100% sure, it's better to report than let it go unnoticed!

## I want to suggest a new feature!

Great! We love new ideas. Please go to the "issues" tab at the top of our GitHub repository and create a feature request using the template you will find there.

## I want to contribute code!

Awesome! We love new contributors. Please go to the "issues" tab at the top of our GitHub repository and look for issues with the "help wanted" label. If you find one you'd like to work on, please leave a comment on the issue to let us know. We'll be happy to help you get started.

Please read the "How to build zrc" section below as well.

## How to build zrc

This section is a quick overview on getting started with the tooling zrc uses to install.

Before you can get started, you will need Node.js. You can download it from [nodejs.org](https://nodejs.org/en/) or use a version manager like [nvm](https://github.com/nvm-sh/nvm) or [n](https://npmjs.com/package/n).

The next step is to obtain the latest source code. GitHub provides downloads for zip/tgz files, but to make developing easier, we suggest you clone the repository with Git. If you plan to make changes, you can [fork](https://github.com/zirco-lang/zrc/fork) the repository first.

```
$ git clone https://github.com/zirco-lang/zrc
```

Once you have the source code downloaded, you will also need Yarn installed. This can be done with npm:

```
$ npm install --global yarn
```

Now that you have Yarn installed, you can install the dependencies for zrc:

```
$ yarn
```

This will also set up Husky for commit hooks.

Once you've gotten to this step, you can execute Zirco with `yarn start`, run tests with `yarn test`, and otherwise, get to coding! Have fun!
